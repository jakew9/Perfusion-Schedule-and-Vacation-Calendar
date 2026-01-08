# PWA Setup Guide - Perfusion Schedule Manager

Your app is now configured as a Progressive Web App (PWA)! Follow these final steps to complete the setup.

## ✅ What's Already Done

- ✅ PWA manifest file created (`manifest.json`)
- ✅ Service worker created (`service-worker.js`)
- ✅ iOS meta tags added to `index.html`
- ✅ Service worker registration script added
- ✅ Google Sheets link added to Edit Schedule page

## 📋 What You Need To Do

### 1. Create App Icons

You need to create two icon images for your app. These will appear on the iPhone home screen.

**Required Icons:**
- `icon-192.png` - 192x192 pixels
- `icon-512.png` - 512x512 pixels

**Icon Design Suggestions:**
- Use the University of Utah colors (red #8B0000)
- Include a "U" or medical symbol
- Keep it simple and recognizable at small sizes
- Use a transparent or solid background

**How to Create:**
1. Use a tool like Canva, Figma, or Adobe Illustrator
2. Create a 512x512 square design
3. Export as PNG at 512x512 (for `icon-512.png`)
4. Resize to 192x192 and export (for `icon-192.png`)
5. Place both files in the root directory of your project

**Quick Option:** Use an online favicon generator:
- Upload a logo or design to https://realfavicongenerator.net/
- Download the generated icons
- Rename them to `icon-192.png` and `icon-512.png`

### 2. Deploy to HTTPS Hosting

PWAs **require HTTPS** to work. Here are your hosting options:

#### Option A: GitHub Pages (Free & Easy)
1. Create a GitHub repository
2. Push your code to the repository
3. Go to Settings → Pages
4. Enable GitHub Pages from main branch
5. Your site will be at: `https://yourusername.github.io/repo-name`

#### Option B: Netlify (Free & Easy)
1. Sign up at https://www.netlify.com/
2. Drag and drop your project folder
3. Get instant HTTPS URL like: `https://your-app.netlify.app`
4. Supports custom domains

#### Option C: Firebase Hosting (Free)
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Run: `firebase login`
3. Run: `firebase init hosting`
4. Run: `firebase deploy`
5. Get URL like: `https://your-app.web.app`

#### Option D: Your Own Server
- Make sure HTTPS/SSL is enabled
- Upload all files to your web server
- Ensure all files are accessible at the root level

### 3. Configure Google Sheets Access

Your app needs to access Google Sheets from the deployed URL:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to APIs & Services → Credentials
4. Edit your API key
5. Under "Application restrictions" → "HTTP referrers"
6. Add your deployed URL (e.g., `https://yourusername.github.io/*`)
7. Save changes

### 4. Test the Installation

Once deployed:

1. Open Safari on iPhone
2. Navigate to your HTTPS URL
3. Log in to verify everything works
4. Tap Share → "Add to Home Screen"
5. Launch from home screen
6. Test all features!

## 📱 Installation Instructions for Your Team

Share the `INSTALL_ON_IPHONE.md` file with your team members. It contains step-by-step instructions for installing the app on their iPhones.

## 🔧 Troubleshooting

### Service Worker Not Registering
- Check browser console for errors
- Verify you're using HTTPS (required for service workers)
- Clear browser cache and reload

### Icons Not Showing
- Verify `icon-192.png` and `icon-512.png` exist in root directory
- Check file sizes match requirements
- Clear browser cache

### "Add to Home Screen" Not Available
- Must use Safari browser (not Chrome)
- Requires iOS 11.3 or later
- Must be on HTTPS

### Google Sheets Not Loading
- Verify API key is configured for your domain
- Check Sheet ID in `js/config.js`
- Verify sharing permissions on Google Sheet

## 🎨 Customization

### Change App Colors
Edit `manifest.json`:
```json
"background_color": "#1a202c",  // Background color
"theme_color": "#8B0000"        // Theme/header color
```

### Change App Name
Edit `manifest.json`:
```json
"name": "Your New Name",
"short_name": "Short Name"
```

### Update Cache Version
When you make updates, increment the version in `service-worker.js`:
```javascript
const CACHE_NAME = 'perfusion-schedule-v2';  // Increment version
```

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify HTTPS is enabled
3. Test in Safari (required for iOS)
4. Clear cache and try again

## Next Steps

1. ✅ Create icon files (`icon-192.png` and `icon-512.png`)
2. ✅ Deploy to HTTPS hosting
3. ✅ Configure Google API for deployed URL
4. ✅ Test installation on iPhone
5. ✅ Share installation instructions with team

Good luck! 🚀
