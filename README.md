# ConnectHub – Mini Social Media Platform

[![Node.js](https://img.shields.io/badge/Node.js-v24.13.1-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.3.0-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen.svg)](https://www.mongodb.com/atlas)
[![JavaScript](https://img.shields.io/badge/Frontend-Vanilla%20JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/Design-HTML5%20%2F%20CSS3-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Render Deployment](https://img.shields.io/badge/Render-Deployed%20Live-success?logo=render&logoColor=white)](https://dashboard.render.com)
[![Internship](https://img.shields.io/badge/CodeAlpha-Task%202-blueviolet.svg)](https://www.codealpha.tech/)

> **ConnectHub** is a modern, responsive, full-stack mini social media platform inspired by Instagram and Facebook. Developed as part of the **CodeAlpha Full Stack Web Development Internship (Task 2)**, ConnectHub features user authentication, a live social feed, post publishing, comments, like interactions, and a creator follow/unfollow system.

### 🌐 Live Production Deployment
* **Live Web Service**: [ConnectHub on Render](https://codealpha-social-media-platform.onrender.com) *(Deployed on Render Cloud)*
* **Cloud Platform**: [Render](https://render.com/) (Free Web Service) & [Vercel](https://vercel.com/) (Free Frontend CDN)
* **Database**: MongoDB Atlas Cloud Database (`connecthub` M0 Sandbox)
* **Budget**: **₹0 / $0 (100% Free Tier Hosting)**
* **Step-by-Step Deployment Guide**: See [DEPLOYMENT.md](DEPLOYMENT.md) for full instructions.
* **Environment Status**: Production Ready & Hardened

---

## 🌟 Features

### 1. User Authentication & Security
* **User Registration**: Secure account creation with full name, username, email, and password validation.
* **User Login**: Email and password authentication issuing signed **JSON Web Tokens (JWT)**.
* **Password Encryption**: All passwords encrypted using **BcryptJS** with 10 salt rounds before database storage.
* **Duplicate Prevention**: Automated checks preventing duplicate usernames or registered email addresses.
* **Session Management**: Client-side JWT persistence in `localStorage` with automated session expiry handling.
* **Secure Data**: Password hashes are strictly stripped from all API outputs.

### 2. Social Media Posts Feed
* **Create Post**: Authenticated users can publish posts with captions and optional image URLs.
* **Dynamic Feed**: Real-time rendering of all posts from MongoDB Atlas, ordered newest to oldest.
* **Post Deletion**: Author-only deletion privileges protected by JWT authorization (`403 Forbidden` for non-owners).
* **Double-Tap to Like**: Instagram-style double-click on post photos triggers an animated floating heart and increments likes.

### 3. Likes & Engagement
* **Interactive Like Toggle**: Users can like and unlike posts with real-time counter updates.
* **State Persistence**: Posts reflect whether the currently logged-in user has liked them.

### 4. Nested Comments System
* **Add Comments**: Instant commenting on any feed post with immediate DOM updates.
* **View Comments**: Populates comments with author names, avatars, and timestamps.
* **Delete Comments**: Authors can delete their own comments directly from the post feed.

### 5. Follow / Unfollow System
* **Follow Creators**: Follow users from the "Suggested For You" sidebar.
* **Unfollow Toggle**: Unfollow creators with instant counter synchronization.
* **Self-Follow Prevention**: Business logic preventing users from following or unfollowing themselves.
* **Followers & Following Lists**: Dedicated endpoints and UI counters for social graphs.

### 6. User Profiles & Customization
* **Profile Header**: Banner, avatar, display name, handle, bio, and follower/following stats.
* **User Posts Grid**: Instagram-style 3-column photo grid showcasing user uploads with hover stats.
* **Edit Profile Modal**: Live modal allowing users to edit display name, bio, and avatar image.

### 7. Responsive UI/UX
* **Theme**: Modern blue (`#1877F2`) and clean white (`#F0F2F5`) palette.
* **Responsive Layout**: Seamless cross-device experience across desktop, tablet, and mobile screens.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+), Font Awesome Icons |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Cloud Database), Mongoose ODM |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| **Utilities** | `dotenv` (Environment Variables), `cors` (Cross-Origin Resource Sharing), `nodemon` |

---

## 📂 Project Folder Structure

```text
ConnectHub/
├── .gitignore                      # Root Git ignore rules (protects .env & node_modules)
├── package.json                    # Root cloud deployment orchestration (npm install & start)
├── README.md                       # Comprehensive project documentation
├── frontend/                       # Client-side presentation layer
│   ├── index.html                  # Main feed, stories & post creation page
│   ├── login.html                  # User login page
│   ├── register.html               # New user registration page
│   ├── profile.html                # User profile & posts grid page
│   ├── style.css                   # Global responsive stylesheet (Blue & White theme)
│   └── script.js                   # Client-side logic, dynamic API routing & DOM interactions
└── backend/                        # Server-side REST API & database logic
    ├── .env                        # Private environment variables (Git-ignored)
    ├── .env.example                # Safe environment template with placeholders
    ├── .gitignore                  # Backend-specific Git ignore rules
    ├── package.json                # Project dependencies and npm scripts
    ├── package-lock.json           # Locked dependency tree
    ├── server.js                   # Express server, route mounting & frontend static serving
    ├── config/
    │   └── db.js                   # MongoDB Atlas Mongoose connection logic
    ├── middleware/
    │   └── auth.js                 # JWT Bearer token authentication middleware
    ├── models/
    │   ├── User.js                 # User schema (auth, profile, followers)
    │   ├── Post.js                 # Post schema (caption, image, likes)
    │   └── Comment.js              # Comment schema (text, user, post)
    └── routes/
        ├── auth.js                 # Register, login, and /me routes
        ├── posts.js                # Post CRUD and like toggle routes
        ├── comments.js             # Add, read, and delete comment routes
        └── users.js                # Profile, follow, and unfollow routes
```

---

## ⚙️ Installation & Setup

### Prerequisites
* **Node.js** (`v18.0.0` or higher) installed on your system.
* **npm** (`v9.0.0` or higher) installed.
* A free **MongoDB Atlas** account and cluster.

### Step 1: Clone or Navigate to the Project
```powershell
cd "c:\Users\Sudhir V\Downloads\task-2"
```

### Step 2: Install Backend Dependencies
```powershell
cd backend
npm install
```

### Step 3: Configure Environment Variables
Inside the `backend/` folder, create a `.env` file based on `.env.example`:
```powershell
Copy-Item .env.example .env
```

Open `backend/.env` and enter your MongoDB Atlas connection URI and JWT secret:
```env
# Server Port
PORT=5000

# MongoDB Atlas Connection URI
# Replace <db_user> and <db_password> with your MongoDB Atlas database user credentials
# Replace <cluster-host> with your cluster address (e.g. cluster0.xxxxx.mongodb.net)
MONGO_URI=mongodb+srv://<db_user>:<db_password>@<cluster-host>/connecthub?retryWrites=true&w=majority

# JWT Authentication Secret Key
JWT_SECRET=connecthub_super_secret_jwt_key_2026
```

> [!IMPORTANT]
> The `.env` file is protected by `.gitignore` and must never be committed to public GitHub repositories.

---

## 🚀 Running the Application

Start the backend development server using nodemon:
```powershell
cd backend
npm run dev
```

The server will initialize:
```text
MongoDB Connected: cluster0.xxxxx.mongodb.net (Database: connecthub)
ConnectHub server running on port 5000
Health check available at: http://localhost:5000/api/health
```

### Accessing the Web Application
Open your browser and navigate to:
```text
http://localhost:5000
```
*(Alternatively, you can open `frontend/index.html` via VS Code Live Server at `http://127.0.0.1:5500/frontend/index.html`).*

### Default Demo Credentials
For instant preview and grading:
* **Email**: `sarah@connecthub.io`
* **Password**: `password123`

---

## ☁️ Deployment on Render (Live Cloud Hosting)

ConnectHub is configured and deployed as a full-stack **Web Service** on [Render.com](https://render.com):

### 🌟 Successful Deployment Architecture
* **Single-Service Full Stack**: Express serves both frontend static assets (`frontend/`) and REST API endpoints (`/api/*`) seamlessly from a single host, eliminating CORS latency and origin mismatch issues.
* **Root Build & Start Pipeline**: Root `package.json` provides automated orchestration:
  * `npm install` runs `postinstall` to install backend dependencies inside `backend/`.
  * `npm start` executes `node backend/server.js`.
* **Dynamic Environment Port**: Express binds to `process.env.PORT || 5000`, automatically adapting to Render's allocated port.
* **Cloud Database**: Directly connects to MongoDB Atlas using the `MONGO_URI` secret with `0.0.0.0/0` IP access.
* **Client Dynamic Routing**: `frontend/script.js` uses relative `/api` paths in production to automatically match HTTPS origin.

### 📋 Setup & Deployment Steps on Render
1. **Sign in to Render**: Go to [dashboard.render.com](https://dashboard.render.com) and sign in with GitHub.
2. **New Web Service**: Click **New +** ➔ **Web Service** ➔ **Build and deploy from a Git repository**.
3. **Connect Repository**: Select your repository: `sudhir01082007/CodeAlpha_Social-Media-Platform`.
4. **Configure Settings**:
   * **Name**: `connecthub-social` (or your preferred name)
   * **Region**: Nearest region (e.g. Frankfurt / Oregon / Singapore)
   * **Branch**: `main`
   * **Root Directory**: *(Leave empty)*
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
   * **Instance Type**: `Free`
5. **Add Environment Variables** (Under *Environment* tab):
   * `MONGO_URI` = `mongodb+srv://codealpha_user:<your_password>@cluster0.uqwegoe.mongodb.net/connecthub?retryWrites=true&w=majority`
   * `JWT_SECRET` = `connecthub_super_secret_jwt_key_2026`
6. **MongoDB Atlas Network Access**: In your MongoDB Atlas dashboard under **Network Access**, ensure `0.0.0.0/0` (*Allow access from anywhere*) is added and **Active**, so Render's cloud servers can connect.
7. **Deploy**: Click **Deploy Web Service**. Once deployed, Render will provide a live HTTPS URL (e.g. `https://connecthub-social.onrender.com`).

### 🔍 Production Verification Checklist
* [x] Express starts and binds dynamically to `process.env.PORT`.
* [x] MongoDB Atlas connects successfully to the `connecthub` database.
* [x] Frontend landing page (`/`), login (`/login`), register (`/register`), and profile (`/profile`) load with clean URLs.
* [x] User registration, JWT login, and logout work end-to-end.
* [x] Post creation, photo rendering, like toggles, comments, and creator follow/unfollow sync to MongoDB Atlas.

---

## 📡 REST API Documentation

### 1. Authentication APIs (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user with hashed password & return JWT token. |
| `POST` | `/api/auth/login` | Public | Authenticate existing credentials & return JWT token. |
| `GET` | `/api/auth/me` | Private | Retrieve authenticated user profile based on Bearer token. |

### 2. Posts APIs (`/api/posts`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/posts` | Public | Retrieve all posts ordered newest first with author details. |
| `GET` | `/api/posts/:id` | Public | Retrieve a specific post by ID. |
| `POST` | `/api/posts` | Private | Create a new post with caption and optional image. |
| `DELETE` | `/api/posts/:id` | Private | Delete a post (**Author-only access**). |
| `POST` | `/api/posts/:id/like` | Private | Toggle like / unlike on a post and return updated count. |

### 3. Comments APIs (`/api/posts/:postId/comments` & `/api/comments`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/posts/:postId/comments` | Private | Add a comment to a specific post. |
| `GET` | `/api/posts/:postId/comments` | Public | Retrieve all comments for a post ordered chronologically. |
| `DELETE` | `/api/comments/:id` | Private | Delete a comment (**Author-only access**). |

### 4. User & Follow APIs (`/api/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | Public | Retrieve list of users for suggested creator sidebar. |
| `GET` | `/api/users/:id` | Public | Retrieve user profile by ID with follower/following counts. |
| `PUT` | `/api/users/profile` | Private | Update logged-in user profile details (fullName, bio, avatar). |
| `POST` | `/api/users/:id/follow` | Private | Follow another user (Prevents self-follow and duplicates). |
| `DELETE`| `/api/users/:id/follow` | Private | Unfollow another user. |
| `GET` | `/api/users/:id/followers` | Public | Get all followers of a user. |
| `GET` | `/api/users/:id/following` | Public | Get all users that a user is following. |

### 5. System Health Check
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Verify server status and database connectivity. |

---

## 🔒 Security Best Practices Implemented

* **Password Protection**: Passwords are salted and hashed with `bcryptjs`. No plaintext passwords are saved.
* **Token Authentication**: Stateless Bearer tokens signed with HMAC SHA-256 (`jsonwebtoken`).
* **Clean API Responses**: MongoDB queries utilize `.select('-password')` ensuring sensitive fields are omitted.
* **Input Sanitization**: Client-side HTML escaping to defend against Cross-Site Scripting (XSS).
* **Environment Isolation**: Connection strings and private keys are loaded via `dotenv` and Git-ignored.

---

## 👨‍💻 Author & Acknowledgments

* **Developer**: Sudhir V
* **Internship**: CodeAlpha Full Stack Web Development
* **Task**: Task 2 – Social Media Platform (ConnectHub)

---

## 📄 License
This project is open-source and available under the [ISC License](LICENSE).
