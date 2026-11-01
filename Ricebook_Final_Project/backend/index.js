// index.js
// Express server + MongoDB + CORS + 所有 routes

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const passport = require('passport');

const connectionString = process.env.MONGO_URI;

// connect to mongoDB
mongoose.connect(connectionString)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log("MongoDB connection error: ", err));

const app = express();
app.set('trust proxy', 1);

// 記得把下面的 surge 網址換成真的 deploy 的 frontend 網址!!!!
const allowedOrigins = [
  "http://localhost:5173",
  "https://yh167-hw5.surge.sh/"
];

// Allow CORS and reflect the request origin so that cookies (credentials)
// can be sent from different frontend origins. In production you may want
// to restrict this to known frontend URLs.
app.use(cors({
  origin: true,
  credentials: true
}));

// JSON & cookies
app.use(bodyParser.json());
app.use(cookieParser());
app.use(passport.initialize());

// Routes
const auth = require('./src/auth');
auth(app);

const registerGoogleAuth = require('./src/googleAuth');
registerGoogleAuth(app);

const profileRoutes = require('./src/profile');
profileRoutes(app);

const articleRoutes = require('./src/articles');
articleRoutes(app);

const followingRoutes = require('./src/following');
followingRoutes(app);

// Root
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Heroku 不能寫死 3000
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
