# Deploy to GitHub Pages - Step-by-Step Guide

This guide will walk you through deploying your Perfusion Schedule Manager to GitHub Pages for **FREE**.

## ⏱️ Time Required: 10-15 minutes

## 📋 What You'll Need
- A GitHub account (free)
- Your project files (already done!)
- App icons (`icon-192.png` and `icon-512.png`)

---

## Step 1: Create App Icons (5 minutes)

Before deploying, you need to create the app icons:

### Option A: Use an Online Tool (Easiest)
1. Go to https://www.canva.com/create/logos/ (free account)
2. Search for "app icon" template
3. Create a simple design with:
   - University of Utah red (#8B0000)
   - A "U" or medical cross
   - Size: 512x512 pixels
4. Download as PNG
5. Resize to create both sizes:
   - Save one as `icon-512.png` (512x512)
   - Resize to 192x192, save as `icon-192.png`

### Option B: Use a Favicon Generator
1. Go to https://realfavicongenerator.net/
2. Upload any logo or image
3. Generate icons
4. Download and rename to `icon-192.png` and `icon-512.png`

### Option C: Use a Simple Placeholder
Create a simple colored square for now (you can update later):
1. Go to https://placeholder.com/
2. Download: https://via.placeholder.com/192/8B0000/FFFFFF?text=U (for 192x192)
3. Download: https://via.placeholder.com/512/8B0000/FFFFFF?text=U (for 512x512)
4. Save as `icon-192.png` and `icon-512.png`

**Place both icon files in your project root folder** (same location as index.html)

---

## Step 2: Create a GitHub Account (2 minutes)

If you already have a GitHub account, skip to Step 3.

1. Go to https://github.com/signup
2. Enter your email address
3. Create a password
4. Choose a username (e.g., `jakeweston` or `uofuperfusion`)
5. Verify your account (check email)
6. Choose the free plan

---

## Step 3: Create a New Repository (2 minutes)

1. **Log in to GitHub**
   - Go to https://github.com/
   - Sign in with your account

2. **Create new repository**
   - Click the **"+"** button in top right corner
   - Click **"New repository"**

3. **Configure repository**
   - **Repository name:** `perfusion-schedule` (or any name you prefer)
   - **Description:** "U of U Perfusion Schedule and Vacation Manager"
   - **Visibility:** Select **"Public"** (required for free GitHub Pages)
   - **DO NOT** check "Initialize with README"
   - Click **"Create repository"**

---

## Step 4: Upload Your Files (3 minutes)

1. **On the new repository page, click "uploading an existing file"**
   - You'll see a link that says "uploading an existing file" in blue

2. **Upload all your project files**
   - Drag and drop your ENTIRE project folder into the upload area
   - OR click "choose your files" and select all files

   **Make sure you upload ALL these files:**
   - ✅ index.html
   - ✅ style.css
   - ✅ script.js
   - ✅ manifest.json
   - ✅ service-worker.js
   - ✅ icon-192.png
   - ✅ icon-512.png
   - ✅ js/ folder (entire folder with all subfolders)
   - ✅ INSTALL_ON_IPHONE.md
   - ✅ PWA_SETUP.md

   **DO NOT upload these files (they contain passwords):**
   - ❌ js/config.js (we'll create this separately)

3. **Commit the files**
   - Scroll down
   - In the commit message box, type: "Initial commit - Perfusion Schedule Manager"
   - Click **"Commit changes"**

---

## Step 5: Create config.js Separately (IMPORTANT - 2 minutes)

We need to add your config.js file separately because it contains sensitive information.

1. **In your repository, click "Add file" → "Create new file"**

2. **Name the file:** Type `js/config.js` in the filename box
   - This will automatically create the js folder structure

3. **Copy and paste this content:**

```javascript
// Configuration File
// DO NOT COMMIT THIS FILE - It contains sensitive credentials
// This file is gitignored

export const CONFIG = {
    // Google Sheets API Key
    API_KEY: 'AIzaSyCqy-pGNRPyhqvVVOf5u-As_dFkE9fW4Ak',

    // Google Sheet ID
    SHEET_ID: '1pKNJK3nvpcwQor1obQm1V6qiWfwOPmImV361Qfqul8E',

    // Sheet range to fetch
    RANGE: 'Sheet2!A13:X100',

    // Google OAuth Client ID
    GOOGLE_CLIENT_ID: '244792945465-5qf46u4f19m54bh2vvuf1mnsbl3sfduc.apps.googleusercontent.com',

    // Legacy supervisor password
    SUPERVISOR_PASSWORD: 'Perfusion123',

    // Default admin account
    DEFAULT_ADMIN: {
        email: 'jakeweston@gmail.com',
        password: 'Perfusion123',
        name: 'Jake Weston',
        role: 'admin'
    }
};
```

4. **Commit the file**
   - Scroll down
   - Click **"Commit changes"**

---

## Step 6: Enable GitHub Pages (1 minute)

1. **Go to repository Settings**
   - Click the **"Settings"** tab (top of the page)

2. **Navigate to Pages**
   - In the left sidebar, click **"Pages"** (under "Code and automation")

3. **Configure source**
   - Under "Build and deployment"
   - Under "Source", select **"Deploy from a branch"**
   - Under "Branch", select **"main"** (or "master")
   - Leave folder as **"/ (root)"**
   - Click **"Save"**

4. **Wait for deployment**
   - A blue box will appear saying "GitHub Pages source saved"
   - Wait 1-2 minutes for the site to build

5. **Get your URL**
   - Refresh the page after 1-2 minutes
   - You'll see a green box with your URL:
   - **Your site is live at `https://yourusername.github.io/perfusion-schedule`**

---

## Step 7: Configure Google API for Your New URL (3 minutes)

Now you need to allow your app to access Google Sheets from the new URL.

1. **Go to Google Cloud Console**
   - Visit https://console.cloud.google.com/

2. **Select your project**
   - Click the project dropdown at the top
   - Select your Perfusion Schedule project

3. **Go to Credentials**
   - Click the menu (☰) → "APIs & Services" → "Credentials"

4. **Edit your API Key**
   - Find your API key (starts with `AIzaSy...`)
   - Click the pencil/edit icon

5. **Add your GitHub Pages URL**
   - Scroll to "Application restrictions"
   - Select "HTTP referrers (web sites)"
   - Click "+ ADD AN ITEM"
   - Add: `https://yourusername.github.io/*` (replace with YOUR username)
   - Click "Done"
   - Click "Save"

6. **Update OAuth Client ID (if using Google Sign-In)**
   - In Credentials, find your OAuth 2.0 Client ID
   - Click the pencil/edit icon
   - Under "Authorized JavaScript origins", click "+ ADD URI"
   - Add: `https://yourusername.github.io`
   - Under "Authorized redirect URIs", click "+ ADD URI"
   - Add: `https://yourusername.github.io/perfusion-schedule`
   - Click "Save"

---

## Step 8: Test Your App! (2 minutes)

1. **Open your GitHub Pages URL in Safari on your iPhone**
   - Go to `https://yourusername.github.io/perfusion-schedule`

2. **Test the app**
   - Try logging in
   - Check if Google Sheets loads
   - Test the vacation calendar
   - Make sure everything works!

3. **Install on iPhone**
   - Tap the Share button (box with arrow)
   - Tap "Add to Home Screen"
   - Tap "Add"
   - Launch from your home screen!

---

## 🎉 You're Done!

Your app is now live at: `https://yourusername.github.io/perfusion-schedule`

Share this URL with your team members and give them the `INSTALL_ON_IPHONE.md` instructions!

---

## 🔄 How to Update Your App

When you make changes to your code:

### Method 1: Upload Files via Web Interface
1. Go to your repository on GitHub
2. Navigate to the file you want to update
3. Click the pencil icon to edit
4. Make your changes
5. Click "Commit changes"
6. Wait 1-2 minutes for deployment

### Method 2: Use GitHub Desktop (Easier for Multiple Files)
1. Download GitHub Desktop: https://desktop.github.com/
2. Clone your repository
3. Make changes to files locally
4. Commit and push changes
5. Automatic deployment!

---

## 🆘 Troubleshooting

### Site Not Loading
- Wait 2-3 minutes after enabling GitHub Pages
- Check that repository is Public (Settings → General)
- Check that GitHub Pages is enabled (Settings → Pages)

### Google Sheets Not Loading
- Verify API key restrictions include your GitHub Pages URL
- Make sure you added the `/*` at the end of the URL
- Check browser console for errors

### "Add to Home Screen" Not Showing
- Must use Safari browser (not Chrome)
- Must be on HTTPS (GitHub Pages is automatic HTTPS ✅)
- Requires iOS 11.3 or later

### Icons Not Appearing
- Verify `icon-192.png` and `icon-512.png` are in root folder
- Check file sizes (must be exactly 192x192 and 512x512)
- Clear browser cache and reload

### Config.js Errors
- Make sure you created `js/config.js` (not just `config.js`)
- Verify the file path is correct in repository

---

## 💰 Cost Breakdown

- GitHub account: **FREE** ✅
- GitHub Pages hosting: **FREE** ✅
- HTTPS certificate: **FREE** (automatic) ✅
- Bandwidth: **FREE** (100GB/month soft limit) ✅
- **Total: $0.00/month** 🎉

---

## 📞 Need Help?

If you get stuck:
1. Check the Troubleshooting section above
2. Look at browser console for errors (F12 in Chrome/Safari)
3. Verify all files uploaded correctly
4. Make sure GitHub Pages is enabled

---

## 🔐 Security Note

Your `config.js` file contains API keys and passwords. While it's uploaded to GitHub:
- Change the default passwords immediately after deployment
- Consider rotating API keys periodically
- For production use, consider using environment variables
- Keep your repository backup on your local computer

---

## ✅ Next Steps Checklist

- [ ] Create app icons (icon-192.png and icon-512.png)
- [ ] Create GitHub account
- [ ] Create repository
- [ ] Upload all files except config.js
- [ ] Create config.js separately in js/ folder
- [ ] Enable GitHub Pages
- [ ] Wait 2 minutes for deployment
- [ ] Configure Google API with GitHub Pages URL
- [ ] Test app in Safari on iPhone
- [ ] Install app on iPhone home screen
- [ ] Share URL and installation guide with team
- [ ] Change default passwords

**Good luck! 🚀**
