# RiceBook Backend

This folder contains the backend server for the RiceBook project.  
It is built using **Node.js, Express.js, and MongoDB**, and provides all RESTful API endpoints for authentication, posts, following, and profile management.

---
## 🚀 Running the Backend

### Install dependencies:
```
npm install
```

Start server:
```
npm start
```

### ✨ Backend Features
- Express server with modular route design
- MongoDB + Mongoose models
- User authentication (sessions)
- Profile editing endpoints
- Posting system with image support
- Following / unfollowing APIs


### 🔑 Environment Variables

Create a file .env with the following (values hidden for security):
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=your_backend_callback_url
CLIENT_URL=your_frontend_url
VITE_API_URL=your_vite_api_url
```

Make sure .gitignore includes:
```
.env
```

### 📄 API Summary
Authentication
- POST /register
- POST /login
- GET /logout

Profile
- GET /headline
- PUT /headline
- PUT /email
- PUT /zipcode
- PUT /avatar

Articles
- GET /articles
- POST /article
- PUT /articles/:id

Following
- GET /following/:user
- PUT /following/:user
- DELETE /following/:user
