// Month-based version management system
// Handles publishing, viewing, and history for individual months

import {
    getAllPublishedSchedules,
    getPublishedScheduleByMonth,
    savePublishedScheduleForMonth,
    getAllScheduleHistory,
    getScheduleHistoryByMonth,
    addToScheduleHistoryByMonth,
    deleteScheduleVersionByMonth,
    getPublishedMonths
} from '../storage/localStorageManager.js';

import {
    getEditingScheduleData,
    setEditingScheduleData
} from '../state/calendarState.js';

import {
    filterEventsByMonth,
    generateMonthOptions,
    getCurrentMonthYear,
    formatMonthYear,
    parseMonthValue,
    getMonthBounds
} from '../utils/dateUtils.js';

import {
    initPublishedCalendar,
    initSupervisorEditCalendar,
    initHistoryCalendar
} from '../calendar/calendarInit.js';

import { getCalendar } from '../state/calendarState.js';

import { fetchScheduleFromSheets } from '../api/sheetsapi.js';

// ===== MODULE STATE =====
let currentEditMonth = null;
let currentPublishedMonth = null;
let currentHistoryMonth = null;

// ===== EDIT PAGE FUNCTIONS =====

/**
 * Initializes the month selector on Edit page
 */
export function initEditMonthSelector() {
    const select = document.getElementById('editMonthSelector');
    if (!select) return;

    // Generate month options (±12 months from current)
    const monthOptions = generateMonthOptions(12);
    select.innerHTML = monthOptions.map(opt =>
        `<option value="${opt.value}">${opt.label}</option>`
    ).join('');

    // Set current month as default
    const current = getCurrentMonthYear();
    const currentValue = `${current.year}-${String(current.month + 1).padStart(2, '0')}`;
    select.value = currentValue;

    // Load the current month
    loadEditMonth();
}

/**
 * Loads the selected month for editing
 */
export function loadEditMonth() {
    const select = document.getElementById('editMonthSelector');
    if (!select) return;

    const selectedValue = select.value;
    const { year, month } = parseMonthValue(selectedValue);
    const monthKey = selectedValue;

    // Update state
    currentEditMonth = { year, month, monthKey };

    // Get all editing data (contains all months)
    const allEditingData = getEditingScheduleData() || [];

    // Filter to only show selected month
    const monthEvents = filterEventsByMonth(allEditingData, year, month);

    // Initialize calendar with filtered events
    initSupervisorEditCalendar(monthEvents);

    // Navigate calendar to the selected month
    setTimeout(() => {
        const calendar = getCalendar('supervisorEditCalendar');
        if (calendar) {
            calendar.gotoDate(new Date(year, month, 1));
        }
    }, 100);

    console.log(`Loaded ${monthEvents.length} events for ${formatMonthYear(year, month)}`);
}

/**
 * Changes the edit month by delta (-1 for previous, +1 for next)
 * @param {number} delta - Month change delta
 */
export function changeEditMonth(delta) {
    const select = document.getElementById('editMonthSelector');
    if (!select) return;

    const currentValue = select.value;
    const { year, month } = parseMonthValue(currentValue);

    // Create new date and add delta months
    const newDate = new Date(year, month + delta, 1);
    const newYear = newDate.getFullYear();
    const newMonth = newDate.getMonth();
    const newValue = `${newYear}-${String(newMonth + 1).padStart(2, '0')}`;

    // Check if new value exists in selector
    const option = Array.from(select.options).find(opt => opt.value === newValue);
    if (option) {
        select.value = newValue;
        loadEditMonth();
    }
}

// ===== PUBLISHED PAGE FUNCTIONS =====

/**
 * Initializes the month selector on Published Schedule page
 */
