# University of Utah Perfusion Schedule Manager

A client-side web application for managing perfusion schedules with Google Sheets integration, version control, and role-based access.

## Features

- **Authentication System**: Login, registration with admin approval, role-based access (admin, supervisor, user)
- **Google Sheets Integration**: Fetch and sync schedule data from Google Sheets API v4
- **Interactive Calendar**: FullCalendar 5.11.0 with month/week/day views
- **Schedule Editing**: Supervisor/admin can edit schedules and publish versions
- **Version Management**: Track and compare published schedule versions
- **Auto Color-Coding**: Visual indicators for staffing levels (red/green/gray)
- **Duplicate Detection**: Highlights double shifts and scheduling conflicts
- **LocalStorage Persistence**: Client-side data storage with no backend required
- **Responsive Design**: Glassmorphism UI with mobile-friendly layout

## Technology Stack

- **Frontend**: Vanilla JavaScript ES6 modules
- **Calendar**: FullCalendar 5.11.0
- **API**: Google Sheets API v4
- **Storage**: LocalStorage + SessionStorage
- **Styling**: Custom CSS with glassmorphism design
- **No Build Process**: Direct browser execution

## Project Structure

```
U-of-U-Perfusion-Fresh/
├── index.html                          # Main application file
├── style.css                           # All styling
├── script.js                           # Bootstrap/entry point
├── .gitignore                          # Git ignore rules
├── README.md                           # This file
└── js/
    ├── config.template.js              # Template for credentials
    ├── config.js                       # Actual credentials (gitignored)
    ├── api/
    │   └── sheetsapi.js               # Google Sheets integration
    ├── auth/
    │   ├── authManager.js             # Authentication logic
    │   └── authUI.js                  # Authentication UI
    ├── calendar/
    │   └── calendarInit.js            # FullCalendar setup
    ├── components/
    │   ├── modals.js                  # Modal dialogs
    │   ├── navigation.js              # Page navigation
    │   └── versionManager.js          # Version management
    ├── state/
    │   └── calendarState.js           # Centralized state
    ├── storage/
    │   └── localStorageManager.js     # localStorage operations
    └── utils/
        └── colorUtils.js              # Color utilities
```

## Setup Instructions

### 1. Configure Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API
4. Create credentials (API Key)
5. Copy your API key

### 2. Prepare Your Google Sheet

1. Create or open your Google Sheet
2. Ensure the sheet has the following column structure:
   - Column A: Date
   - Column P (index 15): Extra Shift (+1)
   - Column Q (index 16): Day Shift
   - Column R (index 17): Night Shift
   - Column S (index 18): School
   - Column T (index 19): Off
3. Make sure the sheet is publicly readable or share it appropriately
4. Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`

### 3. Configure the Application

1. Open `js/config.js`
2. Replace the placeholder values:
   ```javascript
   API_KEY: 'YOUR_GOOGLE_SHEETS_API_KEY_HERE',
   SHEET_ID: 'YOUR_SHEET_ID_HERE',
   ```
3. Optionally modify:
   - `RANGE`: Default is 'Sheet2!A13:X100'
   - `SUPERVISOR_PASSWORD`: Default is 'UofUPerfusion2025!'
   - `DEFAULT_ADMIN`: Default admin account details

### 4. Run the Application

**Option 1: Local Server (Recommended)**
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000
```

Then open: `http://localhost:8000`

**Option 2: Direct File Open**
- Open `index.html` in a modern web browser
- Note: Some browsers may block ES6 modules from local files. A local server is recommended.

## Default Credentials

**Admin Account:**
- Email: `jakeweston@gmail.com`
- Password: `UofUPerfusion2025!`

**Legacy Supervisor Password:**
- Password: `UofUPerfusion2025!`

## User Roles

### Regular User
- View published schedules
- Access preferences and important dates

### Supervisor
- All user permissions
- View read-only schedule
- Edit and publish schedules
- Manage schedule versions

### Admin
- All supervisor permissions
- Approve/reject user registrations
- Promote/demote users
- Remove users
- Full user management

## Usage Guide

### For Regular Users

1. **Login**: Use your approved account credentials
2. **View Schedule**: See the published schedule on the main page
3. **Click Events**: Click any date to see detailed shift information
4. **Navigation**: Use bottom navigation to access different sections

### For Supervisors/Admins

1. **Access Supervisor Menu**: Click the Supervisor tab in bottom navigation
2. **View Schedule**: Read-only view of the current schedule
3. **Edit Schedule**:
   - Click "Edit Schedule"
   - Click any date to edit shifts
   - Format: Use "/" to separate multiple initials (e.g., "JM/KL/RT")
   - Click "Publish" when ready
4. **Manage Versions**:
   - View all published versions
   - Compare different versions
   - Delete old versions

### For Admins Only

1. **User Management**: Access from Supervisor menu
2. **Pending Registrations**: Approve or reject new user requests
3. **Active Users**: Promote, demote, or remove users

## Data Flow

```
Google Sheets → sheetsapi.js → localStorageManager.js → calendarInit.js → FullCalendar
```

## Color Coding

- **Green**: Properly staffed (3+ people)
- **Red**: Understaffed (1-2 people)
- **Gray**: No data or no staff assigned
- **Green Border**: Double shift (employee working multiple shifts)
- **Red Border**: Duplicate assignment (scheduling error)

## LocalStorage Keys

- `perfusionPublishedSchedule`: Current published schedule
- `perfusionScheduleHistory`: Array of previous versions (max 10)
- `perfusionCurrentUser`: Current session user (sessionStorage)
- `perfusionUsersDB`: All registered users
- `perfusionPendingRegistrations`: Pending user registrations

## Security Notes

⚠️ **Important Security Considerations:**

1. **Client-Side Only**: This application runs entirely in the browser with no backend
2. **Password Storage**: Passwords are stored in plain text in localStorage (NOT production-ready)
3. **API Key**: The Google Sheets API key is exposed in the client code
4. **For Production**:
   - Implement proper password hashing (bcrypt)
   - Use a backend server for authentication
   - Secure the API key server-side
   - Implement HTTPS
   - Add proper session management

## Customization

### Modifying Staffing Thresholds

Edit `js/utils/colorUtils.js`:
```javascript
// Change the threshold for proper staffing
if (staffCount >= 3) {  // Modify this number
    return '#51cf66'; // Green
}
```

### Changing Colors

Edit CSS variables in `style.css`:
```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --success-color: #51cf66;
    --danger-color: #ff6b6b;
    /* ... */
}
```

### Modifying Sheet Range

Edit `js/config.js`:
```javascript
RANGE: 'Sheet2!A13:X100', // Change to your range
```

## Troubleshooting

### Calendar Not Loading
- Check browser console for errors
- Verify Google Sheets API key is correct
- Ensure Sheet ID is correct
- Check if sheet is publicly accessible

### ES6 Module Errors
- Use a local server instead of opening file directly
- Check that all import paths are correct
- Ensure browser supports ES6 modules (use modern browser)

### Authentication Issues
- Clear localStorage and try again
- Check if default admin is initialized
- Verify passwords match configuration

### Data Not Saving
- Check browser localStorage quota
- Ensure localStorage is enabled in browser
- Check browser console for errors

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported (ES6 modules required)

## License

This project is for internal use at the University of Utah Perfusion Department.

## Support

For issues or questions, contact the development team or create an issue in the repository.

## Future Enhancements

- Export schedules to PDF/Excel
- Email notifications for schedule changes
- Mobile app version
- Backend authentication
- Real-time collaboration
- Shift swap requests
- Automated staffing recommendations
