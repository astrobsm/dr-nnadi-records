# Dr Nnadi's Surgeries, Reviews and Procedures

A comprehensive patient record management application for Niger Foundation Hospital Enugu - Burns Plastic and Reconstructive Surgery Services.

## Features

- **Patient Record Management**: Track patient visits, procedures, and services
- **Dynamic Forms**: Conditional fields based on service type (NPWT size selection, custom service specification)
- **Service Types Supported**:
  - Normal Ward Round
  - Wound Care Review
  - Bedside Debridement
  - Surgery
  - First Time Out Patient Review
  - Follow Up Out Patient Review
  - Negative Pressure Wound Therapy (with size options: Small, Intermediate, Extensive)
  - Burn Wound Care Review
  - Others (with custom specification)

- **Daily Summary & Reports**: View and export daily patient records
- **PDF Export**: Generate professional PDF reports with hospital branding
- **Print Functionality**: Print daily summaries
- **Data Persistence**: Records saved locally in browser storage
- **Filter & Search**: Filter records by date and service type

## How to Use

1. **Open the Application**: Double-click `index.html` to open in your web browser
2. **Add Logo**: Place your hospital logo image as `logo.png` in the same folder (optional - a default logo will be generated)
3. **Add Records**: 
   - Fill in patient details
   - Select service type
   - Additional fields appear based on service type
   - Enter fee and optional notes
   - Click "Save Record"
4. **View Records**: Switch to "View Records" tab to see all patient records
5. **Daily Summary**: Switch to "Daily Summary" tab to view and export daily reports

## Installation

No installation required! Simply:
1. Ensure all files are in the same folder:
   - index.html
   - styles.css
   - app.js
   - logo.png (optional)
2. Open `index.html` in any modern web browser

## Requirements

- Modern web browser (Chrome, Firefox, Edge, Safari)
- Internet connection (for PDF export libraries)

## Data Storage

All patient records are stored locally in your browser's localStorage. Data persists between sessions but remains on your local computer only.

## Customization

To add your hospital logo:
1. Save your logo image as `logo.png` in the application folder
2. Recommended size: 200x200 pixels
3. Supported formats: PNG, JPG

## Support

For issues or questions, contact the IT department at Niger Foundation Hospital Enugu.

---

**Niger Foundation Hospital Enugu**  
Burns Plastic and Reconstructive Surgery Services  
© 2025 All Rights Reserved
