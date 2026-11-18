# Boi-Hat Production Deployment Guide

This guide describes how to deploy the Boi-Hat API backend to **Render (Singapore region)** with **Neon PostgreSQL**, **Brevo HTTPS Email**, and **Cloudinary CDN Image Storage**, ensuring the system runs 24/7 independently of any local machine.

---

## 1. Prerequisites Accounts
Create free tier accounts on:
1. **[Render](https://render.com/)** (Hosting for Node.js API)
2. **[Neon](https://neon.tech/)** (Serverless PostgreSQL with connection pooling)
3. **[Brevo (formerly Sendinblue)](https://www.brevo.com/)** (HTTPS Transactional Email)
4. **[Cloudinary](https://cloudinary.com/)** (Image CDN Storage)
5. **[UptimeRobot](https://uptimerobot.com/)** (Free 14-min keep-alive ping)

---

## 2. Service Configurations

### Step A: Neon Database (PostgreSQL)
1. In the Neon Console, create a new project (e.g. `boi-hat-prod`). Choose AWS Singapore (`ap-southeast-1`) or US East.
2. In the Dashboard:
   - Check the **Connection Pooling** checkbox. Copy the pooled connection string. This is your `DATABASE_URL`.
   - Uncheck Connection Pooling. Copy the direct connection string. This is your `DIRECT_URL`.
3. In both strings, ensure `?sslmode=require` is appended.

### Step B: Brevo (HTTPS Transactional Email)
1. Go to **Brevo Dashboard** $\to$ **Senders, Domains & Dedicated IPs** $\to$ **Senders**.
2. Add your sender email (e.g., `you@gmail.com` or `no-reply@yourdomain.com`) and verify via verification email.
3. Go to **Settings** $\to$ **SMTP & API Keys** $\to$ **Generate a new API key**.
4. Name it `render-boihat-api` and copy the key (starts with `xkeysib-`). This is your `BREVO_API_KEY`.
5. Set `BREVO_SENDER_EMAIL` to your verified sender address.

### Step C: Cloudinary (Media CDN)
1. In Cloudinary Console, open the Dashboard.
2. Under **Account Details**, copy:
   - **Cloud name** $\to$ `CLOUDINARY_CLOUD_NAME`
   - **API Key** $\to$ `CLOUDINARY_API_KEY`
   - **API Secret** $\to$ `CLOUDINARY_API_SECRET`

---

## 3. Render Deployment

### Method 1: Using Blueprint (`render.yaml`) - Recommended
1. Push your repository to GitHub.
2. Go to **Render Dashboard** $\to$ **New** $\to$ **Blueprint**.
3. Connect your repository. Render automatically reads `render.yaml`.
4. Enter the required secrets when prompted:
   - `DATABASE_URL` (from Neon pooled)
   - `DIRECT_URL` (from Neon direct)
   - `BREVO_API_KEY` (from Brevo)
   - `BREVO_SENDER_EMAIL` (your verified Brevo email)
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
5. Click **Apply**. Render will install dependencies, build the TypeScript API, apply database migrations (`npx prisma migrate deploy`), and launch the service.

### Method 2: Manual Web Service
1. **New** $\to$ **Web Service** $\to$ Connect Git repository.
2. Configure:
   - **Name**: `boi-hat-api`
   - **Region**: `Singapore (Southeast Asia)`
   - **Branch**: `master` or `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build && npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma`
   - **Start Command**: `node apps/api/dist/src/main`
   - **Health Check Path**: `/health`
3. Under **Environment Variables**, add the variables listed in `.env.example`.

---

## 4. First-Time Setup: Seed Admin Account

Once the Render service is running, run the admin seed once to create the initial admin user in your PostgreSQL database:

### From Render Shell:
1. In the Render Dashboard, open your web service $\to$ **Shell**.
2. Run:
   ```bash
   ADMIN_EMAIL="admin@boihat.com" ADMIN_USERNAME="boihat_admin" npm --workspace=@boi-hat/api run db:seed:admin
   ```

---

## 5. Prevent Cold-Start Sleep (UptimeRobot Keep-Alive)

Render free tier instances spin down after 15 minutes of inactivity. When a mobile app makes a request while sleeping, cold-start waking takes 30-60 seconds.

### Set up Keep-Alive Monitor (Free):
1. Sign up at **[UptimeRobot](https://uptimerobot.com/)**.
2. Click **+ Add New Monitor**:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `Boi-Hat API Ping`
   - **URL (or IP)**: `https://<your-render-service-name>.onrender.com/health`
   - **Monitoring Interval**: `Every 14 minutes`
3. Click **Create Monitor**.
4. The monitor calls `GET /health` every 14 minutes, keeping the Render container warm 24/7 without consuming paid hours.

---

## 6. Verify Production Deployment

Verify the service from any terminal:
```bash
curl -i https://<your-render-service-name>.onrender.com/health
```
Expected output:
```json
HTTP/2 200
{
  "status": "ok",
  "service": "boi-hat-api",
  "timestamp": "2026-11-19T...",
  "db": "ok"
}
```
