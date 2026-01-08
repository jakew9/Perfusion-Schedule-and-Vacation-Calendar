// LocalStorage management for schedule data and user sessions

const STORAGE_KEYS = {
    PUBLISHED_SCHEDULE: 'perfusionPublishedSchedule',
    SCHEDULE_HISTORY: 'perfusionScheduleHistory',
    CURRENT_USER: 'perfusionCurrentUser',
    USERS_DB: 'perfusionUsersDB',
    PENDING_REGISTRATIONS: 'perfusionPendingRegistrations'
};

/**
 * Saves the published schedule to localStorage
 * @param {Array} events - Array of calendar events
 */
export function savePublishedSchedule(events) {
    try {
        const scheduleData = {
            events: events,
            publishedAt: new Date().toISOString(),
            version: generateVersionNumber()
        };
        localStorage.setItem(STORAGE_KEYS.PUBLISHED_SCHEDULE, JSON.stringify(scheduleData));
        return scheduleData;
    } catch (error) {
        console.error('Error saving published schedule:', error);
        return null;
    }
}

/**
 * Gets the published schedule from localStorage
 * @returns {Object|null} Schedule data or null if not found
 */
export function getPublishedSchedule() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.PUBLISHED_SCHEDULE);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error getting published schedule:', error);
        return null;
    }
}

/**
 * Adds current schedule to history before publishing a new one
 * @param {Object} scheduleData - Schedule data to archive
 */
export function addToScheduleHistory(scheduleData) {
    try {
        const history = getScheduleHistory();
        history.unshift(scheduleData); // Add to beginning

        // Keep only last 10 versions
        if (history.length > 10) {
            history.splice(10);
        }

        localStorage.setItem(STORAGE_KEYS.SCHEDULE_HISTORY, JSON.stringify(history));
        return history;
    } catch (error) {
        console.error('Error adding to schedule history:', error);
        return [];
    }
}

/**
 * Gets schedule history from localStorage
 * @returns {Array} Array of previous schedule versions
 */
export function getScheduleHistory() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.SCHEDULE_HISTORY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting schedule history:', error);
        return [];
    }
}

/**
 * Deletes a specific version from history
 * @param {number} index - Index of version to delete
 */
export function deleteScheduleVersion(index) {
    try {
        const history = getScheduleHistory();
        history.splice(index, 1);
        localStorage.setItem(STORAGE_KEYS.SCHEDULE_HISTORY, JSON.stringify(history));
        return history;
    } catch (error) {
        console.error('Error deleting schedule version:', error);
        return [];
    }
}

/**
 * Generates a version number based on current date/time
 * @returns {string} Version string (e.g., "v2025-01-04_14-30")
 */
function generateVersionNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `v${year}-${month}-${day}_${hours}-${minutes}`;
}

// ===== MONTH-BASED STORAGE FUNCTIONS =====

/**
 * Gets all published schedules (month-based structure)
 * @returns {Object} Object with month keys (e.g., {"2025-01": {...}, "2025-02": {...}})
 */
export function getAllPublishedSchedules() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.PUBLISHED_SCHEDULE);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('Error getting published schedules:', error);
        return {};
    }
}

/**
 * Gets published schedule for a specific month
 * @param {string} monthKey - Month key (e.g., "2025-01")
 * @returns {Object|null} Month schedule data or null
 */
export function getPublishedScheduleByMonth(monthKey) {
    try {
        const allSchedules = getAllPublishedSchedules();
        return allSchedules[monthKey] || null;
    } catch (error) {
        console.error('Error getting published schedule for month:', error);
        return null;
    }
}

/**
 * Saves published schedule for a specific month
 * @param {string} monthKey - Month key (e.g., "2025-01")
 * @param {Array} events - Array of calendar events for this month
 * @param {string} monthName - Month name (e.g., "January")
 * @returns {Object} Saved schedule data
 */
export function savePublishedScheduleForMonth(monthKey, events, monthName) {
    try {
        const allSchedules = getAllPublishedSchedules();

        // Get current version number for this month (or start at 1)
        const currentMonth = allSchedules[monthKey];
        const versionNumber = currentMonth ? currentMonth.versionNumber + 1 : 1;

        const scheduleData = {
            version: `${monthName} ${versionNumber}`,
            versionNumber: versionNumber,
            monthKey: monthKey,
            events: events,
            publishedAt: new Date().toISOString()
        };

        allSchedules[monthKey] = scheduleData;
        localStorage.setItem(STORAGE_KEYS.PUBLISHED_SCHEDULE, JSON.stringify(allSchedules));

        return scheduleData;
    } catch (error) {
        console.error('Error saving published schedule for month:', error);
        return null;
    }
}

/**
 * Gets all history (month-based structure)
 * @returns {Object} Object with month keys containing arrays of versions
 */
export function getAllScheduleHistory() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.SCHEDULE_HISTORY);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('Error getting schedule history:', error);
        return {};
    }
}

/**
 * Gets history for a specific month
 * @param {string} monthKey - Month key (e.g., "2025-01")
 * @returns {Array} Array of version objects for this month
 */
export function getScheduleHistoryByMonth(monthKey) {
    try {
        const allHistory = getAllScheduleHistory();
        return allHistory[monthKey] || [];
    } catch (error) {
        console.error('Error getting history for month:', error);
        return [];
    }
}

/**
 * Adds schedule to history for a specific month
 * @param {string} monthKey - Month key (e.g., "2025-01")
 * @param {Object} scheduleData - Schedule data to archive
 */