export function initPublishedMonthSelector() {
    const select = document.getElementById('publishedMonthSelector');
    if (!select) return;

    // Get months that have published schedules
    const publishedMonths = getPublishedMonths();

    if (publishedMonths.length === 0) {
        select.innerHTML = '<option value="">No published schedules</option>';
        // Show empty message in calendar
        const calendarEl = document.getElementById('calendar');
        if (calendarEl) {
            calendarEl.innerHTML = '<div style="text-align: center; padding: 60px 20px; color: white; font-size: 1.2em;">' +
                '<p>No schedule has been published yet.</p>' +
                '<p style="font-size: 0.9em; margin-top: 20px; opacity: 0.8;">Contact a supervisor to publish the first schedule.</p>' +
                '</div>';
        }
        return;
    }

    // Populate selector with published months
    select.innerHTML = publishedMonths.map(monthKey => {
        const { year, month } = parseMonthValue(monthKey);
        const label = formatMonthYear(year, month);
        return `<option value="${monthKey}">${label}</option>`;
    }).join('');

    // Set most recent month or current month as default
    const current = getCurrentMonthYear();
    const currentValue = `${current.year}-${String(current.month + 1).padStart(2, '0')}`;
    if (publishedMonths.includes(currentValue)) {
        select.value = currentValue;
    } else {
        // Use most recent published month
        select.value = publishedMonths[publishedMonths.length - 1];
    }

    // Load the selected month
    loadPublishedMonth();
}

/**
 * Loads the selected published month
 */
export function loadPublishedMonth() {
    const select = document.getElementById('publishedMonthSelector');
    if (!select || !select.value) return;

    const monthKey = select.value;
    const { year, month } = parseMonthValue(monthKey);

    // Update state
    currentPublishedMonth = { year, month, monthKey };

    // Get published schedule for this month
    const publishedData = getPublishedScheduleByMonth(monthKey);

    const versionDisplay = document.getElementById('publishedVersionDisplay');

    if (!publishedData || !publishedData.events) {
        const calendarEl = document.getElementById('calendar');
        if (calendarEl) {
            calendarEl.innerHTML = '<div style="text-align: center; padding: 60px 20px; color: white; font-size: 1.2em;">' +
                `<p>No published schedule for ${formatMonthYear(year, month)}</p>` +
                '</div>';
        }
        if (versionDisplay) {
            versionDisplay.innerHTML = '';
        }
        return;
    }

    // Display version information
    if (versionDisplay) {
        versionDisplay.innerHTML = `Version: ${publishedData.version}`;
    }

    // Initialize calendar with this month's events
    initPublishedCalendar(publishedData.events);

    // Navigate calendar to the selected month
    setTimeout(() => {
        const calendar = getCalendar('calendar');
        if (calendar) {
            calendar.gotoDate(new Date(year, month, 1));
        }
    }, 100);

    console.log(`Loaded published ${publishedData.version} with ${publishedData.events.length} events`);
}

/**
 * Changes the published month by delta
 * @param {number} delta - Month change delta
 */
export function changePublishedMonth(delta) {
    const select = document.getElementById('publishedMonthSelector');
    if (!select) return;

    const publishedMonths = getPublishedMonths();
    const currentIndex = publishedMonths.indexOf(select.value);

    if (currentIndex === -1) return;

    const newIndex = currentIndex + delta;

    // Check bounds
    if (newIndex >= 0 && newIndex < publishedMonths.length) {
        select.value = publishedMonths[newIndex];
        loadPublishedMonth();
    }
}

// ===== PUBLISHING FUNCTIONS =====

/**
 * Shows month selection modal for publishing
 */
export function publishSchedule() {
    const modal = document.getElementById('publishMonthModal');
    const select = document.getElementById('publishMonth');

    if (!modal || !select) {
        console.error('Publish month modal not found');
        return;
    }

    // Get all editing data
    const allEditingData = getEditingScheduleData() || [];

    if (allEditingData.length === 0) {
        alert('No schedule data to publish. Please load data from Google Sheets first.');
        return;
    }

    // Get unique months from editing data
    const monthsSet = new Set();
    allEditingData.forEach(event => {
        const monthKey = event.start.substring(0, 7); // "YYYY-MM"
        monthsSet.add(monthKey);
    });

    const months = Array.from(monthsSet).sort();

    // Populate select with months that have data
    select.innerHTML = months.map(monthKey => {
        const { year, month } = parseMonthValue(monthKey);
        const label = formatMonthYear(year, month);
        return `<option value="${monthKey}">${label}</option>`;
    }).join('');

    // Set current editing month as default if available
    if (currentEditMonth && months.includes(currentEditMonth.monthKey)) {
        select.value = currentEditMonth.monthKey;
    }

    // Show modal
    modal.style.display = 'block';
}

/**
 * Handles the publish form submission
 * @param {Event} event - Form submit event
 */
