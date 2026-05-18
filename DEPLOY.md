# NosMarket Gaming Marketplace - Deployment Guide

## Overview

This guide will help you deploy your NosMarket application.

---

## Prerequisites

1. GitHub account with your code
2. Render account
3. Vercel account
4. MongoDB Atlas cluster

---

## Step 1: Deploy Backend to Render

1. Go to https://render.com
2. Create Web Service, connect your GitHub repo
3. Configure:
   - Root Directory: `apps/api`
   - Build Command: `npm install && npm run build`
   - Start Command: `node dist/main.js`

4. Add environment variables from `apps/api/.env.example`

---

## Step 2: Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Import your GitHub repo
3. Configure:
   - Root Directory: `apps/web`

4. Add environment variables from `apps/web/.env.example`

---

## Step 3: Configure Discord OAuth

1. Go to Discord Developer Portal
2. Add redirect URL: `https://api.YOUR_DOMAIN.com/api/auth/discord/callback`

---

## Costs

| Service | Plan | Cost |
|---------|------|------|
| MongoDB Atlas | Free | $0 |
| Render Web Service | Starter | $7/month |
| Vercel Frontend | Hobby | $0 |

**Total: $7/month**