export function addToScheduleHistoryByMonth(monthKey, scheduleData) {
    try {
        const allHistory = getAllScheduleHistory();

        console.log(`[addToScheduleHistoryByMonth] Before adding - ${monthKey}:`, {
            existingHistoryCount: allHistory[monthKey] ? allHistory[monthKey].length : 0,
            versionToArchive: scheduleData.version
        });

        if (!allHistory[monthKey]) {
            allHistory[monthKey] = [];
        }

        // Add to beginning of this month's history
        allHistory[monthKey].unshift(scheduleData);

        // Keep only last 20 versions per month
        if (allHistory[monthKey].length > 20) {
            allHistory[monthKey].splice(20);
        }

        localStorage.setItem(STORAGE_KEYS.SCHEDULE_HISTORY, JSON.stringify(allHistory));

        console.log(`[addToScheduleHistoryByMonth] After adding - ${monthKey}:`, {
            newHistoryCount: allHistory[monthKey].length,
            allVersions: allHistory[monthKey].map(v => v.version)
        });

        return allHistory[monthKey];
    } catch (error) {
        console.error('Error adding to schedule history:', error);
        return [];
    }
}

/**
 * Deletes a specific version from month history
 * @param {string} monthKey - Month key (e.g., "2025-01")
 * @param {number} index - Index of version to delete
 */
export function deleteScheduleVersionByMonth(monthKey, index) {
    try {
        const allHistory = getAllScheduleHistory();

        if (allHistory[monthKey]) {
            allHistory[monthKey].splice(index, 1);
            localStorage.setItem(STORAGE_KEYS.SCHEDULE_HISTORY, JSON.stringify(allHistory));
        }

        return allHistory[monthKey] || [];
    } catch (error) {
        console.error('Error deleting schedule version:', error);
        return [];
    }
}

/**
 * Gets list of all months that have published schedules
 * @returns {Array} Array of month keys (e.g., ["2025-01", "2025-02"])
 */
export function getPublishedMonths() {
    try {
        const allSchedules = getAllPublishedSchedules();
        return Object.keys(allSchedules).sort();
    } catch (error) {
        console.error('Error getting published months:', error);
        return [];
    }
}

/**
 * Saves current user session
 * @param {Object} user - User object
 */
export function saveCurrentUser(user) {
    try {
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } catch (error) {
        console.error('Error saving current user:', error);
    }
}

/**
 * Gets current user session
 * @returns {Object|null} User object or null
 */
export function getCurrentUser() {
    try {
        const data = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

/**
 * Clears current user session (logout)
 */
export function clearCurrentUser() {
    try {
        sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch (error) {
        console.error('Error clearing current user:', error);
    }
}

/**
 * Gets all registered users
 * @returns {Array} Array of user objects
 */
export function getAllUsers() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.USERS_DB);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting users:', error);
        return [];
    }
}

/**
 * Saves users database
 * @param {Array} users - Array of user objects
 */
export function saveUsers(users) {
    try {
        localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(users));
    } catch (error) {
        console.error('Error saving users:', error);
    }
}

/**
 * Adds a new user to the database
 * @param {Object} user - User object
 */
export function addUser(user) {
    try {
        const users = getAllUsers();
        users.push(user);
        saveUsers(users);
        return true;
    } catch (error) {
        console.error('Error adding user:', error);
        return false;
    }
}

/**
 * Updates an existing user
 * @param {string} email - User email
 * @param {Object} updates - Properties to update
 */
export function updateUser(email, updates) {
    try {
        const users = getAllUsers();
        const index = users.findIndex(u => u.email === email);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            saveUsers(users);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error updating user:', error);
        return false;
    }
}

/**
 * Deletes a user from the database
 * @param {string} email - User email
 */
export function deleteUser(email) {
    try {
        const users = getAllUsers();
        const filtered = users.filter(u => u.email !== email);
        saveUsers(filtered);
        return true;
    } catch (error) {
        console.error('Error deleting user:', error);
        return false;
    }
}

/**
 * Gets pending registration requests
 * @returns {Array} Array of pending registration objects
 */
export function getPendingRegistrations() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.PENDING_REGISTRATIONS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting pending registrations:', error);
        return [];
    }
}

/**
 * Saves pending registrations
 * @param {Array} registrations - Array of registration objects
 */
export function savePendingRegistrations(registrations) {
    try {
        localStorage.setItem(STORAGE_KEYS.PENDING_REGISTRATIONS, JSON.stringify(registrations));
    } catch (error) {
        console.error('Error saving pending registrations:', error);
    }
}

/**
 * Adds a pending registration request
 * @param {Object} registration - Registration object
 */
export function addPendingRegistration(registration) {
    try {
        const pending = getPendingRegistrations();
        pending.push({
            ...registration,
            requestedAt: new Date().toISOString()
        });
        savePendingRegistrations(pending);
        return true;
    } catch (error) {
        console.error('Error adding pending registration:', error);
        return false;
    }
}

/**
 * Removes a pending registration
 * @param {string} email - Email of registration to remove
 */
export function removePendingRegistration(email) {
    try {
        const pending = getPendingRegistrations();
        const filtered = pending.filter(r => r.email !== email);
        savePendingRegistrations(filtered);
        return true;
    } catch (error) {
        console.error('Error removing pending registration:', error);
        return false;
    }
}

/**
 * Initializes the storage with default admin if no users exist
 * @param {Object} defaultAdmin - Default admin configuration
 */
export function initializeStorage(defaultAdmin) {
    const users = getAllUsers();
    if (users.length === 0) {
        // Add default admin
        addUser({
            email: defaultAdmin.email,
            password: defaultAdmin.password, // In production, this should be hashed
            name: defaultAdmin.name,
            role: defaultAdmin.role,
            approved: true,
            createdAt: new Date().toISOString()
        });
        console.log('Default admin account created');
    }
}
