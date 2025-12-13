// src/articles.js

const Article = require('../models/article');
const { isLoggedIn } = require('./auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

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

function parsePositiveInt(value) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

// GET /articles 或 /articles/:id
async function getArticles(req, res) {
  // case 1: /articles/:id
  if (req.params.id) {
    const id = parseInt(req.params.id);
    const article = await Article.findOne({ id });

    if (!article) {
      return res.status(404).send({ error: "Article not found" });
    }
    return res.send({ articles: [article] });
  }

  // case 2: /articles 或 /articles?author=xxx
  const author = req.query.author;
  const query = author ? { author } : {};   // 不給 author 的話，回傳全部

  const page = parsePositiveInt(req.query.page);
  const pageSize = parsePositiveInt(req.query.pageSize) || 10;

  if (page) {
    const skip = (page - 1) * pageSize;
    const [articles, total] = await Promise.all([
      Article.find(query).sort({ date: -1 }).skip(skip).limit(pageSize),
      Article.countDocuments(query)
    ]);

    return res.send({
      articles,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    });
  }

  const articles = await Article.find(query).sort({ date: -1 });
  res.send({ articles });
}

// POST /article  (文字 + 照片)
async function postArticle(req, res) {
  const username = req.username;
  const body = req.body.body;

  if (!body) {
    return res.status(400).send({ error: "Article body required" });
  }

  const last = await Article.findOne().sort({ id: -1 });
  const nextId = last ? last.id + 1 : 1;

  const newArticle = await Article.create({
    id: nextId,
    author: username,
    body,
    date: new Date(),
    image: req.imageUrl || ""
  });

  res.send({ articles: [newArticle] });
}

// PUT /articles/:id  (更新 body + 圖片)
async function updateArticle(req, res) {
  const id = parseInt(req.params.id);
  const body = req.body.body;
  const removeImage = String(req.body.removeImage).toLowerCase() === 'true';

  if (!body || !body.trim()) {
    return res.status(400).send({ error: "Article body required" });
  }

  const username = req.username;
  const article = await Article.findOne({ id });

  if (!article) {
    return res.status(404).send({ error: "Article not found" });
  }

  if (article.author !== username) {
    return res.status(403).send({ error: "Not your article" });
  }

  article.body = body;
  if (req.imageUrl) {
    article.image = req.imageUrl;
  } else if (removeImage) {
    article.image = "";
  }
  article.date = new Date();
  await article.save();

  res.send({ articles: [article] });
}

async function deleteArticle(req, res) {
  const id = parseInt(req.params.id);
  const username = req.username;

  const article = await Article.findOne({ id });
  if (!article) {
    return res.status(404).send({ error: "Article not found" });
  }

  if (article.author !== username) {
    return res.status(403).send({ error: "Not your article" });
  }

  await Article.deleteOne({ id });
  res.send({ result: "deleted", id });
}

// POST /article/:id/comment
async function addComment(req, res) {
  const articleId = parseInt(req.params.id);
  const { text } = req.body;
  const username = req.username;

  if (!text || !text.trim()) {
    return res.status(400).send({ error: "Comment text required" });
  }

  const article = await Article.findOne({ id: articleId });
  if (!article) {
    return res.status(404).send({ error: "Article not found" });
  }

  const newComment = {
    author: username,
    text,
    date: new Date()
  };

  article.comments.push(newComment);
  await article.save();

  res.send({ comments: article.comments });
}

// PUT /article/:id/comment/:commentId  (更新留言)
async function updateComment(req, res) {
  const articleId = parseInt(req.params.id);
  const commentId = req.params.commentId;
  const { text } = req.body;
  const username = req.username;

  if (!text || !text.trim()) {
    return res.status(400).send({ error: "Comment text required" });
  }

  const article = await Article.findOne({ id: articleId });
  if (!article) {
    return res.status(404).send({ error: "Article not found" });
  }

  const comment =
    article.comments.id(commentId) ||
    article.comments.find((c) => c._id && c._id.toString() === commentId);
  if (!comment) {
    return res.status(404).send({ error: "Comment not found" });
  }

  if (comment.author !== username) {
    return res.status(403).send({ error: "Not your comment" });
  }

  comment.text = text;
  comment.date = new Date();
  await article.save();

  res.send({ comments: article.comments });
}

async function deleteComment(req, res) {
  const articleId = parseInt(req.params.id);
  const commentId = req.params.commentId;
  const username = req.username;

  const article = await Article.findOne({ id: articleId });
  if (!article) {
    return res.status(404).send({ error: "Article not found" });
  }

  const index = article.comments.findIndex((c) => {
    if (!c) return false;
    if (c._id && c._id.toString() === commentId) return true;
    return false;
  });

  const comment = index >= 0 ? article.comments[index] : null;
  if (!comment) {
    return res.status(404).send({ error: "Comment not found" });
  }

  if (comment.author !== username) {
    return res.status(403).send({ error: "Not your comment" });
  }

  article.comments.splice(index, 1);
  await article.save();

  res.send({ comments: article.comments });
}

module.exports = (app) => {
  app.get('/articles/:id', isLoggedIn, getArticles);
  app.get('/articles', isLoggedIn, getArticles);
  app.post('/article',
    isLoggedIn,
    upload.single('image'),
    uploadImage,
    postArticle
  );
  app.put('/articles/:id',
    isLoggedIn,
    upload.single('image'),
    uploadImage,
    updateArticle
  );
  app.delete('/articles/:id', isLoggedIn, deleteArticle);
  app.post('/article/:id/comment', isLoggedIn, addComment);
  app.put('/article/:id/comment/:commentId', isLoggedIn, updateComment);
  app.delete('/article/:id/comment/:commentId', isLoggedIn, deleteComment);
};
