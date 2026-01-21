# Google Sheets Integration Setup Guide

## Overview
This enables your Assessment Tracker to sync data across all devices using Google Sheets as the backend. Your data will be stored in a Google Sheet you control.

---

## Part 1: Update Your GitHub Files (5 minutes)

### Files to Upload
You need to upload **2 updated files** to your GitHub repository:

1. **app.js** - Updated sync functionality
2. **index.html** - Updated settings interface

### How to Upload:
1. Go to your GitHub repository
2. For each file:
   - Click on the file name
   - Click the pencil icon (Edit)
   - Delete all content
   - Copy and paste the new content
   - Click "Commit changes"
3. Wait 1-2 minutes for GitHub Pages to update

---

## Part 2: Create Your Google Sheet (10 minutes)

### Step 1: Create a New Google Sheet
1. Go to https://sheets.google.com
2. Click **+ Blank** to create a new spreadsheet
3. Name it "Year 6 Assessment Data" (or any name you prefer)

### Step 2: Open Apps Script Editor
1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete any default code in the editor
3. Copy **ALL** the code from `GoogleAppsScript.gs` (provided separately)
4. Paste it into the Apps Script editor
5. Click the **Save** icon (💾)
6. Name your project "Assessment Tracker Backend"

### Step 3: Deploy as Web App
1. In the Apps Script editor, click **Deploy** → **New deployment**
2. Click the gear icon (⚙️) next to "Select type"
3. Choose **Web app**
4. Fill in the settings:
   - **Description**: "Assessment Tracker API"
   - **Execute as**: **Me** (your email)
   - **Who has access**: **Anyone** 
     ⚠️ Important: Must be "Anyone" for cross-device access
5. Click **Deploy**
6. You may see a warning about authorizing the app:
   - Click **Authorize access**
   - Select your Google account
   - Click **Advanced** → **Go to Assessment Tracker Backend (unsafe)**
   - Click **Allow**
7. **Copy the Web App URL** - it looks like:
   ```
   https://script.google.com/macros/s/AKfycbz.../exec
   ```
8. Click **Done**

---

## Part 3: Configure Your App (5 minutes)

### Step 1: Add the Script URL
1. Open your Assessment Tracker app (the GitHub Pages URL)
2. Go to **Settings** tab
3. Scroll to "Google Sheets Integration"
4. Paste your **Web App URL** in the "Google Apps Script URL" field
5. Click **Save Script URL**

### Step 2: Test the Connection
1. Click **Test Connection**
2. You should see "✓ Connection successful!"
3. If you get an error:
   - Double-check the URL is correct
   - Make sure you deployed with "Anyone" access
   - Try redeploying the script

### Step 3: Upload Your Data
1. Click **⬆️ Sync Now (Upload)**
2. This uploads your current data to Google Sheets
3. Wait for "● Synced" status

### Step 4: Verify in Google Sheets
1. Go back to your Google Sheet
2. You should see two new tabs:
   - **TrackerData** - Contains your raw data (JSON)
   - **Summary** - Human-readable summary

---

## Part 4: Using Cross-Device Sync

### On Your First Device (where you have data):
1. Settings → Enter Script URL → Save
2. Click **⬆️ Sync Now (Upload)**
3. Your data is now in Google Sheets

### On Your Second Device (iPad, Mac, etc.):
1. Open the app (same GitHub Pages URL)
2. Settings → Enter the **same Script URL** → Save
3. Click **⬇️ Load from Sheets**
4. Your data appears!

### Daily Use:
- **After making changes**: Click **⬆️ Sync Now** to upload
- **To get latest data**: Click **⬇️ Load from Sheets** to download
- The app will show "● Synced" when complete

---

## How It Works

### Data Flow:
```
iPad → Sync Now → Google Sheets ← Load from Sheets ← Windows Laptop
```

### What Gets Synced:
✅ All students
✅ All assessments and grades
✅ All curriculum progress and notes
✅ All anecdotal notes
✅ All personal entries (Behaviour, Social, Interests, Life Events)

### What Doesn't Sync:
- Your PIN (stays local for security)
- Login status

---

## Troubleshooting

### "Connection failed" error
**Solution:**
- Check the Script URL is correct (must end with `/exec`)
- Redeploy the Apps Script with "Anyone" access
- Clear browser cache and try again

### "No data found" when loading
**Solution:**
- You need to **Sync Now (Upload)** from a device with data first
- Check the Google Sheet has "TrackerData" tab with content

### Data not appearing on second device
**Solution:**
- Make sure you're using the **exact same Script URL** on both devices
- Click **Load from Sheets** (⬇️) not Sync Now (⬆️)
- Check your internet connection

### Changes not syncing
**Solution:**
- Click **Sync Now** manually after making changes
- Auto-sync happens in background but manual is more reliable

### "Authorization required" error
**Solution:**
- Go back to Apps Script editor
- Re-authorize the script (Extensions → Apps Script → Run → Authorize)
- Redeploy if needed

---

## Best Practices

### Syncing Workflow:
1. **Start of day**: Load from Sheets (⬇️) on your current device
2. **After data entry**: Sync Now (⬆️) to save changes
3. **End of day**: Final Sync Now (⬆️)
4. **Switching devices**: Always Load from Sheets (⬇️) first

### Backup Strategy:
Even with Google Sheets sync, still:
- Export data weekly (Settings → Export All Data)
- Save exports to cloud storage
- Google Sheets itself is a backup, but redundancy is good!

### Multiple Users:
⚠️ This system is designed for ONE teacher
- Don't share the Script URL with others
- Multiple people editing simultaneously may cause conflicts
- Use "Load from Sheets" before editing if someone else might have made changes

---

## Privacy & Security

### What's Stored:
- All data is in **your** Google Sheet
- Only you have access to the spreadsheet
- The Web App URL is not easily guessable

### Security Notes:
- Web App URL is like a password - keep it private
- Anyone with the URL can read/write your data
- Don't share the URL publicly
- You can redeploy to get a new URL if needed

### To Revoke Access:
1. Go to Apps Script editor
2. Deploy → Manage deployments
3. Click archive icon on your deployment
4. This will disable the sync (app still works locally)

---

## Advanced: Redeploying

If you need to update the script or get a new URL:

1. Apps Script editor → Make your changes
2. Click **Deploy** → **Manage deployments**
3. Click pencil icon (✏️) next to your deployment
4. Change **Version** to "New version"
5. Click **Deploy**
6. Copy the new URL
7. Update in your app settings

---

## FAQ

**Q: Will this cost money?**
A: No, Google Apps Script is free for personal use.

**Q: Is there a limit to how much data I can store?**
A: Google Sheets allows 10 million cells. You'll never hit this limit with 28 students.

**Q: Can I edit data directly in Google Sheets?**
A: Not recommended. The app expects specific JSON format. Use the app to edit.

**Q: What if I accidentally delete the Google Sheet?**
A: Use your exported backup files to restore data.

**Q: Can I use this with multiple classes?**
A: Yes! Create separate Google Sheets for each class and switch Script URLs in settings.

**Q: Does this work offline?**
A: The app works offline, but sync requires internet. Changes save locally and sync when connected.

---

## Support

If you run into issues:
1. Check this guide's Troubleshooting section
2. Verify all steps were followed exactly
3. Try redeploying the script
4. Check browser console for errors (F12 → Console)

Remember: Your data is always safe locally even if sync fails!

---

**Created for Year 6 Assessment Tracker**
**Version: 1.1 - Google Apps Script Integration**
