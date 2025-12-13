const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
  author: String,
  text: String,
  date: {
    type: Date,
    default: Date.now
  }
})

const articleSchema = new mongoose.Schema({
  id: Number,
  author: String,
  body: String,
  date: {
    type: Date,
    default: Date.now
  },
  image: {
    type: String,
    default: ""
  },
  comments: [commentSchema]   // 新增留言陣列
})

module.exports = mongoose.model('articles', articleSchema)
