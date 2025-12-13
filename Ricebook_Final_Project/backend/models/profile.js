//profile.js


const mongoose = require('mongoose')
const profileSchema = new mongoose.Schema({
    username: {
        type: String, 
        required: true, 
        unique: true
    }, 
    display:{
        type: String, 
        default: ""
    }, 
    headline: {
        type: String, 
        default: "Welcome to RiceBook!"
    },
    email:{
        type: String, 
        default: ""
    }, 
    zipcode:{
        type: String, 
        default: ""
    }, 
    dob:{
        type: String, 
        default: ""
    }, 
    phone:{
        type:String,
        default: ""
    }, 
    avatar: {
        type: String,
        default: ""
    },
    following: { 
        type: [String], 
        default: [] 
    }
})



module.exports = mongoose.model('profiles', profileSchema)
//module.exports = Profile