// Google Sheets API integration

import { CONFIG } from '../config.js';
import { formatShiftValue } from '../utils/colorUtils.js';

let gapiInitialized = false;

/**
 * Initializes the Google Sheets API
 * @returns {Promise} Promise that resolves when API is ready
 */
export function initSheetsAPI() {
    return new Promise((resolve, reject) => {
        if (gapiInitialized) {
            resolve();
            return;
        }

        if (typeof gapi === 'undefined') {
            reject(new Error('Google API not loaded'));
            return;
        }

        gapi.load('client', async () => {
            try {
                await gapi.client.init({
                    apiKey: CONFIG.API_KEY,
                    discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
                });
                gapiInitialized = true;
                console.log('Google Sheets API initialized');
                resolve();
            } catch (error) {
                console.error('Error initializing Google Sheets API:', error);
                reject(error);
            }
        });
    });
}

/**
 * Fetches schedule data from Google Sheets
 * @returns {Promise<Array>} Promise that resolves with array of event objects
 */
export async function fetchScheduleFromSheets() {
    try {
        // Ensure API is initialized
        if (!gapiInitialized) {
            await initSheetsAPI();
        }

        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.SHEET_ID,
            range: CONFIG.RANGE
        });

        const rows = response.result.values;

        if (!rows || rows.length === 0) {
            console.log('No data found in sheet');
            return [];
        }

        // Parse rows into event objects
        const events = parseSheetData(rows);
        return events;

    } catch (error) {
        console.error('Error fetching schedule from Google Sheets:', error);
        throw error;
    }
}

/**
 * Parses sheet data into calendar event objects
 * @param {Array} rows - Raw rows from Google Sheets
 * @returns {Array} Array of event objects
 */
function parseSheetData(rows) {
    const events = [];

    rows.forEach((row, index) => {
        // Column mapping:
        // A (0): Date
        // P (15): Extra Shift (+1)
        // Q (16): Day Shift
        // R (17): Night Shift
        // S (18): School
        // T (19): Off

        const dateStr = row[0]; // Column A
        if (!dateStr) return; // Skip if no date

        // Parse date
        const date = parseDate(dateStr);
        if (!date) return; // Skip if invalid date

        // Extract shift data
        const extraShift = formatShiftValue(row[15] || '');
        const dayShift = formatShiftValue(row[16] || '');
        const nightShift = formatShiftValue(row[17] || '');
        const school = formatShiftValue(row[18] || '');
        const off = formatShiftValue(row[19] || '');

        // Create event object
        const event = {
            id: `event-${index}`,
            start: date,
            allDay: true,
            extraShift,
            dayShift,
            nightShift,
            school,
            off
        };

        events.push(event);
    });

    return events;
}

/**
 * Parses a date string into ISO format
 * Handles various date formats from Google Sheets
 * @param {string} dateStr - Date string
 * @returns {string|null} ISO date string or null
 */
function parseDate(dateStr) {
    if (!dateStr) return null;

    try {
        // Try parsing as-is first
        let date = new Date(dateStr);

        // Check if valid
        if (!isNaN(date.getTime())) {
            // Return in YYYY-MM-DD format
            return date.toISOString().split('T')[0];
        }

        // Try parsing MM/DD/YYYY format
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const month = parseInt(parts[0]) - 1; // Months are 0-indexed
            const day = parseInt(parts[1]);
            const year = parseInt(parts[2]);
            date = new Date(year, month, day);

            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        }

        return null;
    } catch (error) {
        console.error('Error parsing date:', dateStr, error);
        return null;
    }
}

/**
 * Gets the current sheet ID and range from config
 * @returns {Object} Object with sheetId and range
 */
export function getSheetConfig() {
    return {
        sheetId: CONFIG.SHEET_ID,
        range: CONFIG.RANGE
    };
}

/**
 * Tests the Google Sheets API connection
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testSheetsConnection() {
    try {
        await initSheetsAPI();
        const response = await gapi.client.sheets.spreadsheets.get({
            spreadsheetId: CONFIG.SHEET_ID
        });
        console.log('Google Sheets connection successful:', response.result.properties.title);
        return true;
    } catch (error) {
        console.error('Google Sheets connection failed:', error);
        return false;
    }
}
