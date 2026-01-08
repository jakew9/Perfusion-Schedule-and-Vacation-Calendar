// Date and month utility functions

/**
 * Gets the month and year from a date string
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Object} {year, month} where month is 0-11
 */
export function getMonthYear(dateStr) {
    const parts = dateStr.split('-');
    return {
        year: parseInt(parts[0]),
        month: parseInt(parts[1]) - 1 // 0-indexed
    };
}

/**
 * Checks if a date falls within a specific month/year
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @param {number} year - Full year (e.g., 2025)
 * @param {number} month - Month 0-11 (0 = January)
 * @returns {boolean} True if date is in the specified month
 */
export function isDateInMonth(dateStr, year, month) {
    const dateMonth = getMonthYear(dateStr);
    return dateMonth.year === year && dateMonth.month === month;
}

/**
 * Filters events to only include those in a specific month
 * @param {Array} events - Array of event objects
 * @param {number} year - Full year
 * @param {number} month - Month 0-11
 * @returns {Array} Filtered events
 */
export function filterEventsByMonth(events, year, month) {
    return events.filter(event => isDateInMonth(event.start, year, month));
}

/**
 * Generates an array of month options for selectors
 * @param {number} rangeMonths - Number of months before and after current month
 * @returns {Array} Array of {value, label, year, month} objects
 */
export function generateMonthOptions(rangeMonths = 6) {
    const options = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];

    // Generate months from (current - range) to (current + range)
    for (let i = -rangeMonths; i <= rangeMonths; i++) {
        const date = new Date(currentYear, currentMonth + i, 1);
        const year = date.getFullYear();
        const month = date.getMonth();

        options.push({
            value: `${year}-${String(month + 1).padStart(2, '0')}`,
            label: `${monthNames[month]} ${year}`,
            year: year,
            month: month
        });
    }

    return options;
}

/**
 * Gets the current month/year
 * @returns {Object} {year, month} where month is 0-11
 */
export function getCurrentMonthYear() {
    const now = new Date();
    return {
        year: now.getFullYear(),
        month: now.getMonth()
    };
}

/**
 * Formats a month/year for display
 * @param {number} year - Full year
 * @param {number} month - Month 0-11
 * @returns {string} Formatted string (e.g., "January 2025")
 */
export function formatMonthYear(year, month) {
    const date = new Date(year, month, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Parses a month value string (YYYY-MM) to year and month
 * @param {string} value - Month value (e.g., "2025-02")
 * @returns {Object} {year, month} where month is 0-11
 */
export function parseMonthValue(value) {
    const parts = value.split('-');
    return {
        year: parseInt(parts[0]),
        month: parseInt(parts[1]) - 1
    };
}

/**
 * Gets the first and last date of a month
 * @param {number} year - Full year
 * @param {number} month - Month 0-11
 * @returns {Object} {firstDate, lastDate} as YYYY-MM-DD strings
 */
export function getMonthBounds(year, month) {
    const firstDate = new Date(year, month, 1);
    const lastDate = new Date(year, month + 1, 0);

    return {
        firstDate: formatDateToISO(firstDate),
        lastDate: formatDateToISO(lastDate)
    };
}

/**
 * Formats a Date object to ISO date string (YYYY-MM-DD)
 * @param {Date} date - Date object
 * @returns {string} ISO date string
 */
function formatDateToISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
