# ConnectHub – 100% Free Production Deployment Guide

This guide provides end-to-end instructions for deploying the **ConnectHub Social Media Platform** to the internet with a **strict ₹0 / $0 budget**.

---

## 🏗️ Free-Tier Architecture Overview

| Component | Free Provider | Free Tier Details | Monthly Cost |
| :--- | :--- | :--- | :--- |
| **Backend API & Web Server** | [Render](https://render.com) | Free Web Service (512 MB RAM, Shared CPU, 750 free hours/mo) | **$0 / ₹0** |
| **Alternative Frontend Host** | [Vercel](https://vercel.com) | Vercel Hobby Plan (100 GB Bandwidth, automatic HTTPS, global CDN) | **$0 / ₹0** |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) | M0 Sandbox Shared Cluster (512 MB storage, shared RAM, free forever) | **$0 / ₹0** |
| **Media Hosting** | Direct URL / External Free CDNs | URL-based image referencing (Unsplash, Cloudinary, Imgur) | **$0 / ₹0** |
| **SSL / HTTPS Certificates** | Let's Encrypt (via Render / Vercel) | Automated SSL/TLS certificates with zero configuration | **$0 / ₹0** |
| **Custom Domain** | Subdomain (`.onrender.com` / `.vercel.app`) | Free wildcard subdomains provided out-of-the-box | **$0 / ₹0** |

---

## 🚀 Deployment Options

ConnectHub supports two production deployment architectures:

1. **Option A (Recommended & Easiest): Single Full-Stack Service on Render**
   - Render builds and hosts both the Express API and the static frontend from one repository.
   - Zero CORS complications, single URL for everything, 1-click deployment using `render.yaml`.
2. **Option B (Split Deployment): Vercel Frontend + Render Backend**
   - Vercel hosts the HTML/CSS/JS frontend via `vercel.json` rewrites.
   - Render hosts the backend API on `https://<your-service>.onrender.com`.

---

## 📋 Step 1: Set Up MongoDB Atlas Free Cluster (M0)

1. **Sign Up / Log In**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas) and register for a free account.
2. **Create a Free Cluster**:
   - Click **Create Deployment**.
   - Select **M0 Free** (Shared).
   - Choose a cloud provider (AWS / Google Cloud) and region closest to your users (e.g., `Mumbai (ap-south-1)` or `Frankfurt (eu-central-1)`).
   - Name your cluster (e.g., `Cluster0`) and click **Create Deployment**.
3. **Configure Database Access (User & Password)**:
   - In the left menu, navigate to **Security** ➔ **Database Access**.
   - Click **Add New Database User**.
   - Authentication Method: **Password**.
   - Create a username (e.g., `connecthub_user`) and a secure password.
   - Database User Privileges: Select **Read and write to any database** (`readWriteAnyDatabase`).
   - Click **Add User**.
4. **Configure Network Access (IP Whitelist)**:
   - In the left menu, navigate to **Security** ➔ **Network Access**.
   - Click **Add IP Address**.
   - Click **Allow Access From Anywhere** (sets CIDR to `0.0.0.0/0`).
   - *Why is this required?* Cloud providers like Render assign dynamic outbound IP addresses to free containers.
   - Click **Confirm** and wait until the status is **Active**.
5. **Get Your Connection String**:
   - Navigate to **Database** ➔ **Deployment** in the left menu.
   - Click **Connect** next to your cluster.
   - Select **Drivers** (Node.js).
   - Copy the connection string format:
     ```text
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/connecthub?retryWrites=true&w=majority
     ```
   - Replace `<username>` with your database username.
   - Replace `<password>` with your database user password (URL-encode special characters if present).
   - Ensure the database name `connecthub` is included before the query parameters.

---

## 🌐 Step 2: Deploy to Render (Option A — Recommended Full-Stack)

### Method 1: Automated Blueprint Deployment (`render.yaml`)
1. Push your repository to GitHub:
   ```bash
   git push origin main
   ```
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **Blueprints** in the top navigation.
4. Click **New Blueprint Instance**.
5. Connect your GitHub repository: `CodeAlpha_Social-Media--Platform`.
6. Render will automatically detect `render.yaml`.
7. Enter the required environment variables when prompted:
   - `MONGO_URI`: Your MongoDB Atlas connection URI.
   - `JWT_SECRET`: A secure random string (minimum 32 characters).
8. Click **Apply**. Render will install dependencies, build, and deploy your live app.

### Method 2: Manual Web Service Setup
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** ➔ **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your repository.
4. Configure service details:
   - **Name**: `codealpha-connecthub` (or your chosen name)
   - **Region**: Nearest region (e.g., Frankfurt or Singapore)
   - **Branch**: `main`
   - **Root Directory**: *(Leave empty)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Expand the **Environment Variables** section and add:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables performance optimizations |
   | `PORT` | `10000` | Render defaults to port 10000 (auto-injected) |
   | `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/connecthub?retryWrites=true&w=majority` | From Step 1 |
   | `JWT_SECRET` | `your_super_secret_jwt_key_here` | 32+ char secret string |
6. Click **Create Web Service**.
7. Wait for the build logs to show:
   ```text
   ==> Server listening on port 10000
   ==> MongoDB Connected: cluster.mongodb.net (Database: connecthub)
   ==> Your service is live at https://codealpha-connecthub.onrender.com
   ```

---

## ⚡ Step 3: Deploy Frontend to Vercel (Option B — Split Architecture)

If you prefer hosting the static frontend on Vercel's global CDN:

1. **Deploy Backend to Render First** (using Step 2 above) to get your backend URL:
   `https://<your-render-app>.onrender.com`.
2. **Sign Up / Log In to Vercel**:
   - Go to [Vercel](https://vercel.com) and log in with GitHub.
3. **Import Project**:
   - Click **Add New...** ➔ **Project**.
   - Select your `CodeAlpha_Social-Media--Platform` repository.
4. **Configure Project Settings**:
   - **Framework Preset**: `Other`
   - **Root Directory**: `./` (Root directory, so `vercel.json` is read)
   - **Build and Output Settings**: Default (No build command needed for static HTML)
5. **Environment Variables**:
   - Add `CONNECTHUB_API_BASE` = `https://<your-render-app>.onrender.com`
6. In `vercel.json`, ensure the rewrites point to your Render backend:
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "https://<your-render-app>.onrender.com/api/$1" },
       { "source": "/login", "destination": "/frontend/login.html" },
       { "source": "/register", "destination": "/frontend/register.html" },
       { "source": "/profile", "destination": "/frontend/profile.html" },
       { "source": "/(.*)", "destination": "/frontend/$1" }
     ]
   }
   ```
7. Click **Deploy**. Vercel will instantly generate a live URL (e.g., `https://connecthub.vercel.app`).

