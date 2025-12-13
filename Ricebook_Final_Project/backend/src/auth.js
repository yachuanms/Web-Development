// src/auth.js

const md5 = require('md5');
const User = require('../models/user');
const Profile = require('../models/profile');
const { mergeAccounts } = require('./linking');

const sessions = {}; // sid -> { username, linkIntent?: string }
const cookieKey = 'sid';

function sessionCookieOptions() {
	const isProduction = process.env.NODE_ENV === 'production';
	return {
		maxAge: 3600 * 1000,
		httpOnly: true,
		sameSite: isProduction ? 'None' : 'Lax',
		secure: isProduction
	};
}

function getSessionRecord(sid) {
	const record = sid ? sessions[sid] : null;
	if (!record || !record.username) {
		return null;
	}
	return record;
}

function getSessionInfo(req) {
	const sid = req.cookies[cookieKey];
	const data = getSessionRecord(sid);
	if (!sid || !data) {
		return null;
	}
	return { sid, data };
}

function createSession(res, username, existingSid) {
	const sid = existingSid || md5(username + Date.now());
	const record = sessions[sid] || {};
	record.username = username;
	sessions[sid] = record;
	res.cookie(cookieKey, sid, sessionCookieOptions());
	return sid;
}

function clearSession(res, sid) {
	if (sid) {
		delete sessions[sid];
	}
	res.clearCookie(cookieKey);
}

function markLinkIntent(req, provider) {
	const sid = req.cookies[cookieKey];
	if (!sid) return;
	const record = sessions[sid];
	if (!record) return;
	record.linkIntent = provider;
}

function consumeLinkIntent(req) {
	const sid = req.cookies[cookieKey];
	if (!sid) return null;
	const record = sessions[sid];
	if (!record || !record.linkIntent) return null;
	const provider = record.linkIntent;
	delete record.linkIntent;
	return provider;
}

function isLoggedIn(req, res, next) {
	const sessionInfo = getSessionInfo(req);
	if (!sessionInfo) {
		return res.status(401).send({ error: 'Not logged in' });
	}
	req.username = sessionInfo.data.username;
	req.sessionData = sessionInfo.data;
	next();
}

async function register(req, res) {
	const { username, password, email, zipcode, dob, phone, display } = req.body;

	if (!username || !password) {
		return res.status(400).send({ error: 'Username and password required' });
	}

	const existingUser = await User.findOne({ username });
	if (existingUser) {
		return res.status(400).send({ error: 'Username already exists' });
	}

	const salt = username + Date.now();
	const hash = md5(salt + password);

	await User.create({
		username,
		salt,
		hash,
		email: email || '',
		authProviders: []
	});

	await Profile.create({
		username,
		display: display || username,
		headline: 'Welcome to RiceBook!',
		email: email || '',
		zipcode: zipcode || '',
		dob: dob || '',
		phone: phone || '',
		avatar: ''
	});

	createSession(res, username);
	res.send({ result: 'success', username });
}

async function login(req, res) {
	const { username, password } = req.body;

	if (!username || !password) {
		return res.status(400).send({ error: 'Username and password required' });
	}

	const user = await User.findOne({ username });
	if (!user) {
		return res.status(401).send({ error: 'User not found' });
	}

	if (!user.salt || !user.hash) {
		return res.status(403).send({ error: 'This account uses third-party login. Please sign in with Google or link a password in Profile.' });
	}

	const hash = md5(user.salt + password);
	if (hash !== user.hash) {
		return res.status(401).send({ error: 'Password incorrect' });
	}

	createSession(res, username);
	res.send({ result: 'success', username });
}

async function updatePassword(req, res) {
	const newPassword = req.body.password;

	if (!newPassword) {
		return res.status(400).send({ error: 'Password is required' });
	}

	const username = req.username;
	const newSalt = username + Date.now();
	const newHash = md5(newSalt + newPassword);

	const updatedUser = await User.findOneAndUpdate(
		{ username },
		{ salt: newSalt, hash: newHash },
		{ new: true }
	);

	if (!updatedUser) {
		return res.status(404).send({ error: 'User not found' });
	}

	res.send({ username, result: 'password updated' });
}

async function getCurrentAuthState(req, res) {
	const sessionInfo = getSessionInfo(req);
	if (!sessionInfo) {
		return res.send({ loggedIn: false });
	}

	const user = await User.findOne({ username: sessionInfo.data.username });
	if (!user) {
		return res.send({ loggedIn: false });
	}

	res.send({
		loggedIn: true,
		username: user.username,
		providers: user.authProviders || [],
		hasLocalPassword: Boolean(user.salt && user.hash)
	});
}

async function linkLocalAccount(req, res) {
	const { username: localUsername, password } = req.body;
	if (!localUsername || !password) {
		return res.status(400).send({ error: 'Username and password required' });
	}

	const currentUsername = req.username;
	if (currentUsername === localUsername) {
		return res.status(400).send({ error: 'You are already logged in as this account.' });
	}

	const localUser = await User.findOne({ username: localUsername });
	if (!localUser || !localUser.salt || !localUser.hash) {
		return res.status(404).send({ error: 'Local account not found or does not have a password.' });
	}

	const hash = md5(localUser.salt + password);
	if (hash !== localUser.hash) {
		return res.status(401).send({ error: 'Password incorrect' });
	}

	const mergedUser = await mergeAccounts(localUsername, currentUsername);
	createSession(res, mergedUser.username, req.cookies[cookieKey]);
	res.send({ result: 'linked', username: mergedUser.username, providers: mergedUser.authProviders });
}

async function unlinkProvider(req, res) {
	const provider = req.params.provider;
	const username = req.username;
	const user = await User.findOne({ username });
	if (!user) {
		return res.status(404).send({ error: 'User not found' });
	}

	const before = user.authProviders.length;
	user.authProviders = user.authProviders.filter((p) => p.provider !== provider);
	if (before === user.authProviders.length) {
		return res.status(400).send({ error: 'Provider not linked' });
	}

	const stillHasAuth = user.authProviders.length > 0 || (user.salt && user.hash);
	if (!stillHasAuth) {
		return res.status(400).send({ error: 'Cannot unlink the only login method.' });
	}

	await user.save();
	res.send({ result: 'unlinked', providers: user.authProviders });
}

module.exports = (app) => {
	app.get('/auth/me', getCurrentAuthState);
	app.post('/register', register);
	app.post('/login', login);
	app.put('/logout', isLoggedIn, (req, res) => {
		const sid = req.cookies[cookieKey];
		clearSession(res, sid);
		res.send({ result: 'OK' });
	});
	app.put('/password', isLoggedIn, updatePassword);
	app.post('/auth/link/local', isLoggedIn, linkLocalAccount);
	app.delete('/auth/link/:provider', isLoggedIn, unlinkProvider);
};

module.exports.isLoggedIn = isLoggedIn;
module.exports.createSession = createSession;
module.exports.getSessionInfo = getSessionInfo;
module.exports.cookieKey = cookieKey;
module.exports.markLinkIntent = markLinkIntent;
module.exports.consumeLinkIntent = consumeLinkIntent;
