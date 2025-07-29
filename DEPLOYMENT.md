# Deployment Guide - Following Analytics Frontend

## 🚀 Vercel Deployment

### Quick Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Followingae/analyticsfollowingfrontend)

### Manual Deployment Steps

1. **Fork/Clone Repository**
   ```bash
   git clone https://github.com/Followingae/analyticsfollowingfrontend.git
   cd analyticsfollowingfrontend
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - **Important**: Set Root Directory to `frontend`

3. **Environment Variables**
   Set these in Vercel Dashboard → Settings → Environment Variables:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-backend-api.com/api/v1
   REACT_APP_API_TIMEOUT=30000
   ```

4. **Build Settings**
   - Framework Preset: **Next.js**
   - Root Directory: **frontend**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### Project Structure
```
analyticsfollowingfrontend/
├── vercel.json              # Vercel configuration
├── package.json             # Root package.json
├── .vercelignore           # Files to ignore during deployment
└── frontend/               # Next.js application
    ├── package.json        # Frontend dependencies
    ├── next.config.ts      # Next.js configuration
    ├── .env.production     # Production environment variables
    └── src/               # Source code
```

## 🔧 Configuration Files

### `vercel.json`
- Handles subdirectory deployment
- Configures build commands
- Sets up routing

### Environment Variables
- **Development**: `.env` (local)
- **Production**: `.env.production` (Vercel)
- **Example**: `.env.example`

## 🏗️ Build Process

1. Vercel reads `vercel.json`
2. Navigates to `frontend/` directory
3. Runs `npm install`
4. Executes `npm run build`
5. Deploys the generated `.next` folder

## 🔐 Security Features

- Security headers (XSS protection, frame options)
- CORS configuration
- Environment variable validation
- TypeScript type checking

## 📊 Performance Optimizations

- Image optimization for Instagram content
- Package import optimization
- Standalone output for faster cold starts
- Modern image formats (WebP, AVIF)

## 🚨 Troubleshooting

### Common Issues:

1. **"No Next.js version detected"**
   - Ensure Root Directory is set to `frontend`
   - Verify `frontend/package.json` contains `next` dependency

2. **Environment Variables Not Working**
   - Prefix public variables with `NEXT_PUBLIC_`
   - Check Vercel Dashboard → Settings → Environment Variables

3. **Build Failures**
   - Check build logs in Vercel Dashboard
   - Ensure all dependencies are in `package.json`
   - Verify TypeScript types are correct

## 📱 Production URL
After deployment, your app will be available at:
`https://your-project-name.vercel.app`

## 🔄 Auto-Deployment
- Pushes to `main` branch trigger automatic deployments
- Preview deployments for feature branches
- Commit messages appear in deployment logs