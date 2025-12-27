# Free Deployment Guide

This guide covers deploying both frontend and backend for free.

**Project:** WatchTogether  
**Author:** [Basirul Akhlak Borno](https://github.com/basirulakhlakborno)

## Recommended Setup

**Frontend:** Vercel (easiest) or Netlify  
**Backend:** Railway (recommended) or Render

---

## Option 1: Vercel (Frontend) + Railway (Backend) ⭐ Recommended

### Deploy Backend to Railway

1. **Sign up** at [railway.app](https://railway.app) (free tier available)

2. **Create a new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo" (connect your GitHub account)
   - Select your repository
   - Railway will auto-detect Node.js

3. **Configure the project:**
   - Set **Root Directory** to `backend`
   - Set **Start Command** to `npm start`
   - Railway will auto-detect `package.json`

4. **Add Environment Variables:**
   - Go to your project → Variables tab
   - Add these variables:
     ```
     FRONTEND_URL=https://your-frontend.vercel.app
     JWT_SECRET=your-random-secret-key-here
     PORT=3000
     NODE_ENV=production
     ```

5. **Get your backend URL:**
   - After deployment, Railway gives you a URL like: `https://your-app.up.railway.app`
   - Copy this URL (you'll need it for frontend)

### Deploy Frontend to Vercel

1. **Sign up** at [vercel.com](https://vercel.com) (free tier)

2. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

3. **Deploy:**
   ```bash
   # In your project root
   vercel
   ```
   Or connect your GitHub repo on Vercel dashboard

4. **Add Environment Variables:**
   - Go to your project → Settings → Environment Variables
   - Add:
     ```
     VITE_API_URL=https://your-app.up.railway.app/api
     VITE_SOCKET_URL=https://your-app.up.railway.app
     ```

5. **Redeploy** after adding environment variables

---

## Option 2: Both on Render (Simpler)

### Deploy Backend to Render

1. **Sign up** at [render.com](https://render.com) (free tier)

2. **Create a new Web Service:**
   - Click "New" → "Web Service"
   - Connect your GitHub repo
   - Configure:
     - **Name:** `readme-backend`
     - **Root Directory:** `backend`
     - **Environment:** `Node`
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`

3. **Add Environment Variables:**
   ```
   FRONTEND_URL=https://your-frontend.onrender.com
   JWT_SECRET=your-random-secret-key-here
   PORT=3000
   NODE_ENV=production
   ```

4. **Get your backend URL** (e.g., `https://readme-backend.onrender.com`)

### Deploy Frontend to Render

1. **Create a new Static Site:**
   - Click "New" → "Static Site"
   - Connect your GitHub repo
   - Configure:
     - **Root Directory:** (leave empty, it's in root)
     - **Build Command:** `npm run build`
     - **Publish Directory:** `dist`

2. **Add Environment Variables:**
   ```
   VITE_API_URL=https://readme-backend.onrender.com/api
   VITE_SOCKET_URL=https://readme-backend.onrender.com
   ```

**Note:** Render free tier spins down after 15 minutes of inactivity (takes ~30s to wake up)

---

## Option 3: Vercel (Frontend) + Render (Backend)

Same as Option 1, but use Render instead of Railway for backend.

---

## Important Notes

### Environment Variables Summary

**Backend needs:**
- `FRONTEND_URL` - Your frontend URL (for CORS)
- `JWT_SECRET` - Random secret key for JWT tokens
- `PORT` - Port number (usually auto-set by platform)
- `NODE_ENV` - Set to `production`

**Frontend needs:**
- `VITE_API_URL` - Your backend API URL (e.g., `https://backend.railway.app/api`)
- `VITE_SOCKET_URL` - Your backend Socket.io URL (e.g., `https://backend.railway.app`)

### Database File

The `backend/database.json` file will be created automatically on first run. Make sure your backend has write permissions (all platforms above support this).

### WebSocket Support

All recommended platforms (Railway, Render) support WebSocket connections needed for Socket.io.

### Free Tier Limitations

- **Railway:** $5 free credit/month (usually enough for small projects)
- **Render:** Free tier spins down after inactivity (30s wake-up time)
- **Vercel:** Unlimited for static sites, generous free tier

---

## Quick Start Commands

### For Railway (Backend):
```bash
# In backend folder
railway login
railway init
railway up
```

### For Vercel (Frontend):
```bash
# In project root
vercel
```

---

## Troubleshooting

1. **CORS errors:** Make sure `FRONTEND_URL` in backend matches your frontend URL exactly
2. **Socket.io not connecting:** Check that `VITE_SOCKET_URL` uses `https://` (not `http://`)
3. **Database errors:** Ensure backend has write permissions (should work automatically)
4. **Build fails:** Check that all dependencies are in `package.json`