export function confirmMonthPublish(event) {
    event.preventDefault();

    const select = document.getElementById('publishMonth');
    const monthKey = select.value;

    if (!monthKey) {
        alert('Please select a month to publish');
        return;
    }

    const { year, month } = parseMonthValue(monthKey);
    const monthName = formatMonthYear(year, month).split(' ')[0]; // e.g., "January"

    // Confirm with user
    if (!confirm(`Publish schedule for ${formatMonthYear(year, month)}?\n\nThis will create a new version for this month.`)) {
        return;
    }

    try {
        // Get all editing data
        const allEditingData = getEditingScheduleData() || [];

        // Filter to only selected month
        const monthEvents = filterEventsByMonth(allEditingData, year, month);

        if (monthEvents.length === 0) {
            alert(`No events found for ${formatMonthYear(year, month)}`);
            return;
        }

        // Archive current published version if exists
        const currentPublished = getPublishedScheduleByMonth(monthKey);
        console.log('Publishing - Current published version:', currentPublished);
        if (currentPublished) {
            console.log('Archiving to history:', currentPublished.version);
            const archived = addToScheduleHistoryByMonth(monthKey, currentPublished);
            console.log('History after archiving:', archived);
        } else {
            console.log('No previous version to archive - this is the first publish for this month');
        }

        // Save new published version
        const savedData = savePublishedScheduleForMonth(monthKey, monthEvents, monthName);
        console.log('Saved new version:', savedData.version);

        if (savedData) {
            // Close modal
            document.getElementById('publishMonthModal').style.display = 'none';

            // Show success message
            alert(`Successfully published ${savedData.version} with ${monthEvents.length} events`);

            // Refresh published month selector if on published page
            const publishedSelector = document.getElementById('publishedMonthSelector');
            if (publishedSelector) {
                initPublishedMonthSelector();
            }

            console.log(`Published ${savedData.version}`);
        } else {
            alert('Error publishing schedule. Please try again.');
        }

    } catch (error) {
        console.error('Error publishing schedule:', error);
        alert('Error publishing schedule: ' + error.message);
    }
}

// ===== HISTORY PAGE FUNCTIONS =====

/**
 * Initializes the History page
 */
export function initHistoryPage() {
    const select = document.getElementById('historyMonthFilter');
    if (!select) return;

    // Get all months that have either current published OR history
    const allPublished = getAllPublishedSchedules();
    const allHistory = getAllScheduleHistory();

    // Combine months from both sources
    const monthKeysSet = new Set([
        ...Object.keys(allPublished),
        ...Object.keys(allHistory).filter(key => allHistory[key].length > 0)
    ]);

    const monthKeys = Array.from(monthKeysSet).sort().reverse();

    if (monthKeys.length === 0) {
        select.innerHTML = '<option value="">No published schedules</option>';
        document.getElementById('historyVersionsList').innerHTML =
            '<p style="color: white;">No published schedules available.</p>';
        return;
    }

    // Populate select with all months that have published data
    select.innerHTML = monthKeys.map(monthKey => {
        const { year, month } = parseMonthValue(monthKey);
        const label = formatMonthYear(year, month);
        return `<option value="${monthKey}">${label}</option>`;
    }).join('');

    // Set most recent month as default
    select.value = monthKeys[0];

    // Load versions for selected month
    loadHistoryForMonth();
}

/**
 * Loads versions list for the selected month
 */
