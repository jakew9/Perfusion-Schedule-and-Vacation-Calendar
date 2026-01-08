// Centralized calendar state management

/**
 * Calendar instances
 */
const calendarInstances = {
    calendar: null,              // Main published schedule calendar
    supervisorViewCalendar: null, // Read-only supervisor view
    supervisorEditCalendar: null, // Editable supervisor calendar
    versionCalendar: null,        // Version comparison calendar
    historyCalendar: null,        // Schedule history calendar
    accountCalendar: null         // User account calendar
};

/**
 * Current schedule data
 */
let currentScheduleData = [];
let editingScheduleData = [];
let viewingVersionData = null;

/**
 * Sets a calendar instance
 * @param {string} name - Calendar name
 * @param {Object} instance - FullCalendar instance
 */
export function setCalendar(name, instance) {
    if (calendarInstances.hasOwnProperty(name)) {
        calendarInstances[name] = instance;
    } else {
        console.error(`Unknown calendar: ${name}`);
    }
}

/**
 * Gets a calendar instance
 * @param {string} name - Calendar name
 * @returns {Object|null} FullCalendar instance or null
 */
export function getCalendar(name) {
    return calendarInstances[name] || null;
}

/**
 * Destroys a calendar instance
 * @param {string} name - Calendar name
 */
export function destroyCalendar(name) {
    const calendar = getCalendar(name);
    if (calendar) {
        calendar.destroy();
        calendarInstances[name] = null;
    }
}

/**
 * Destroys all calendar instances
 */
export function destroyAllCalendars() {
    Object.keys(calendarInstances).forEach(name => {
        destroyCalendar(name);
    });
}

/**
 * Refreshes a calendar instance
 * @param {string} name - Calendar name
 */
export function refreshCalendar(name) {
    const calendar = getCalendar(name);
    if (calendar) {
        calendar.refetchEvents();
        calendar.render();
    }
}

/**
 * Sets the current schedule data
 * @param {Array} data - Array of event objects
 */
export function setCurrentScheduleData(data) {
    currentScheduleData = data;
}

/**
 * Gets the current schedule data
 * @returns {Array} Array of event objects
 */
export function getCurrentScheduleData() {
    return currentScheduleData;
}

/**
 * Sets the editing schedule data
 * @param {Array} data - Array of event objects
 */
export function setEditingScheduleData(data) {
    editingScheduleData = JSON.parse(JSON.stringify(data)); // Deep copy
}

/**
 * Gets the editing schedule data
 * @returns {Array} Array of event objects
 */
export function getEditingScheduleData() {
    return editingScheduleData;
}

/**
 * Updates a specific event in the editing schedule
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @param {Object} updates - Object with fields to update
 */
export function updateEditingEvent(dateStr, updates) {
    const event = editingScheduleData.find(e => e.start === dateStr);
    if (event) {
        Object.assign(event, updates);
    } else {
        // Create new event for this date
        editingScheduleData.push({
            id: `event-${Date.now()}`,
            start: dateStr,
            allDay: true,
            extraShift: updates.extraShift || '_',
            dayShift: updates.dayShift || '_',
            nightShift: updates.nightShift || '_',
            school: updates.school || '_',
            off: updates.off || '_',
            backgroundColor: updates.backgroundColor || 'auto'
        });
    }
}

/**
 * Gets an event from editing data by date
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Object|null} Event object or null
 */
export function getEditingEventByDate(dateStr) {
    return editingScheduleData.find(e => e.start === dateStr) || null;
}

/**
 * Sets the currently viewing version data
 * @param {Object} versionData - Version data object
 */
export function setViewingVersionData(versionData) {
    viewingVersionData = versionData;
}

/**
 * Gets the currently viewing version data
 * @returns {Object|null} Version data or null
 */
export function getViewingVersionData() {
    return viewingVersionData;
}

/**
 * Clears all schedule data
 */
export function clearAllScheduleData() {
    currentScheduleData = [];
    editingScheduleData = [];
    viewingVersionData = null;
}

/**
 * Gets all calendar instances
 * @returns {Object} Object with all calendar instances
 */
export function getAllCalendars() {
    return calendarInstances;
}

/**
 * Checks if a calendar is initialized
 * @param {string} name - Calendar name
 * @returns {boolean} True if calendar exists and is initialized
 */
export function isCalendarInitialized(name) {
    const calendar = getCalendar(name);
    return calendar !== null;
}
