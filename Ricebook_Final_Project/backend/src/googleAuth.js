const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/user');
const Profile = require('../models/profile');
const { mergeAccounts } = require('./linking');
const authHelpers = require('./auth');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

async function generateUniqueUsername(baseName) {
  const sanitized = (baseName || 'google-user').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'googleuser';
  let candidate = `google_${sanitized}`;
  let counter = 1;
  while (await User.findOne({ username: candidate })) {
    candidate = `google_${sanitized}_${counter}`;
    counter += 1;
  }
  return candidate;
}

async function ensureProfile(username, profileData) {
  const existing = await Profile.findOne({ username });
  if (existing) {
    return existing;
  }
  return Profile.create({
    username,
    display: profileData.display || username,
    email: profileData.email || '',
    headline: 'Welcome to RiceBook!',
    avatar: profileData.avatar || '',
    zipcode: '',
    dob: '',
    phone: ''
  });
}

async function addProviderToUser(user, providerInfo) {
  const alreadyLinked = user.authProviders.some(
    (p) => p.provider === providerInfo.provider && p.providerId === providerInfo.providerId
  );
  if (!alreadyLinked) {
    user.authProviders.push(providerInfo);
    await user.save();
  }
  return user;
}

async function handleGoogleUser(req, googleProfile) {
  const email = googleProfile.emails && googleProfile.emails[0] ? googleProfile.emails[0].value : '';
  const avatar = googleProfile.photos && googleProfile.photos[0] ? googleProfile.photos[0].value : '';
  const displayName = googleProfile.displayName || (email ? email.split('@')[0] : 'Google User');
  const providerInfo = {
    provider: 'google',
    providerId: googleProfile.id,
    email,
    displayName
  };

  const linkIntent = authHelpers.consumeLinkIntent(req);
  const sessionInfo = authHelpers.getSessionInfo(req);

  if (linkIntent === 'google' && sessionInfo) {
    const currentUsername = sessionInfo.data.username;
    const primaryUser = await User.findOne({ username: currentUsername });

    if (!primaryUser) {
      throw new Error('Primary account not found for linking');
    }

    const existingGoogleUser = await User.findOne({
      authProviders: { $elemMatch: { provider: 'google', providerId: providerInfo.providerId } }
    });

    if (existingGoogleUser && existingGoogleUser.username !== currentUsername) {
      await mergeAccounts(currentUsername, existingGoogleUser.username);
    }

    const refreshedUser = await User.findOne({ username: currentUsername });
    await addProviderToUser(refreshedUser, providerInfo);
    return { username: refreshedUser.username };
  }

  const userByProvider = await User.findOne({
    authProviders: { $elemMatch: { provider: 'google', providerId: providerInfo.providerId } }
  });
  if (userByProvider) {
    return { username: userByProvider.username };
  }

  if (email) {
    const userByEmail = await User.findOne({ email });
    if (userByEmail) {
      await addProviderToUser(userByEmail, providerInfo);
      return { username: userByEmail.username };
    }
  }

  const username = await generateUniqueUsername(displayName);
  const newUser = await User.create({
    username,
    salt: '',
    hash: '',
    email,
    authProviders: [providerInfo]
  });
  await ensureProfile(username, { display: displayName, email, avatar });
  return { username: newUser.username };
}

function registerGoogleAuth(app) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('Google OAuth is not configured. Skipping Google auth routes.');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
        passReqToCallback: true
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const result = await handleGoogleUser(req, profile);
          done(null, result);
        } catch (err) {
          done(err);
        }
      }
    )
  );

  app.get(
    '/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' })
  );

  app.get(
    '/auth/google/link',
    authHelpers.isLoggedIn,
    (req, res, next) => {
      authHelpers.markLinkIntent(req, 'google');
      passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' })(req, res, next);
    }
  );

  app.get(
    '/auth/google/callback',
    passport.authenticate('google', {
      failureRedirect: `${CLIENT_URL}/landing?google=fail`,
      session: false
    }),
    (req, res) => {
      const sid = req.cookies[authHelpers.cookieKey];
      authHelpers.createSession(res, req.user.username, sid);
      res.redirect(`${CLIENT_URL}/landing?google=success`);
    }
  );
}

module.exports = registerGoogleAuth;
