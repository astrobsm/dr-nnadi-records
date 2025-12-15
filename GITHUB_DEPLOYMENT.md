# Deploy Dr Nnadi's Application to GitHub Pages

Follow these steps to deploy your application to GitHub Pages:

## Step 1: Create a GitHub Account (if you don't have one)
1. Go to https://github.com
2. Click "Sign up"
3. Follow the registration process

## Step 2: Create a New Repository
1. Log in to GitHub
2. Click the "+" icon in the top-right corner
3. Select "New repository"
4. Fill in the details:
   - **Repository name**: `dr-nnadi-records` (or any name you prefer)
   - **Description**: "Patient records management for Niger Foundation Hospital"
   - **Visibility**: Choose "Private" (recommended for patient data)
   - ✅ Check "Add a README file"
5. Click "Create repository"

## Step 3: Upload Your Files

### Option A: Using GitHub Web Interface (Easiest)
1. In your new repository, click "Add file" → "Upload files"
2. Drag and drop these files from your folder:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `manifest.json`
   - `logo.png`
   - `README.md`
3. Click "Commit changes"

### Option B: Using Git Command Line
```bash
# Open PowerShell in your project folder
cd "C:\Users\dell\NIGER FOUNDATION REVIES AND SERVICES"

# Initialize git repository
git init

# Add all files
git add index.html styles.css app.js manifest.json logo.png README.md

# Commit files
git commit -m "Initial commit - Dr Nnadi's application"

# Add your GitHub repository as remote (replace with your username and repo name)
git remote add origin https://github.com/YOUR-USERNAME/dr-nnadi-records.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 4: Enable GitHub Pages
1. In your GitHub repository, click "Settings"
2. Scroll down to "Pages" in the left sidebar
3. Under "Source", select:
   - **Branch**: `main`
   - **Folder**: `/ (root)`
4. Click "Save"
5. Wait 1-2 minutes for deployment

## Step 5: Access Your Application
Your app will be available at:
```
https://YOUR-USERNAME.github.io/dr-nnadi-records/
```

Replace `YOUR-USERNAME` with your GitHub username and `dr-nnadi-records` with your repository name.

## Step 6: Use on Your Phone
1. Open your phone's browser (Chrome, Safari, etc.)
2. Go to your GitHub Pages URL
3. **Add to Home Screen**:
   - **Android**: Menu (⋮) → "Add to Home screen"
   - **iPhone**: Share (□↑) → "Add to Home Screen"

Now you can use it like a native app!

---

## Using the Application - View Records by Patient

The application includes a powerful patient filtering feature to help you quickly find and review specific patient records.

### How to Filter Records by Patient:

1. **Access the Filter Section**:
   - Open the application
   - Look for the "Filter by Patient" dropdown or search box

2. **Search Methods**:
   - **By Patient Name**: Type the patient's name in the search field
   - **By Patient ID**: Enter the unique patient identifier
   - **From Dropdown**: Select from the list of all patients

3. **View Filtered Results**:
   - All records for the selected patient will be displayed
   - Records are sorted by date (newest first)
   - Each record shows:
     - Date of visit
     - Diagnosis
     - Treatment provided
     - Medications prescribed
     - Next appointment (if scheduled)

4. **Actions on Filtered Records**:
   - **View Details**: Click on any record to see full information
   - **Edit Record**: Use the edit button to update information
   - **Print**: Generate a printable summary of patient history
   - **Export**: Download patient records as PDF or CSV

5. **Clear Filter**:
   - Click "Show All Records" or "Clear Filter" to return to the full list

### Tips for Efficient Patient Record Management:
- Use the search feature for quick lookups during patient visits
- Review patient history before appointments
- Keep records updated after each consultation
- Use filters to generate patient-specific reports

---

## Update Your Application Later

Whenever you want to update the app:

### Using GitHub Web Interface:
1. Go to your repository
2. Click on the file you want to update
3. Click the pencil icon (Edit)
4. Make your changes
5. Click "Commit changes"

### Using Git Command Line:
```bash
cd "C:\Users\dell\NIGER FOUNDATION REVIES AND SERVICES"
git add .
git commit -m "Updated application"
git push
```

Changes will appear on your site within 1-2 minutes.

---

## Important Security Notes

⚠️ **PRIVACY WARNING**: 
- If your repository is **PUBLIC**, anyone can see your code (but NOT your patient data)
- If your repository is **PRIVATE**, only you can see it, but GitHub Pages won't work with free private repos
- Patient data is stored ONLY in your browser's local storage - it's NOT uploaded to GitHub
- Each device (phone, computer) has its own separate data

### Recommendations:
1. ✅ Use a **PUBLIC** repository (safe - patient data stays local)
2. ✅ Add password protection if needed (see below)
3. ✅ Don't commit any patient data files
4. ✅ Consider using environment variables for sensitive settings

---

## Optional: Add Simple Password Protection

Create a new file `auth.js` and add this at the top of your `app.js`:

```javascript
// Simple password protection
const APP_PASSWORD = "YourSecurePassword123";
const isAuthenticated = sessionStorage.getItem('authenticated');

if (!isAuthenticated) {
    const password = prompt('Enter password to access the application:');
    if (password === APP_PASSWORD) {
        sessionStorage.setItem('authenticated', 'true');
    } else {
        alert('Incorrect password');
        window.location.href = 'about:blank';
    }
}
```

**Note**: This is basic protection. For real security, use proper authentication services.

---

## Troubleshooting

**Site not loading?**
- Wait 2-3 minutes after enabling GitHub Pages
- Check that your repository is public
- Verify all files are uploaded correctly
- Check "Actions" tab for deployment status

**Changes not appearing?**
- Wait 1-2 minutes for GitHub to rebuild
- Clear your browser cache
- Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

**Want to use a custom domain?**
- You can configure a custom domain in Settings → Pages
- Example: `records.nigerfoundation.com`

---

## Support

Need help? 
- GitHub Docs: https://docs.github.com/pages
- GitHub Support: https://support.github.com

**Niger Foundation Hospital Enugu**
Burns Plastic and Reconstructive Surgery Services
