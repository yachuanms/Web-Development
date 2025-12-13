// src/profile.js
const Profile = require('../models/profile');
const { isLoggedIn } = require('./auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// ======== Cloudinary Config ========
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer();

const canUseCloudinary =
    Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

function bufferToDataUrl(file) {
    const mime = file.mimetype || 'application/octet-stream';
    const base64 = file.buffer.toString('base64');
    return `data:${mime};base64,${base64}`;
}

// ======== Helper: Upload image to Cloudinary ========
function uploadImage(req, res, next) {
    if (!req.file) return next();

    if (!canUseCloudinary) {
        req.imageUrl = bufferToDataUrl(req.file);
        return next();
    }

    const stream = cloudinary.uploader.upload_stream((err, result) => {
        if (result) {
            req.imageUrl = result.secure_url;
            next();
        } else {
            console.error("Cloudinary upload error:", err);
            req.imageUrl = bufferToDataUrl(req.file);
            next();
        }
    });

    streamifier.createReadStream(req.file.buffer).pipe(stream);
}



// =========================================================
//                  GET profile of logged-in user
// =========================================================
module.exports = (app) => {

    async function findProfile(username, res) {
        const profile = await Profile.findOne({ username });
        if (!profile) {
            res.status(404).send({ error: "Profile not found" });
            return null;
        }
        return profile;
    }

    app.get('/profile', isLoggedIn, async (req, res) => {
        const username = req.username;
        const profile = await findProfile(username, res);
        if (!profile) return;

        res.send({
            username: profile.username,
            display: profile.display,
            headline: profile.headline,
            email: profile.email,
            zipcode: profile.zipcode,
            dob: profile.dob,
            phone: profile.phone,
            avatar: profile.avatar
        });
    });



    // =====================================================
    // GET /profile/:user → 給文章或留言取 display name 用
    // =====================================================
    app.get('/profile/:user', isLoggedIn, async (req, res) => {
        const user = req.params.user;
        const profile = await findProfile(user, res);
        if (!profile) return;

        res.send({
            username: profile.username,
            display: profile.display,
            headline: profile.headline,
            avatar: profile.avatar
        });
    });



    // =====================================================
    //          GET headline of logged-in user
    // =====================================================
    app.get('/headline', isLoggedIn, async (req, res) => {
        const username = req.username;
        const profile = await findProfile(username, res);
        if (!profile) return;

        res.send({ username, headline: profile.headline });
    });

    // =====================================================
    //          GET headline of specified user
    // =====================================================
    app.get('/headline/:user', isLoggedIn, async (req, res) => {
        const user = req.params.user;
        const profile = await findProfile(user, res);
        if (!profile) return;

        res.send({ username: user, headline: profile.headline });
    });



    // =====================================================
    //          PUT update headline
    // =====================================================
    app.put('/headline', isLoggedIn, async (req, res) => {
        const username = req.username;
        const newHeadline = req.body.headline;

        if (!newHeadline) {
            return res.status(400).send({ error: "Headline required" });
        }

        const updated = await Profile.findOneAndUpdate(
            { username },
            { headline: newHeadline },
            { new: true }
        );

        res.send({
            username,
            headline: updated.headline
        });
    });



    // =====================================================
    //                 GET avatar
    // =====================================================
    app.get('/avatar', isLoggedIn, async (req, res) => {
        const username = req.username;
        const profile = await findProfile(username, res);
        if (!profile) return;

        res.send({ username, avatar: profile.avatar });
    });



    // =====================================================
    //               PUT avatar (Cloudinary)
    // =====================================================
    app.put('/avatar',
        isLoggedIn,
        upload.single('image'),
        uploadImage,
        async (req, res) => {
            const username = req.username;

            if (!req.imageUrl) {
                return res.status(400).send({ error: "Image upload failed" });
            }

            const updated = await Profile.findOneAndUpdate(
                { username },
                { avatar: req.imageUrl },
                { new: true }
            );

            res.send({
                username,
                avatar: updated.avatar
            });
        }
    );



    // =====================================================
    //      PUT update profile fields (email, zipcode, phone…)
    // =====================================================
    app.put('/profile', isLoggedIn, async (req, res) => {
        const username = req.username;

        const { display, email, zipcode, phone, dob } = req.body;

        const updated = await Profile.findOneAndUpdate(
            { username },
            { display, email, zipcode, phone, dob },
            { new: true }
        );

        res.send({
            username,
            display: updated.display,
            email: updated.email,
            zipcode: updated.zipcode,
            phone: updated.phone,
            dob: updated.dob,
            avatar: updated.avatar,
            headline: updated.headline
        });
    });

    // =====================================================
    //          Email endpoints
    // =====================================================
    app.get('/email', isLoggedIn, async (req, res) => {
        const username = req.username;
        const profile = await findProfile(username, res);
        if (!profile) return;

        res.send({ username, email: profile.email || "" });
    });

    app.put('/email', isLoggedIn, async (req, res) => {
        const username = req.username;
        const { email } = req.body;

        if (!email) {
            return res.status(400).send({ error: "Email required" });
        }

        const updated = await Profile.findOneAndUpdate(
            { username },
            { email },
            { new: true }
        );

        res.send({ username, email: updated.email });
    });

    // =====================================================
    //          Zipcode endpoints
    // =====================================================
    app.get('/zipcode', isLoggedIn, async (req, res) => {
        const username = req.username;
        const profile = await findProfile(username, res);
        if (!profile) return;

        res.send({ username, zipcode: profile.zipcode || "" });
    });

    app.put('/zipcode', isLoggedIn, async (req, res) => {
        const username = req.username;
        const { zipcode } = req.body;

        if (!zipcode) {
            return res.status(400).send({ error: "Zipcode required" });
        }

        const updated = await Profile.findOneAndUpdate(
            { username },
            { zipcode },
            { new: true }
        );

        res.send({ username, zipcode: updated.zipcode });
    });

    // =====================================================
    //          Phone endpoints
    // =====================================================
    app.get('/phone', isLoggedIn, async (req, res) => {
        const username = req.username;
        const profile = await findProfile(username, res);
        if (!profile) return;

        res.send({ username, phone: profile.phone || "" });
    });

    app.put('/phone', isLoggedIn, async (req, res) => {
        const username = req.username;
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).send({ error: "Phone required" });
        }

        const updated = await Profile.findOneAndUpdate(
            { username },
            { phone },
            { new: true }
        );

        res.send({ username, phone: updated.phone });
    });

    // =====================================================
    //          DOB endpoint (GET only)
    // =====================================================
    app.get('/dob', isLoggedIn, async (req, res) => {
        const username = req.username;
        const profile = await findProfile(username, res);
        if (!profile) return;

        res.send({ username, dob: profile.dob || "" });
    });

};