export function loadHistoryForMonth() {
    const select = document.getElementById('historyMonthFilter');
    const versionsList = document.getElementById('historyVersionsList');
    const calendarContainer = document.getElementById('historyCalendarContainer');

    if (!select || !versionsList) return;

    const monthKey = select.value;

    if (!monthKey) {
        versionsList.innerHTML = '<p style="color: white;">No history available.</p>';
        return;
    }

    const { year, month } = parseMonthValue(monthKey);

    // Update state
    currentHistoryMonth = { year, month, monthKey };

    // Hide calendar view
    if (calendarContainer) {
        calendarContainer.style.display = 'none';
    }

    // Get history for this month
    const history = getScheduleHistoryByMonth(monthKey);
    const currentPublished = getPublishedScheduleByMonth(monthKey);

    console.log(`Loading history for ${monthKey}:`, {
        currentPublished: currentPublished,
        historyCount: history ? history.length : 0,
        history: history
    });

    // Build versions list HTML
    let html = '';

    // Current published version (if exists)
    if (currentPublished && currentPublished.events) {
        html += `
            <div class="history-version-item" style="background: rgba(76, 175, 80, 0.2); border: 2px solid #4CAF50; padding: 15px; margin: 10px 0; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="color: white; font-weight: bold; font-size: 1.1em;">${currentPublished.version} (Current)</div>
                    <div style="color: rgba(255,255,255,0.7); font-size: 0.9em; margin-top: 5px;">
                        Published: ${new Date(currentPublished.publishedAt).toLocaleString()}
                    </div>
                    <div style="color: rgba(255,255,255,0.7); font-size: 0.9em;">
                        ${currentPublished.events.length} events
                    </div>
                </div>
                <button onclick="viewHistoryVersion('${monthKey}', 'current')" class="btn btn-primary btn-sm">View</button>
            </div>
        `;
    } else if (currentPublished) {
        // Old format detected - show warning
        html += `
            <div style="background: rgba(255, 152, 0, 0.2); border: 2px solid #FF9800; padding: 15px; margin: 10px 0; border-radius: 5px; color: white;">
                <p style="margin: 0;"><strong>⚠️ Old data format detected</strong></p>
                <p style="margin: 5px 0 0 0; font-size: 0.9em;">Please clear localStorage and republish schedules.</p>
            </div>
        `;
    }

    // Historical versions
    if (history && history.length > 0) {
        history.forEach((version, index) => {
            html += `
                <div class="history-version-item" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); padding: 15px; margin: 10px 0; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="color: white; font-weight: bold;">${version.version}</div>
                        <div style="color: rgba(255,255,255,0.7); font-size: 0.9em; margin-top: 5px;">
                            Published: ${new Date(version.publishedAt).toLocaleString()}
                        </div>
                        <div style="color: rgba(255,255,255,0.7); font-size: 0.9em;">
                            ${version.events.length} events
                        </div>
                    </div>
                    <button onclick="viewHistoryVersion('${monthKey}', ${index})" class="btn btn-secondary btn-sm">View</button>
                </div>
            `;
        });
    }

    if (!currentPublished && (!history || history.length === 0)) {
        html = `<p style="color: white;">No versions available for ${formatMonthYear(year, month)}.</p>`;
    }

    versionsList.innerHTML = html;
}

/**
 * Views a specific version in the calendar
 * @param {string} monthKey - Month key (e.g., "2025-01")
 * @param {number|string} versionIndex - Index in history array or 'current'
 */
