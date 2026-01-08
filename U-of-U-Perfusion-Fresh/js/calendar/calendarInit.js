// FullCalendar initialization module

import { setCalendar, getCalendar, destroyCalendar } from '../state/calendarState.js';
import { calculateEventColor, hasDoubleShift, hasDuplicateAssignments } from '../utils/colorUtils.js';

/**
 * Checks if a value should be displayed (not blank/empty)
 * @param {string} value - Value to check
 * @returns {boolean} True if value should be displayed
 */
function shouldDisplayValue(value) {
    return value &&
           value !== '_' &&
           value !== 'Blank' &&
           value.trim() !== '';
}

/**
 * Creates event content HTML
 * @param {Object} info - FullCalendar event info
 * @returns {Object} Object with html property
 */
function createEventContent(info) {
    const event = info.event;
    const props = event.extendedProps;

    let html = '<div style="padding: 5px; font-size: 0.85em; color: #2d3748;">';

    if (shouldDisplayValue(props.extraShift)) {
        html += `<div style="color: #2d3748;"><strong>+1:</strong> ${props.extraShift}</div>`;
    }
    if (shouldDisplayValue(props.dayShift)) {
        html += `<div style="color: #2d3748;"><strong>Day:</strong> ${props.dayShift}</div>`;
    }
    if (shouldDisplayValue(props.nightShift)) {
        html += `<div style="color: #2d3748;"><strong>Night:</strong> ${props.nightShift}</div>`;
    }
    if (shouldDisplayValue(props.school)) {
        html += `<div style="color: #2d3748;"><strong>School:</strong> ${props.school}</div>`;
    }
    if (shouldDisplayValue(props.off)) {
        html += `<div style="color: #2d3748;"><strong>Off:</strong> ${props.off}</div>`;
    }

    html += '</div>';

    return { html };
}

/**
 * Converts event data to FullCalendar event format
 * @param {Array} events - Array of event objects
 * @param {Array} changedDates - Optional array of changed date strings for highlighting
 * @returns {Array} Array of FullCalendar events
 */
function convertToCalendarEvents(events, changedDates = []) {
    return events.map(event => {
        // Determine background color
        let backgroundColor = event.backgroundColor || 'auto';
        if (backgroundColor === 'auto') {
            backgroundColor = calculateEventColor(event);
        }

        // Check for double shifts and duplicates
        const isDoubleShift = hasDoubleShift(event);
        const isDuplicate = hasDuplicateAssignments(event);
        const isChanged = changedDates.includes(event.start);

        // Build class names
        let classNames = [];
        if (isChanged) {
            classNames.push('event-changed');
        } else if (isDuplicate) {
            classNames.push('event-duplicate');
        } else if (isDoubleShift) {
            classNames.push('event-double-shift');
        }

        return {
            id: event.id,
            start: event.start,
            allDay: true,
            backgroundColor: backgroundColor,
            borderColor: backgroundColor,
            extendedProps: {
                extraShift: event.extraShift || '_',
                dayShift: event.dayShift || '_',
                nightShift: event.nightShift || '_',
                school: event.school || '_',
                off: event.off || '_'
            },
            classNames: classNames
        };
    });
}

/**
 * Initializes the main published schedule calendar
 * @param {Array} events - Array of event objects
 */
export function initPublishedCalendar(events) {
    // Destroy existing calendar if any
    destroyCalendar('calendar');

    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) {
        console.error('Calendar element not found');
        return;
    }

    const calendarEvents = convertToCalendarEvents(events);

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        firstDay: 1, // Start week on Monday
        headerToolbar: {
            left: '', // Removed - using month selector above calendar
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,dayGridDay'
        },
        events: calendarEvents,
        eventContent: createEventContent,
        eventClick: function(info) {
            // Show event details modal
            if (window.showEventDetails) {
                window.showEventDetails(info.event);
            }
        },
        height: 'auto',
        editable: false
    });

    calendar.render();
    setCalendar('calendar', calendar);
}

/**
 * Initializes the supervisor view calendar (read-only)
 * @param {Array} events - Array of event objects
 */
export function initSupervisorViewCalendar(events) {
    destroyCalendar('supervisorViewCalendar');

    const calendarEl = document.getElementById('supervisorViewCalendar');
    if (!calendarEl) {
        console.error('Supervisor view calendar element not found');
        return;
    }

    const calendarEvents = convertToCalendarEvents(events);

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        firstDay: 1, // Start week on Monday
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,dayGridDay'
        },
        events: calendarEvents,
        eventContent: createEventContent,
        eventClick: function(info) {
            if (window.showEventDetails) {
                window.showEventDetails(info.event);
            }
        },
        height: 'auto',
        editable: false
    });

    calendar.render();
    setCalendar('supervisorViewCalendar', calendar);
}