---

## 🔑 Environment Variables Reference

| Variable Name | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | `production` | Sets Node.js environment mode |
| `PORT` | Yes | `5000` (Render injects `10000`) | Port on which Express listens |
| `MONGO_URI` / `MONGODB_URI` | Yes | `mongodb+srv://...` | MongoDB Atlas database connection string |
| `JWT_SECRET` | Yes | *(Random 32+ character string)* | Secret key for signing and verifying JWTs |
| `FRONTEND_URL` | Optional | `https://your-frontend.vercel.app` | Whitelisted origin for CORS (if using split deployment) |
| `CORS_ORIGIN` | Optional | `*` or specific origins | Additional allowed CORS origins |

> [!CAUTION]
> Never commit real secrets or `.env` files to git. All credentials must be added through the hosting provider's dashboard settings.

---

## ⚠️ Known Free-Tier Limitations & Mitigations

### 1. Render Free Web Service Spin-Down (Cold Start)
- **Behavior**: Free Render instances automatically sleep after **15 minutes** of inactivity to conserve resources.
- **Impact**: The next incoming request triggers a container restart, which takes **30–50 seconds** (cold start). Subsequent requests are instant.
- **Mitigation (₹0)**:
  - Add a friendly spinner/loading notice in the UI for initial requests.
  - Optional ₹0 workaround: Register for free at [UptimeRobot](https://uptimerobot.com) or [Cron-Job.org](https://cron-job.org) to ping your `/api/health` endpoint every 10–14 minutes, keeping the container warm during daytime hours.

### 2. MongoDB Atlas M0 Cluster Limitations
- **Storage Limit**: 512 MB total data storage.
- **Connections Limit**: 500 max concurrent connections.
- **Inactivity Pause**: Clusters with zero activity for 60 consecutive days may be paused.
- **Mitigation**: ConnectHub utilizes URL-based media referencing (`Post.image` and `User.avatar` store string URLs), meaning zero binary blob storage inside MongoDB. 512 MB can comfortably store over 250,000 text posts and comments.

### 3. Ephemeral File System on Free Cloud Providers
- **Why ConnectHub handles this properly**: Traditional server-side file uploads using `fs.writeFile` or local Multer disk storage are lost every time a free cloud container restarts or redeploys. ConnectHub was intentionally designed to accept verified image URLs (Unsplash, Cloudinary, Imgur, GitHub avatars) that persist indefinitely and cost ₹0.

---

## 🧪 Post-Deployment Verification Checklist

After deploying your live URL, verify the following features:

- [ ] **Health Endpoint**: Navigate to `https://<your-app>.onrender.com/api/health`. Should return `{"status":"healthy","database":"connected"}`.
- [ ] **Security Headers**: Verify `X-Content-Type-Options: nosniff` and `X-Frame-Options: SAMEORIGIN` are present.
- [ ] **Homepage & Clean URLs**: Visit `/`, `/login`, `/register`, `/profile`.
- [ ] **User Registration**: Register a new user account with unique email and username.
- [ ] **Authentication**: Log out and log back in; verify JWT token is stored in `localStorage`.
- [ ] **Post Publishing**: Create a post with text caption and an Unsplash image URL (e.g., `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe`).
- [ ] **Interactions**: Double-tap image to like; click the heart icon to unlike; verify count increments/decrements.
- [ ] **Comments**: Post a comment; verify comment author avatar and timestamp; delete comment.
- [ ] **User Follow**: Follow a suggested creator; verify follower counter updates; verify self-follow is prevented.
- [ ] **Profile Customization**: Open Edit Profile modal; update bio and display name; verify persistence on reload.
- [ ] **Responsive Design**: Test layout on a mobile screen or Chrome DevTools device mode.

---

## 🛠️ Local Verification Run

Before pushing changes to GitHub, test your backend against the automated verification suite:

```powershell
# Navigate to the project root
cd "c:\Users\Sudhir V\Downloads\task-2"

# Run the 47-assertion test suite
node backend/test_suite.js
```
Expected output:
```text
=====================================================
📊 TEST SUITE SUMMARY: 47 PASSED | 0 FAILED
=====================================================
```
