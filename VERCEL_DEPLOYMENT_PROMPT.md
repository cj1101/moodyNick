# Vercel Deployment Fix - Browser Agent Prompt

## Problem
Vercel build is failing because it cannot detect Next.js. The error indicates:
- "No Next.js version detected"
- Root Directory setting may not match the directory of package.json

## Solution
The Root Directory MUST be set in the Vercel dashboard project settings. The `vercel.json` file does NOT support `rootDirectory` as a property - it must be configured in the Vercel dashboard only.

## Browser Agent Prompt

```
Please navigate to the Vercel dashboard and fix the deployment issue for the moodyNick project:

1. Go to https://vercel.com/dashboard
2. Navigate to the "moodyNick" project (or search for it if needed)
3. Click on the project to open it
4. Go to the "Settings" tab
5. Scroll down to find the "General" section
6. Look for "Root Directory" setting
7. Set the Root Directory to: "frontend"
8. Save the changes
9. Go to the "Deployments" tab
10. Find the most recent failed deployment
11. Click on the three dots menu (or "..." menu) next to the failed deployment
12. Select "Clear cache and redeploy" (or "Redeploy" and then clear cache option)
13. Confirm the redeployment

This should fix the build error by ensuring Vercel looks for Next.js in the correct directory (frontend/) where the package.json with Next.js dependencies is located.
```

## Alternative: If Root Directory setting is not visible

If you cannot find the Root Directory setting in the General section, try:
1. Look in the "Build & Development Settings" section
2. Or check if there's a "Framework" or "Install Command" section where you can specify the root directory
3. The setting might be under "Build Settings" → "Root Directory"

## What was fixed in code
- Updated `vercel.json` with correct build configuration (removed invalid `rootDirectory` property)
- Build command: `npm run build`
- Output directory: `.next`
- Install command: `npm install`
- Framework: `nextjs`
- **IMPORTANT**: Root directory `frontend` MUST be set in Vercel dashboard (Settings → General → Root Directory)

