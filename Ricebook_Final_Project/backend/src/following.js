const Profile = require('../models/profile')
const { isLoggedIn } = require('./auth')

// GET /following
async function getFollowing(req, res) {
    const username = req.username

    const profile = await Profile.findOne({ username })
    if (!profile) {
        return res.status(404).send({ error: "User not found" })
    }

    res.send({ username, following: profile.following })
}

// PUT /following/:user
async function addFollowing(req, res) {
    const username = req.username
    const userToFollow = req.params.user

    if (username === userToFollow) {
        return res.status(400).send({ error: "You cannot follow yourself" })
    }

    const profile = await Profile.findOne({ username })
    if (!profile) {
        return res.status(404).send({ error: "User not found" })
    }

    // Ensure the user to follow actually exists
    const target = await Profile.findOne({ username: userToFollow })
    if (!target) {
        return res.status(404).send({ error: "User to follow not found" })
    }

    // 已經追蹤過
    if (profile.following.includes(userToFollow)) {
        return res.status(400).send({ error: "Already following this user" })
    }

    // 把對方加入 following array
    profile.following.push(userToFollow)
    await profile.save()

    res.send({ username, following: profile.following })
}

// DELETE /following/:user
async function removeFollowing(req, res) {
    const username = req.username
    const userToRemove = req.params.user

    const profile = await Profile.findOne({ username })
    if (!profile) {
        return res.status(404).send({ error: "User not found" })
    }

    profile.following = profile.following.filter(u => u !== userToRemove)
    await profile.save()

    res.send({ username, following: profile.following })
}

module.exports = (app) => {
    app.get('/following', isLoggedIn, getFollowing)
    app.put('/following/:user', isLoggedIn, addFollowing)
    app.delete('/following/:user', isLoggedIn, removeFollowing)
}
