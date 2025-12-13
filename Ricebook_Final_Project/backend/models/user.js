//user.js

const mongoose = require('mongoose');

const thirdPartySchema = new mongoose.Schema({
    provider: { type: String, required: true },
    providerId: { type: String, required: true },
    email: { type: String, default: "" },
    displayName: { type: String, default: "" }
}, { _id: false });

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    salt: {
        type: String,
        default: ""
    },
    hash: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        default: ""
    },
    authProviders: {
        type: [thirdPartySchema],
        default: []
    }
});

const User = mongoose.model('user', userSchema);

module.exports = User;