export function viewHistoryVersion(monthKey, versionIndex) {
    let versionData;

    if (versionIndex === 'current') {
        versionData = getPublishedScheduleByMonth(monthKey);
    } else {
        const history = getScheduleHistoryByMonth(monthKey);
        versionData = history[versionIndex];
    }

    if (!versionData || !versionData.events) {
        alert('Version data not found');
        return;
    }

    // Parse month to get year and month for navigation
    const { year, month } = parseMonthValue(monthKey);

    // Show calendar container
    const calendarContainer = document.getElementById('historyCalendarContainer');
    const versionTitle = document.getElementById('historyVersionTitle');

    if (calendarContainer) {
        calendarContainer.style.display = 'block';
    }

    if (versionTitle) {
        versionTitle.textContent = versionData.version;
    }

    // Initialize calendar with version events (no change detection for now)
    initHistoryCalendar(versionData.events, []);

    // Navigate calendar to the version's month
    setTimeout(() => {
        const calendar = getCalendar('historyCalendar');
        if (calendar) {
            calendar.gotoDate(new Date(year, month, 1));
        }
    }, 100);

    // Scroll to calendar
    calendarContainer?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Closes the history calendar view
 */
export function closeHistoryCalendar() {
    const calendarContainer = document.getElementById('historyCalendarContainer');
    if (calendarContainer) {
        calendarContainer.style.display = 'none';
    }
}

// ===== LEGACY/MANAGE VERSIONS FUNCTIONS (Kept for now) =====

/**
 * Loads version management page (legacy - not used in month-based system)
 */
export function loadVersionManagement() {
    console.log('loadVersionManagement called - legacy function');
    // This function is no longer needed in month-based system
    // Kept for compatibility
}

/**
 * Legacy functions - kept for backward compatibility
 */
export function viewVersion(versionId) {
    console.log('viewVersion called - legacy function');
}

export function deleteVersionFunc(index) {
    console.log('deleteVersion called - legacy function');
}

export function viewHistoryVersion_OLD(versionId) {
    console.log('viewHistoryVersion_OLD called - legacy function');
}

// ===== GOOGLE SHEETS IMPORT FUNCTIONS =====

/**
 * Shows month selection modal for Google Sheets import
 */
export function showMonthSelectionModal() {
    const modal = document.getElementById('monthSelectionModal');
    const select = document.getElementById('importMonth');

    // Populate month options
    const monthOptions = generateMonthOptions(12); // 12 months before/after
    select.innerHTML = monthOptions.map(opt =>
        `<option value="${opt.value}">${opt.label}</option>`
    ).join('');

    // Set current month as default
    const current = getCurrentMonthYear();
    const currentValue = `${current.year}-${String(current.month + 1).padStart(2, '0')}`;
    select.value = currentValue;

    // Update preview
    updateImportPreview();

    modal.style.display = 'block';
}

/**
 * Updates the import preview text
 */
export function updateImportPreview() {
    const select = document.getElementById('importMonth');
    const preview = document.getElementById('importPreview');
    const selectedValue = select.value;

    if (!selectedValue) {
        preview.innerHTML = '';
        return;
    }

    const { year, month } = parseMonthValue(selectedValue);
    const { firstDate, lastDate } = getMonthBounds(year, month);
    const monthName = formatMonthYear(year, month);

    preview.innerHTML = `
        <strong>Importing: ${monthName}</strong><br>
        <span style="color: rgba(255,255,255,0.7);">Date range: ${firstDate} to ${lastDate}</span>
    `;
}

/**
 * Handles month import from Google Sheets
 * @param {Event} event - Form submit event
 */
export async function handleMonthImport(event) {
    event.preventDefault();

    const select = document.getElementById('importMonth');
    const selectedValue = select.value;

    if (!selectedValue) {
        alert('Please select a month');
        return;
    }

    const { year, month } = parseMonthValue(selectedValue);
    const monthName = formatMonthYear(year, month);

    if (!confirm(`Import ${monthName} from Google Sheets?\n\nThis will update only dates within ${monthName}. All other months will remain unchanged.`)) {
        return;
    }

    try {
        // Close modal
        document.getElementById('monthSelectionModal').style.display = 'none';

        // Fetch from Google Sheets
        const allEvents = await fetchScheduleFromSheets();

        if (!allEvents || allEvents.length === 0) {
            alert('No data found in Google Sheets');
            return;
        }

        // Filter to only include selected month
        const monthEvents = filterEventsByMonth(allEvents, year, month);

        if (monthEvents.length === 0) {
            alert(`No events found for ${monthName} in Google Sheets`);
            return;
        }

        // Get current editing data
        const currentEditing = getEditingScheduleData() || [];

        // Remove events from current editing that are in the target month
        const otherMonthEvents = currentEditing.filter(event => {
            return !monthEvents.some(newEvent => newEvent.start === event.start);
        });

        // Merge: keep other months + new month data
        const mergedEvents = [...otherMonthEvents, ...monthEvents];

        // Sort by date
        mergedEvents.sort((a, b) => a.start.localeCompare(b.start));

        // Update editing schedule
        setEditingScheduleData(mergedEvents);

        // Reinitialize calendar with current month's view
        if (currentEditMonth) {
            loadEditMonth();
        }

        alert(`Successfully imported ${monthEvents.length} events for ${monthName}`);

    } catch (error) {
        console.error('Error importing month:', error);
        alert('Error importing from Google Sheets: ' + error.message);
    }
}

/**
 * Clears all schedule data from localStorage (published and history)
 * Use this to reset if old data format is detected
 */
export function clearAllScheduleData() {
    if (confirm('This will delete ALL published schedules and history. Are you sure?\n\nYou will need to republish schedules after clearing.')) {
        localStorage.removeItem('perfusionPublishedSchedule');
        localStorage.removeItem('perfusionScheduleHistory');
        console.log('All schedule data cleared from localStorage');
        alert('Schedule data cleared successfully!\n\nPlease reload the page and republish your schedules.');
        location.reload();
    }
}
