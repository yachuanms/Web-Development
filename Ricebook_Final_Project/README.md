# RiceBook Final Project

RiceBook is a simplified social networking platform inspired by Twitter and Instagram.  
This project was built as the final assignment for **COMP 531 – Web Development** at Rice University.  
It includes a fully implemented **frontend (React + TypeScript)** and **backend (Node.js + Express + MongoDB)**.

The application is containerized using **Docker Compose**, allowing the frontend, backend, and MongoDB database to run together in a reproducible local development environment.

---

## 🌐 Features

### 🔐 Authentication
- User registration, login, and logout
- Secure password hashing
- Session-based authentication
- Google OAuth support (requires additional local configuration)

### 📝 Posts & Feed
- Create, edit, and delete posts
- Image upload via Cloudinary
- Feed shows posts from followed users

### 👥 Following System
- Follow / unfollow other users
- Feed dynamically updates based on following list

### 👤 Profile Management
- Update display name, headline, email, and zipcode
- Upload and update profile picture

---

## 🛠️ Tech Stack

**Frontend**
- React (TypeScript) + Vite
- React Router
- CSS / Custom Components / Bootstrap
- Cloudinary for image upload

**Backend**
- Node.js + Express.js
- MongoDB + Mongoose
- Session-based authentication
- RESTful API architecture

**DevOps**
- Docker
- Docker Compose
- MongoDB persistent volume

---

## 📁 Project Structure

```text
Ricebook_Final_Project/
├── backend/              # Node.js + Express server
│   ├── Dockerfile
│   ├── .dockerignore
│   └── .env.example
├── frontend/             # React + TypeScript application
│   ├── Dockerfile
│   └── .dockerignore
├── compose.yaml          # Docker Compose configuration
├── .gitignore
└── README.md
```

---

## 🐳 Running with Docker

### 📋 Prerequisites

- Docker Desktop
- Docker Compose

### 🚀 1. Clone the Repository

```bash
git clone https://github.com/yachuanms/Web-Development.git
cd Web-Development/Ricebook_Final_Project
```

### 🔑 2. Configure Environment Variables

Create a `backend/.env` file from the provided example:

```bash
cp backend/.env.example backend/.env
```

Replace the placeholder values with your own credentials for Google OAuth and Cloudinary.

**Note:** Never commit `.env` files or API credentials to GitHub.

MongoDB is configured automatically through Docker Compose, so a MongoDB Atlas account is not required.

### ▶️ 3. Start the Application

```bash
docker compose up -d --build
```

Docker Compose starts three services:
- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express
- **Database:** MongoDB 7

### 🌐 4. Access the Application

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3000 |

### 🛑 5. Stop the Application

```bash
docker compose down
```

MongoDB data is stored in a persistent Docker volume, so data remains available when containers are stopped and restarted.

To stop the containers **and delete the database volume**:

```bash
docker compose down -v
```

**Warning:** The `-v` option permanently removes the locally stored MongoDB data.

---

## 🏗️ Docker Architecture

```text
Browser
   |
   v
React + TypeScript (Port 5173)
   |
   | REST API
   v
Node.js + Express (Port 3000)
   |
   | Docker Internal Network
   v
MongoDB 7
   |
   v
Persistent Docker Volume
```

Docker Compose orchestrates the frontend, backend, and database containers, simplifying local setup and eliminating the need for an external MongoDB instance during development.

---

## 🧪 Testing & Development Notes

- Successfully tested user registration, login, posting, following users, and profile picture updates in the Docker environment.
- Verified MongoDB data persistence after stopping and recreating containers.
- Google OAuth requires additional local configuration, including an authorized redirect URI in Google Cloud Console. It has not yet been verified in the Docker environment.
- Docker configuration is intended for local development rather than production deployment.