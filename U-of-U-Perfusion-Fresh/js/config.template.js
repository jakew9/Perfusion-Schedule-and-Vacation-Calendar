// Configuration Template
// Copy this file to config.js and fill in your actual credentials
// config.js is gitignored to keep credentials secure

export const CONFIG = {
    // Google Sheets API Key
    // Get from: https://console.cloud.google.com/apis/credentials
    API_KEY: 'YOUR_GOOGLE_SHEETS_API_KEY_HERE',

    // Google Sheet ID (from the URL)
    // Example: https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
    SHEET_ID: 'YOUR_SHEET_ID_HERE',

    // Sheet range to fetch
    RANGE: 'Sheet2!A13:X100',

    // Legacy supervisor password
    SUPERVISOR_PASSWORD: 'UofUPerfusion2025!',

    // Default admin account
    DEFAULT_ADMIN: {
        email: 'jakeweston@gmail.com',
        password: 'UofUPerfusion2025!',
        name: 'Jake Weston',
        role: 'admin'
    }
};