/**
 * Initializes the supervisor edit calendar (editable)
 * @param {Array} events - Array of event objects
 */
export function initSupervisorEditCalendar(events) {
    destroyCalendar('supervisorEditCalendar');

    const calendarEl = document.getElementById('supervisorEditCalendar');
    if (!calendarEl) {
        console.error('Supervisor edit calendar element not found');
        return;
    }

    const calendarEvents = convertToCalendarEvents(events);

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        firstDay: 1, // Start week on Monday
        headerToolbar: {
            left: '', // Removed - using month selector above calendar
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,dayGridDay'
        },
        events: calendarEvents,
        eventContent: createEventContent,
        dateClick: function(info) {
            // Open edit modal for this date
            if (window.openEditModal) {
                window.openEditModal(info.dateStr);
            }
        },
        eventClick: function(info) {
            // Open edit modal for this date
            if (window.openEditModal) {
                window.openEditModal(info.event.startStr);
            }
        },
        height: 'auto',
        editable: false
    });

    calendar.render();
    setCalendar('supervisorEditCalendar', calendar);
}

/**
 * Initializes the version calendar for viewing previous versions
 * @param {Array} events - Array of event objects
 */
export function initVersionCalendar(events) {
    destroyCalendar('versionCalendar');

    const calendarEl = document.getElementById('versionCalendar');
    if (!calendarEl) {
        console.error('Version calendar element not found');
        return;
    }

    const calendarEvents = convertToCalendarEvents(events);

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        firstDay: 1, // Start week on Monday
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,dayGridDay'
        },
        events: calendarEvents,
        eventContent: createEventContent,
        eventClick: function(info) {
            if (window.showEventDetails) {
                window.showEventDetails(info.event);
            }
        },
        height: 'auto',
        editable: false
    });

    calendar.render();
    setCalendar('versionCalendar', calendar);
}

/**
 * Initializes the history calendar for public viewing with change highlighting
 * @param {Array} events - Array of event objects
 * @param {Array} changedDates - Array of date strings that changed
 */
export function initHistoryCalendar(events, changedDates = []) {
    destroyCalendar('historyCalendar');

    const calendarEl = document.getElementById('historyCalendar');
    if (!calendarEl) {
        console.error('History calendar element not found');
        return;
    }

    const calendarEvents = convertToCalendarEvents(events, changedDates);

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        firstDay: 1, // Start week on Monday
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,dayGridDay'
        },
        events: calendarEvents,
        eventContent: createEventContent,
        eventClick: function(info) {
            if (window.showEventDetails) {
                window.showEventDetails(info.event);
            }
        },
        height: 'auto',
        editable: false
    });

    calendar.render();
    setCalendar('historyCalendar', calendar);
}

/**
 * Refreshes a calendar with new events
 * @param {string} calendarName - Name of calendar to refresh
 * @param {Array} events - New events array
 */
export function refreshCalendarEvents(calendarName, events) {
    const calendar = getCalendar(calendarName);
    if (!calendar) {
        console.error(`Calendar ${calendarName} not found`);
        return;
    }

    const calendarEvents = convertToCalendarEvents(events);

    // Remove all events
    calendar.getEvents().forEach(event => event.remove());

    // Add new events
    calendar.addEventSource(calendarEvents);
    calendar.render();
}

/**
 * Updates a single event on a calendar
 * @param {string} calendarName - Name of calendar
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @param {Object} eventData - Event data object
 */
export function updateCalendarEvent(calendarName, dateStr, eventData) {
    const calendar = getCalendar(calendarName);
    if (!calendar) {
        console.error(`Calendar ${calendarName} not found`);
        return;
    }

    // Find existing event for this date
    const existingEvent = calendar.getEvents().find(e => e.startStr === dateStr);

    // Remove existing event
    if (existingEvent) {
        existingEvent.remove();
    }

    // Add updated event
    const calendarEvents = convertToCalendarEvents([{
        ...eventData,
        start: dateStr
    }]);

    calendar.addEventSource(calendarEvents);
    calendar.render();
}

/**
 * Gets event data from a calendar by date
 * @param {string} calendarName - Name of calendar
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Object|null} Event object or null
 */
export function getCalendarEventByDate(calendarName, dateStr) {
    const calendar = getCalendar(calendarName);
    if (!calendar) {
        return null;
    }

    const event = calendar.getEvents().find(e => e.startStr === dateStr);
    return event || null;
}
