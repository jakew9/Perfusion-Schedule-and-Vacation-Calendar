// Account page functionality - user schedule view and shift requests

import { getCalendar, setCalendar, destroyCalendar } from '../state/calendarState.js';
import { getPublishedScheduleByMonth } from '../storage/localStorageManager.js';
import { getLoggedInUser } from '../auth/authManager.js';
import {
    generateMonthOptions,
    getCurrentMonthYear,
    parseMonthValue,
    formatMonthYear
} from '../utils/dateUtils.js';
import { initPublishedCalendar } from '../calendar/calendarInit.js';

// State for account page
let currentAccountMonth = null;

/**
 * Shows a specific tab in the account page
 * @param {string} tabName - Tab name (schedule, messages, requests)
 */
export function showAccountTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.account-tab-content').forEach(content => {
        content.style.display = 'none';
    });

    // Remove active class from all tab buttons
    document.querySelectorAll('.account-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab content
    const tabContent = document.getElementById(`accountTab${capitalize(tabName)}Content`);
    if (tabContent) {
        tabContent.style.display = 'block';
    }

    // Add active class to selected tab button
    const tabButton = document.getElementById(`accountTab${capitalize(tabName)}`);
    if (tabButton) {
        tabButton.classList.add('active');
    }

    // Load content based on tab
    if (tabName === 'requests') {
        loadUserRequests();
    } else if (tabName === 'messages') {
        loadUserMessages();
        markAllMessagesAsRead(); // Mark messages as read when viewing
    } else if (tabName === 'vacation') {
        initVacationCalendar();
        loadVacationRequestsList();
    }
}

/**
 * Capitalizes first letter of a string
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Initializes the month selector for account schedule view
 */
export function initAccountMonthSelector() {
    const select = document.getElementById('accountMonthSelector');
    if (!select) return;

    const monthOptions = generateMonthOptions(6);
    const currentDate = getCurrentMonthYear();

    select.innerHTML = monthOptions.map(option => {
        const selected = option.year === currentDate.year && option.month === currentDate.month ? 'selected' : '';
        return `<option value="${option.value}" ${selected}>${option.label}</option>`;
    }).join('');

    // Load current month
    loadAccountMonth();
}

/**
 * Loads the selected month's schedule in account view
 */
export function loadAccountMonth() {
    const select = document.getElementById('accountMonthSelector');
    if (!select || !select.value) return;

    const monthKey = select.value;
    const { year, month } = parseMonthValue(monthKey);

    // Update state
    currentAccountMonth = { year, month, monthKey };

    // Get published schedule for this month
    const publishedData = getPublishedScheduleByMonth(monthKey);

    if (!publishedData || !publishedData.events) {
        const calendarEl = document.getElementById('accountCalendar');
        if (calendarEl) {
            calendarEl.innerHTML = '<div style="text-align: center; padding: 60px 20px; color: white; font-size: 1.2em;">' +
                `<p>No published schedule for ${formatMonthYear(year, month)}</p>` +
                '</div>';
        }
        return;
    }

    // Initialize calendar with this month's events
    initAccountCalendar(publishedData.events);

    // Navigate calendar to the selected month
    setTimeout(() => {
        const calendar = getCalendar('accountCalendar');
        if (calendar) {
            calendar.gotoDate(new Date(year, month, 1));
        }
    }, 100);
}

/**
 * Changes the account month by delta
 * @param {number} delta - Number of months to change (-1 or +1)
 */
export function changeAccountMonth(delta) {
    const select = document.getElementById('accountMonthSelector');
    if (!select) return;

    const currentIndex = select.selectedIndex;
    const newIndex = currentIndex + delta;

    if (newIndex >= 0 && newIndex < select.options.length) {
        select.selectedIndex = newIndex;
        loadAccountMonth();
    }
}

/**
 * Initializes the account calendar
 * @param {Array} events - Array of event objects
 */
