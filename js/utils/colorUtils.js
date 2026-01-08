// Color calculation utilities for schedule events

/**
 * Determines the background color for a schedule event based on staffing levels
 * @param {Object} eventData - Event data with shift assignments
 * @returns {string} Hex color code
 */
export function calculateEventColor(eventData) {
    // If no data present
    if (!eventData.dayShift && !eventData.nightShift && !eventData.extraShift) {
        return '#adb5bd'; // Gray - no data
    }

    // Count day and night shifts separately (excluding extra shift, school, and off)
    let dayCount = 0;
    let nightCount = 0;

    // Count day shift
    if (eventData.dayShift && eventData.dayShift !== '_' && eventData.dayShift !== 'Blank') {
        const dayStaff = eventData.dayShift.split('/').filter(s => s.trim() !== '' && s.trim() !== 'Blank');
        dayCount = dayStaff.length;
    }

    // Count night shift
    if (eventData.nightShift && eventData.nightShift !== '_' && eventData.nightShift !== 'Blank') {
        const nightStaff = eventData.nightShift.split('/').filter(s => s.trim() !== '' && s.trim() !== 'Blank');
        nightCount = nightStaff.length;
    }

    // Check if this is a weekend (Saturday or Sunday)
    let isWeekend = false;
    if (eventData.start) {
        // Parse date string properly to avoid timezone issues
        // eventData.start is in format "YYYY-MM-DD"
        const parts = eventData.start.split('-');
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
        const day = parseInt(parts[2]);
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    }

    // Determine color based on staffing
    if (isWeekend) {
        // Weekend logic: 2+ total staff = gray, 1 staff = red, 0 = gray
        const totalStaff = dayCount + nightCount;
        if (totalStaff >= 2) {
            return '#adb5bd'; // Gray - properly staffed for weekend
        } else if (totalStaff === 1) {
            return '#ff6b6b'; // Red - understaffed (missing 1 person)
        } else {
            return '#adb5bd'; // Gray - no staff assigned
        }
    } else {
        // Weekday logic: Day needs 4+, Night needs 2+
        // Red (Critical): Day <= 2 OR Night = 0 OR (Day = 3 AND Night = 1)
        if (dayCount <= 2 || nightCount === 0 || (dayCount === 3 && nightCount === 1)) {
            return '#ff6b6b'; // Red - critical staffing (missing 2+ shifts)
        }

        // Green (Need 1 person): Day = 3 (with Night >= 2) OR Night = 1 (with Day >= 4)
        if ((dayCount === 3 && nightCount >= 2) || (dayCount >= 4 && nightCount === 1)) {
            return '#51cf66'; // Green - understaffed by 1 shift
        }

        // Gray (Properly staffed): Day >= 4 AND Night >= 2
        if (dayCount >= 4 && nightCount >= 2) {
            return '#adb5bd'; // Gray - properly staffed
        }

        // Fallback
        return '#adb5bd'; // Gray - no data
    }
}

/**
 * Checks if an employee is working multiple shifts (double shift)
 * @param {Object} eventData - Event data with shift assignments
 * @returns {boolean} True if any employee works multiple shifts
 */
export function hasDoubleShift(eventData) {
    const allStaff = [];

    // Collect all staff from all shifts
    const shifts = [
        eventData.extraShift,
        eventData.dayShift,
        eventData.nightShift
    ];

    shifts.forEach(shift => {
        if (shift && shift !== '_' && shift !== 'Blank') {
            const staff = shift.split('/').map(s => s.trim()).filter(s => s !== '');
            allStaff.push(...staff);
        }
    });

    // Check for duplicates
    const staffSet = new Set(allStaff);
    return staffSet.size < allStaff.length;
}

/**
 * Checks if there are duplicate assignments (errors)
 * Same as hasDoubleShift but kept separate for semantic clarity
 * @param {Object} eventData - Event data with shift assignments
 * @returns {boolean} True if duplicates found
 */
export function hasDuplicateAssignments(eventData) {
    return hasDoubleShift(eventData);
}

/**
 * Gets all unique staff members from an event
 * @param {Object} eventData - Event data with shift assignments
 * @returns {Array<string>} Array of unique staff initials
 */
export function getUniqueStaff(eventData) {
    const allStaff = [];

    const shifts = [
        eventData.extraShift,
        eventData.dayShift,
        eventData.nightShift,
        eventData.school,
        eventData.off
    ];

    shifts.forEach(shift => {
        if (shift && shift !== '_' && shift !== 'Blank') {
            const staff = shift.split('/').map(s => s.trim()).filter(s => s !== '');
            allStaff.push(...staff);
        }
    });

    return [...new Set(allStaff)];
}

/**
 * Formats shift data for display (removes "Blank" from names)
 * @param {string} value - Shift value from Google Sheets
 * @returns {string} Formatted value
 */
export function formatShiftValue(value) {
    if (!value || value.trim() === '') {
        return '_';
    }

    // If the entire value is just "Blank", return "_"
    if (value === 'Blank') {
        return '_';
    }

    // If value contains slashes (multiple people), remove "Blank" entries
    if (value.includes('/')) {
        return value
            .split('/')
            .map(name => name.trim() === 'Blank' ? '' : name.trim())
            .join('/');
    }

    return value;
}