function initAccountCalendar(events) {
    destroyCalendar('accountCalendar');

    const calendarEl = document.getElementById('accountCalendar');
    if (!calendarEl) {
        console.error('Account calendar element not found');
        return;
    }

    // Convert events to calendar format
    const calendarEvents = events.map(event => ({
        id: event.id,
        start: event.start,
        allDay: true,
        backgroundColor: event.backgroundColor || '#4A90E2',
        borderColor: event.backgroundColor || '#4A90E2',
        extendedProps: {
            extraShift: event.extraShift || '_',
            dayShift: event.dayShift || '_',
            nightShift: event.nightShift || '_',
            school: event.school || '_',
            off: event.off || '_'
        }
    }));

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        firstDay: 1,
        headerToolbar: {
            left: '',
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
    setCalendar('accountCalendar', calendar);
}

/**
 * Creates event content HTML
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

function shouldDisplayValue(value) {
    return value && value !== '_' && value !== 'Blank' && value.trim() !== '';
}

/**
 * Submits a shift request
 */
export function submitShiftRequest(event) {
    event.preventDefault();

    const user = getLoggedInUser();
    if (!user) {
        alert('You must be logged in to submit requests');
        return;
    }

    const date = document.getElementById('requestDate').value;
    const type = document.getElementById('requestType').value;
    const reason = document.getElementById('requestReason').value;

    const request = {
        id: `req-${Date.now()}`,
        userId: user.email,
        userName: user.name,
        date: date,
        type: type,
        reason: reason,
        status: 'pending',
        submittedAt: new Date().toISOString()
    };

    // Get existing requests from localStorage
    const requests = getShiftRequests();
    requests.push(request);
    saveShiftRequests(requests);

    // Clear form
    document.getElementById('shiftRequestForm').reset();

    // Reload requests list
    loadUserRequests();

    alert('Request submitted successfully!');
}

/**
 * Loads user's shift requests
 */
function loadUserRequests() {
    const user = getLoggedInUser();
    if (!user) return;

    const requestsList = document.getElementById('userRequestsList');
    if (!requestsList) return;

    const allRequests = getShiftRequests();
    const userRequests = allRequests.filter(req => req.userId === user.email);

    if (userRequests.length === 0) {
        requestsList.innerHTML = `
            <p style="color: rgba(255,255,255,0.7); text-align: center; padding: 40px 20px;">
                You haven't submitted any requests yet.
            </p>
        `;
        return;
    }

    // Sort by submission date (newest first)
    userRequests.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    requestsList.innerHTML = userRequests.map(req => {
        const typeLabels = {
            shiftChange: 'Shift Change',
            shiftSwap: 'Shift Swap'
        };

        return `
            <div class="request-item ${req.status}">
                <h4>${typeLabels[req.type]} - ${new Date(req.date).toLocaleDateString()}</h4>
                <p><strong>Reason:</strong> ${req.reason}</p>
                <p><strong>Submitted:</strong> ${new Date(req.submittedAt).toLocaleString()}</p>
                ${req.supervisorResponse ? `<p><strong>Response:</strong> ${req.supervisorResponse}</p>` : ''}
                <span class="request-status ${req.status}">${req.status.toUpperCase()}</span>
            </div>
        `;
    }).join('');
}

/**
 * Loads user's messages from supervisor
 */
function loadUserMessages() {
    const user = getLoggedInUser();
    if (!user) return;

    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;

    const messages = getUserMessages();
    const userMessages = messages.filter(msg => msg.recipientEmail === user.email || msg.recipientEmail === 'all');

    if (userMessages.length === 0) {
        messagesList.innerHTML = `
            <p style="color: rgba(255,255,255,0.7); text-align: center; padding: 40px 20px;">
                No messages yet.
            </p>
        `;
        return;
    }

    // Sort by date (newest first)
    userMessages.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

    messagesList.innerHTML = userMessages.map(msg => {
        const isUnread = !msg.readBy || !msg.readBy.includes(user.email);
        return `
            <div style="background: rgba(255,255,255,${isUnread ? '0.15' : '0.1'}); border-radius: 8px; padding: 15px; margin-bottom: 15px; border-left: 4px solid ${isUnread ? '#FFA500' : 'var(--primary-color)'};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h4 style="color: white; margin: 0 0 8px 0;">${msg.subject || 'Message from Supervisor'}</h4>
                    ${isUnread ? '<span style="background: #FFA500; color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.75em; font-weight: bold;">NEW</span>' : ''}
                </div>
                <p style="color: rgba(255,255,255,0.8); margin: 5px 0; white-space: pre-wrap;">${msg.message}</p>
                <p style="color: rgba(255,255,255,0.6); font-size: 0.85em; margin-top: 10px;">
                    ${new Date(msg.sentAt).toLocaleString()}
                </p>
            </div>
        `;
    }).join('');

    // Update unread badge
    updateUnreadBadge();
}

/**
 * Updates the unread message badge count
 */
function updateUnreadBadge() {
    const user = getLoggedInUser();
    if (!user) return;

    const badge = document.getElementById('unreadMessageBadge');
    if (!badge) return;

    const messages = getUserMessages();
    const userMessages = messages.filter(msg => msg.recipientEmail === user.email || msg.recipientEmail === 'all');
    const unreadCount = userMessages.filter(msg => !msg.readBy || !msg.readBy.includes(user.email)).length;

    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

/**
 * Marks all messages as read for the current user
 */
function markAllMessagesAsRead() {
    const user = getLoggedInUser();
    if (!user) return;

    const messages = getUserMessages();
    let updated = false;

    messages.forEach(msg => {
        if (msg.recipientEmail === user.email || msg.recipientEmail === 'all') {
            if (!msg.readBy) {
                msg.readBy = [];
            }
            if (!msg.readBy.includes(user.email)) {
                msg.readBy.push(user.email);
                updated = true;
            }
        }
    });

    if (updated) {
        saveUserMessages(messages);
        updateUnreadBadge();
    }
}

// ===== LOCALSTORAGE HELPERS =====

function getShiftRequests() {
    try {
        const data = localStorage.getItem('perfusionShiftRequests');
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting shift requests:', error);
        return [];
    }
}

function saveShiftRequests(requests) {
    try {
        localStorage.setItem('perfusionShiftRequests', JSON.stringify(requests));
    } catch (error) {
        console.error('Error saving shift requests:', error);
    }
}

function getUserMessages() {
    try {
        const data = localStorage.getItem('perfusionUserMessages');
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting user messages:', error);
        return [];
    }
}

function saveUserMessages(messages) {
    try {
        localStorage.setItem('perfusionUserMessages', JSON.stringify(messages));
    } catch (error) {
        console.error('Error saving user messages:', error);
    }
}

// Export for supervisor access
export function getAllShiftRequests() {
    return getShiftRequests();
}

export function updateShiftRequestStatus(requestId, status, response) {
    const requests = getShiftRequests();
    const request = requests.find(r => r.id === requestId);

    if (request) {
        request.status = status;
        request.supervisorResponse = response;
        request.respondedAt = new Date().toISOString();
        saveShiftRequests(requests);
        return true;
    }

    return false;
}

// Export badge update for use when logging in
export { updateUnreadBadge };

/**
 * Shows the supervisor messaging modal
 */
export function showSupervisorMessagingModal() {
    const modal = document.getElementById('supervisorMessagingModal');
    if (!modal) return;

    // Populate user list
    populateUserList();

    // Show/hide specific user dropdown based on recipient selection
    const recipientSelect = document.getElementById('messageRecipient');
    const specificUserGroup = document.getElementById('specificUserGroup');

    recipientSelect.addEventListener('change', function() {
        if (this.value === 'select') {
            specificUserGroup.style.display = 'block';
        } else {
            specificUserGroup.style.display = 'none';
        }
    });

    modal.style.display = 'block';
}

/**
 * Populates the user list for supervisor messaging
 */
function populateUserList() {
    const specificUserSelect = document.getElementById('specificUser');
    if (!specificUserSelect) return;

    // Get all users from localStorage
    const users = JSON.parse(localStorage.getItem('perfusionUsersDB') || '[]');

    // Filter to only approved users
    const approvedUsers = users.filter(u => u.approved && u.role !== 'admin');

    specificUserSelect.innerHTML = approvedUsers.map(user =>
        `<option value="${user.email}">${user.name} (${user.email})</option>`
    ).join('');
}

/**
 * Sends a message from supervisor to users
 */
export function sendSupervisorMessage(event) {
    event.preventDefault();

    const recipientType = document.getElementById('messageRecipient').value;
    const specificUser = document.getElementById('specificUser').value;
    const subject = document.getElementById('messageSubject').value;
    const messageBody = document.getElementById('messageBody').value;

    let recipientEmail;
    if (recipientType === 'all') {
        recipientEmail = 'all';
    } else if (recipientType === 'select') {
        recipientEmail = specificUser;
    } else {
        alert('Please select a recipient');
        return;
    }

    const message = {
        id: `msg-${Date.now()}`,
        recipientEmail: recipientEmail,
        subject: subject,
        message: messageBody,
        sentAt: new Date().toISOString(),
        readBy: [] // Track which users have read the message
    };

    const messages = getUserMessages();
    messages.push(message);
    saveUserMessages(messages);

    // Close modal and reset form
    document.getElementById('supervisorMessagingModal').style.display = 'none';
    document.getElementById('supervisorMessagingForm').reset();

    alert('Message sent successfully!');
}

/**
 * Shows the shift requests management modal
 */
export function showShiftRequestsModal() {
    const modal = document.getElementById('shiftRequestsModal');
    if (!modal) return;

    // Load and display requests
    filterShiftRequests('pending');

    modal.style.display = 'block';
}

/**
 * Filters and displays shift requests by status
 */
export function filterShiftRequests(status) {
    // Update active tab
    document.querySelectorAll('#shiftRequestsModal .account-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`filter${capitalize(status)}`).classList.add('active');

    const requestsList = document.getElementById('supervisorRequestsList');
    if (!requestsList) return;

    const allRequests = getShiftRequests();
    let filteredRequests;

    if (status === 'all') {
        filteredRequests = allRequests;
    } else {
        filteredRequests = allRequests.filter(req => req.status === status);
    }

    if (filteredRequests.length === 0) {
        requestsList.innerHTML = `
            <p style="color: rgba(255,255,255,0.7); text-align: center; padding: 40px 20px;">
                No ${status === 'all' ? '' : status} requests found.
            </p>
        `;
        return;
    }

    // Sort by submission date (newest first)
    filteredRequests.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    const typeLabels = {
        shiftChange: 'Shift Change',
        shiftSwap: 'Shift Swap'
    };

    requestsList.innerHTML = filteredRequests.map(req => `
        <div class="request-item ${req.status}" style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <h4>${typeLabels[req.type]} - ${new Date(req.date).toLocaleDateString()}</h4>
                    <p><strong>From:</strong> ${req.userName} (${req.userId})</p>
                    <p><strong>Reason:</strong> ${req.reason}</p>
                    <p><strong>Submitted:</strong> ${new Date(req.submittedAt).toLocaleString()}</p>
                    ${req.supervisorResponse ? `<p><strong>Response:</strong> ${req.supervisorResponse}</p>` : ''}
                    ${req.respondedAt ? `<p><strong>Responded:</strong> ${new Date(req.respondedAt).toLocaleString()}</p>` : ''}
                    <span class="request-status ${req.status}">${req.status.toUpperCase()}</span>
                </div>
                ${req.status === 'pending' ? `
                    <div style="display: flex; gap: 10px; margin-left: 15px;">
                        <button onclick="openRequestResponseModal('${req.id}', 'approved')" class="btn btn-success btn-sm">Approve</button>
                        <button onclick="openRequestResponseModal('${req.id}', 'denied')" class="btn btn-danger btn-sm">Deny</button>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');

    // Update pending badge count
    updatePendingRequestsBadge();
}

/**
 * Opens the response modal for approving/denying a request
 */
export function openRequestResponseModal(requestId, status) {
    const modal = document.getElementById('requestResponseModal');
    const titleElement = document.getElementById('responseModalTitle');

    document.getElementById('responseRequestId').value = requestId;
    document.getElementById('responseStatus').value = status;
    document.getElementById('responseMessage').value = '';

    titleElement.textContent = status === 'approved' ? 'Approve Request' : 'Deny Request';

    modal.style.display = 'block';
}

/**
 * Submits the supervisor's response to a shift request
 */
export function submitRequestResponse(event) {
    event.preventDefault();

    const requestId = document.getElementById('responseRequestId').value;
    const status = document.getElementById('responseStatus').value;
    const response = document.getElementById('responseMessage').value;

    const requests = getShiftRequests();
    const request = requests.find(r => r.id === requestId);

    if (request) {
        request.status = status;
        request.supervisorResponse = response || (status === 'approved' ? 'Request approved.' : 'Request denied.');
        request.respondedAt = new Date().toISOString();
        saveShiftRequests(requests);

        // Close modals
        document.getElementById('requestResponseModal').style.display = 'none';

        // Refresh the list
        filterShiftRequests('pending');

        alert(`Request ${status} successfully!`);
    }
}

/**
 * Updates the pending requests badge count
 */
export function updatePendingRequestsBadge() {
    const badge = document.getElementById('pendingRequestsBadge');
    if (!badge) return;

    const allRequests = getShiftRequests();
    const pendingCount = allRequests.filter(req => req.status === 'pending').length;

    if (pendingCount > 0) {
        badge.textContent = pendingCount;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

// ===== VACATION CALENDAR FUNCTIONS =====

/**
 * Initializes the vacation calendar
 */
function initVacationCalendar() {
    const calendarEl = document.getElementById('vacationCalendar');
    if (!calendarEl) return;

    // Destroy existing calendar if any
    const existingCalendar = getCalendar('vacationCalendar');
    if (existingCalendar) {
        existingCalendar.destroy();
    }

    const vacationRequests = getVacationRequests();

    // Convert vacation requests to calendar events
    const events = vacationRequests.map(req => {
        return {
            id: req.id,
            title: req.userName,
            start: req.date,
            allDay: true,
            backgroundColor: '#3B82F6',
            borderColor: '#3B82F6',
            extendedProps: {
                userId: req.userId,
                userName: req.userName,
                requestedAt: req.requestedAt,
                reason: req.reason
            }
        };
    });

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        firstDay: 1,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth'
        },
        events: events,
        dateClick: function(info) {
            // Allow user to request vacation for clicked date
            requestVacationForDate(info.dateStr);
        },
        eventClick: function(info) {
            // Show event details
            const props = info.event.extendedProps;
            let details = `${props.userName}\nDate: ${info.event.startStr}\nRequested: ${new Date(props.requestedAt).toLocaleString()}`;
            if (props.reason) {
                details += `\nReason: ${props.reason}`;
            }
            alert(details);
        },
        height: 'auto'
    });

    calendar.render();
    setCalendar('vacationCalendar', calendar);
}

/**
 * Requests vacation for a specific date - opens modal
 */
function requestVacationForDate(dateStr) {
    const user = getLoggedInUser();
    if (!user) {
        alert('You must be logged in to request vacation');
        return;
    }

    // Check if user already has a request for this date
    const existingRequests = getVacationRequests();
    const existingRequest = existingRequests.find(req =>
        req.userId === user.email && req.date === dateStr
    );

    if (existingRequest) {
        alert('You already have a vacation request for this date.');
        return;
    }

    // Open modal for vacation request
    const modal = document.getElementById('vacationRequestModal');
    const dateElement = document.getElementById('vacationRequestDate');
    const dateValueInput = document.getElementById('vacationRequestDateValue');
    const reasonTextarea = document.getElementById('vacationRequestReason');

    dateElement.textContent = `Request time off for ${new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
    dateValueInput.value = dateStr;
    reasonTextarea.value = '';

    modal.style.display = 'block';
}

/**
 * Submits vacation request with optional reason
 */
export function submitVacationRequest(event) {
    event.preventDefault();

    const dateStr = document.getElementById('vacationRequestDateValue').value;
    const reason = document.getElementById('vacationRequestReason').value.trim();
    const user = getLoggedInUser();

    if (!user) {
        alert('You must be logged in to request vacation');
        return;
    }

    const existingRequests = getVacationRequests();

    const request = {
        id: `vac-${Date.now()}`,
        userId: user.email,
        userName: user.name,
        date: dateStr,
        reason: reason || null,
        requestedAt: new Date().toISOString()
    };

    existingRequests.push(request);
    saveVacationRequests(existingRequests);

    // Close modal
    document.getElementById('vacationRequestModal').style.display = 'none';

    // Refresh calendar and list
    initVacationCalendar();
    loadVacationRequestsList();

    alert('Vacation request submitted!');
}

/**
 * Loads the vacation requests list
 */
function loadVacationRequestsList() {
    const listEl = document.getElementById('vacationRequestsList');
    if (!listEl) return;

    const allRequests = getVacationRequests();

    if (allRequests.length === 0) {
        listEl.innerHTML = `
            <p style="color: rgba(255,255,255,0.7); text-align: center; padding: 40px 20px;">
                No vacation requests yet.
            </p>
        `;
        return;
    }

    // Sort by requested date (newest first)
    allRequests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

    const user = getLoggedInUser();

    listEl.innerHTML = allRequests.map(req => `
        <div class="request-item" style="margin-bottom: 15px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <h4>${req.userName} - ${new Date(req.date).toLocaleDateString()}</h4>
                    <p><strong>User:</strong> ${req.userId}</p>
                    <p><strong>Requested:</strong> ${new Date(req.requestedAt).toLocaleString()}</p>
                    ${req.reason ? `<p><strong>Reason:</strong> ${req.reason}</p>` : ''}
                </div>
                ${user && user.email === req.userId ? `
                    <button onclick="deleteVacationRequest('${req.id}')" class="btn btn-danger btn-sm">Remove</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// ===== SUPERVISOR VACATION MANAGEMENT =====

/**
 * Shows the vacation requests management modal
 */
export function showVacationRequestsModal() {
    const modal = document.getElementById('vacationRequestsModal');
    if (!modal) return;

    initSupervisorVacationCalendar();
    modal.style.display = 'block';
}

/**
 * Initializes supervisor vacation calendar showing all requests
 */
function initSupervisorVacationCalendar() {
    const calendarEl = document.getElementById('supervisorVacationCalendar');
    if (!calendarEl) return;

    const existingCalendar = getCalendar('supervisorVacationCalendar');
    if (existingCalendar) {
        existingCalendar.destroy();
    }

    const vacationRequests = getVacationRequests();

    // Group requests by date to show count
    const requestsByDate = {};
    vacationRequests.forEach(req => {
        if (!requestsByDate[req.date]) {
            requestsByDate[req.date] = [];
        }
        requestsByDate[req.date].push(req);
    });

    // Create events for calendar
    const events = Object.entries(requestsByDate).map(([date, requests]) => {
        const names = requests.map(r => r.userName).join(', ');
        const title = requests.length > 1
            ? `${requests.length} requests: ${names}`
            : names;

        return {
            id: date,
            title: title,
            start: date,
            allDay: true,
            backgroundColor: '#3B82F6',
            borderColor: '#3B82F6',
            extendedProps: {
                requests: requests
            }
        };
    });

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        firstDay: 1,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth'
        },
        events: events,
        eventClick: function(info) {
            openVacationResponseModal(info.event.id);
        },
        height: 'auto'
    });

    calendar.render();
    setCalendar('supervisorVacationCalendar', calendar);
}

/**
 * Filters vacation requests by status (kept for compatibility, but not used in calendar view)
 */
export function filterVacationRequests(status) {
    // This function is kept for backward compatibility but is no longer used
    // The calendar view replaces the filter functionality
    console.log('filterVacationRequests called with status:', status);
}

/**
 * Opens vacation response modal showing all requests for a specific date
 * @param {string} dateStr - The date string (YYYY-MM-DD)
 */
export function openVacationResponseModal(dateStr) {
    const modal = document.getElementById('vacationResponseModal');
    const dateElement = document.getElementById('vacationResponseDate');
    const requestsContainer = document.getElementById('vacationRequestsForDay');

    const allRequests = getVacationRequests();
    const requestsForDate = allRequests.filter(req => req.date === dateStr);

    if (requestsForDate.length === 0) {
        return;
    }

    dateElement.textContent = `Requests for ${new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

    // Sort by request time (newest first)
    requestsForDate.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

    requestsContainer.innerHTML = requestsForDate.map(req => `
        <div class="request-item" style="margin-bottom: 20px; padding: 20px; border: 2px solid #3B82F6; border-radius: 8px; background: white;">
            <h4 style="margin: 0 0 10px 0; color: #2d3748;">${req.userName}</h4>
            <p style="margin: 5px 0; color: #4a5568;"><strong>Email:</strong> ${req.userId}</p>
            <p style="margin: 5px 0; color: #4a5568;"><strong>Requested:</strong> ${new Date(req.requestedAt).toLocaleString()}</p>
            ${req.reason ? `<p style="margin: 5px 0; color: #4a5568;"><strong>Reason:</strong> ${req.reason}</p>` : ''}
        </div>
    `).join('');

    modal.style.display = 'block';
}

/**
 * Deletes a vacation request (user can only delete their own)
 * @param {string} requestId - The request ID
 */
export function deleteVacationRequest(requestId) {
    const user = getLoggedInUser();
    if (!user) {
        alert('You must be logged in to delete vacation requests');
        return;
    }

    const requests = getVacationRequests();
    const request = requests.find(r => r.id === requestId);

    if (!request) {
        alert('Request not found');
        return;
    }

    // Verify user owns this request
    if (request.userId !== user.email) {
        alert('You can only delete your own vacation requests');
        return;
    }

    if (confirm(`Are you sure you want to remove your vacation request for ${new Date(request.date).toLocaleDateString()}?`)) {
        const updatedRequests = requests.filter(r => r.id !== requestId);
        saveVacationRequests(updatedRequests);

        // Refresh calendar and list
        initVacationCalendar();
        loadVacationRequestsList();

        alert('Vacation request removed successfully!');
    }
}

/**
 * Handles vacation approval or denial (kept for backward compatibility, no longer used)
 */
export function handleVacationDecision(requestId, status) {
    console.log('handleVacationDecision called but no longer used');
}

/**
 * Submits vacation response (kept for compatibility)
 */
export function submitVacationResponse(event) {
    // This function is kept for backward compatibility but is no longer used
    if (event) event.preventDefault();
    console.log('submitVacationResponse called');
}

/**
 * Updates pending vacation requests badge (no longer used, kept for compatibility)
 */
export function updatePendingVacationBadge() {
    const badge = document.getElementById('pendingVacationBadge');
    if (badge) {
        badge.style.display = 'none';
    }
}

// ===== VACATION STORAGE HELPERS =====

function getVacationRequests() {
    try {
        const data = localStorage.getItem('perfusionVacationRequests');
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting vacation requests:', error);
        return [];
    }
}

function saveVacationRequests(requests) {
    try {
        localStorage.setItem('perfusionVacationRequests', JSON.stringify(requests));
    } catch (error) {
        console.error('Error saving vacation requests:', error);
    }
}

