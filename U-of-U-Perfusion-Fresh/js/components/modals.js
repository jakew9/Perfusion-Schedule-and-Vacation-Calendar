// Modal components for edit and user management

import { getEditingEventByDate, updateEditingEvent } from '../state/calendarState.js';
import { updateCalendarEvent } from '../calendar/calendarInit.js';
import { formatShiftValue } from '../utils/colorUtils.js';
import {
    getUsers,
    getPendingUsers,
    approveRegistration,
    rejectRegistration,
    promoteToSupervisor,
    demoteToUser,
    promoteToAdmin,
    removeUser,
    isAdmin
} from '../auth/authManager.js';

let currentEditingDate = null;

/**
 * Opens the edit modal for a specific date
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 */
export function openEditModal(dateStr) {
    currentEditingDate = dateStr;

    // Get existing event data
    const event = getEditingEventByDate(dateStr);

    // Populate form
    document.getElementById('editDate').textContent = dateStr;
    document.getElementById('editExtraShift').value = event?.extraShift !== '_' ? event?.extraShift || '' : '';
    document.getElementById('editDayShift').value = event?.dayShift !== '_' ? event?.dayShift || '' : '';
    document.getElementById('editNightShift').value = event?.nightShift !== '_' ? event?.nightShift || '' : '';
    document.getElementById('editSchool').value = event?.school !== '_' ? event?.school || '' : '';
    document.getElementById('editOff').value = event?.off !== '_' ? event?.off || '' : '';
    document.getElementById('editColor').value = event?.backgroundColor || 'auto';

    // Show modal
    document.getElementById('editModal').style.display = 'block';
}

/**
 * Closes the edit modal
 */
export function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    currentEditingDate = null;
}

/**
 * Saves the edit from the modal
 * @param {Event} event - Form submit event
 */
export function saveEdit(event) {
    event.preventDefault();

    if (!currentEditingDate) {
        console.error('No date selected for editing');
        return;
    }

    // Get form values
    const extraShift = formatShiftValue(document.getElementById('editExtraShift').value);
    const dayShift = formatShiftValue(document.getElementById('editDayShift').value);
    const nightShift = formatShiftValue(document.getElementById('editNightShift').value);
    const school = formatShiftValue(document.getElementById('editSchool').value);
    const off = formatShiftValue(document.getElementById('editOff').value);
    const backgroundColor = document.getElementById('editColor').value;

    // Update editing data
    const updates = {
        extraShift,
        dayShift,
        nightShift,
        school,
        off,
        backgroundColor
    };

    updateEditingEvent(currentEditingDate, updates);

    // Update calendar display
    updateCalendarEvent('supervisorEditCalendar', currentEditingDate, {
        id: `event-${currentEditingDate}`,
        extraShift,
        dayShift,
        nightShift,
        school,
        off,
        backgroundColor
    });

    // Close modal
    closeEditModal();
}

/**
 * Shows event details modal
 * @param {Object} event - FullCalendar event object
 */
export function showEventDetails(event) {
    const props = event.extendedProps;
    const dateStr = event.startStr;

    document.getElementById('eventDetailsDate').textContent = dateStr;

    let html = '<div style="line-height: 2em;">';

    if (props.extraShift && props.extraShift !== '_') {
        html += `<div><strong>Extra Shift (+1):</strong> ${props.extraShift}</div>`;
    }
    if (props.dayShift && props.dayShift !== '_') {
        html += `<div><strong>Day Shift:</strong> ${props.dayShift}</div>`;
    }
    if (props.nightShift && props.nightShift !== '_') {
        html += `<div><strong>Night Shift:</strong> ${props.nightShift}</div>`;
    }
    if (props.school && props.school !== '_') {
        html += `<div><strong>School:</strong> ${props.school}</div>`;
    }
    if (props.off && props.off !== '_') {
        html += `<div><strong>Off:</strong> ${props.off}</div>`;
    }

    if (!props.extraShift && !props.dayShift && !props.nightShift && !props.school && !props.off) {
        html += '<div>No schedule data for this date.</div>';
    }

    html += '</div>';

    document.getElementById('eventDetailsContent').innerHTML = html;
    document.getElementById('eventDetailsModal').style.display = 'block';
}

/**
 * Shows the user management modal
 */
export function showUserManagementModal() {
    // Check if user is admin
    if (!isAdmin()) {
        alert('Access Denied: Only administrators can manage users.');
        return;
    }

    const users = getUsers();
    const pending = getPendingUsers();

    let html = '';

    // Pending registrations section
    if (pending.length > 0) {
        html += '<div class="user-section">';
        html += '<h4>Pending Registrations</h4>';
        html += '<div class="user-list">';

        pending.forEach(reg => {
            html += `
                <div class="user-item">
                    <div class="user-info">
                        <strong>${reg.name}</strong>
                        <span>${reg.email}</span>
                    </div>
                    <div class="user-actions">
                        <button onclick="handleApproveUser('${reg.email}')" class="btn btn-success btn-sm">Approve</button>
                        <button onclick="handleRejectUser('${reg.email}')" class="btn btn-danger btn-sm">Reject</button>
                    </div>
                </div>
            `;
        });

        html += '</div></div>';
    }

    // Active users section
    if (users.length > 0) {
        html += '<div class="user-section">';
        html += '<h4>Active Users</h4>';
        html += '<div class="user-list">';

        users.forEach(user => {
            const roleClass = user.role;
            const roleBadge = `<span class="role-badge ${roleClass}">${user.role.toUpperCase()}</span>`;

            html += `
                <div class="user-item">
                    <div class="user-info">
                        <strong>${user.name}${roleBadge}</strong>
                        <span>${user.email}</span>
                    </div>
                    <div class="user-actions">
            `;

            // Role management buttons
            if (user.role === 'user') {
                html += `<button onclick="handlePromoteToSupervisor('${user.email}')" class="btn btn-warning btn-sm">Make Supervisor</button>`;
                html += `<button onclick="handlePromoteToAdmin('${user.email}')" class="btn btn-danger btn-sm">Make Admin</button>`;
            } else if (user.role === 'supervisor') {
                html += `<button onclick="handleDemoteToUser('${user.email}')" class="btn btn-secondary btn-sm">Demote to User</button>`;
                html += `<button onclick="handlePromoteToAdmin('${user.email}')" class="btn btn-danger btn-sm">Make Admin</button>`;
            } else if (user.role === 'admin') {
                html += `<button onclick="handleDemoteToUser('${user.email}')" class="btn btn-secondary btn-sm">Demote to User</button>`;
            }

            html += `<button onclick="handleRemoveUser('${user.email}')" class="btn btn-danger btn-sm">Remove</button>`;

            html += `
                    </div>
                </div>
            `;
        });

        html += '</div></div>';
    }

    if (users.length === 0 && pending.length === 0) {
        html = '<p class="text-center">No users or pending registrations.</p>';
    }

    document.getElementById('userManagementContent').innerHTML = html;
    document.getElementById('userManagementModal').style.display = 'block';
}

/**
 * Handles approving a user registration
 * @param {string} email - User email
 */
export function handleApproveUser(email) {
    const result = approveRegistration(email);
    if (result.success) {
        alert(result.message);
        showUserManagementModal(); // Refresh
    } else {
        alert('Error: ' + result.message);
    }
}

/**
 * Handles rejecting a user registration
 * @param {string} email - User email
 */
export function handleRejectUser(email) {
    if (confirm(`Are you sure you want to reject the registration for ${email}?`)) {
        const result = rejectRegistration(email);
        if (result.success) {
            alert(result.message);
            showUserManagementModal(); // Refresh
        } else {
            alert('Error: ' + result.message);
        }
    }
}

/**
 * Handles promoting a user to supervisor
 * @param {string} email - User email
 */
export function handlePromoteToSupervisor(email) {
    const result = promoteToSupervisor(email);
    if (result.success) {
        alert(result.message);
        showUserManagementModal(); // Refresh
    } else {
        alert('Error: ' + result.message);
    }
}

/**
 * Handles demoting a user to regular user
 * @param {string} email - User email
 */
export function handleDemoteToUser(email) {
    if (confirm(`Are you sure you want to demote ${email} to regular user?`)) {
        const result = demoteToUser(email);
        if (result.success) {
            alert(result.message);
            showUserManagementModal(); // Refresh
        } else {
            alert('Error: ' + result.message);
        }
    }
}

/**
 * Handles promoting a user to admin
 * @param {string} email - User email
 */
export function handlePromoteToAdmin(email) {
    if (confirm(`Are you sure you want to promote ${email} to admin? This gives them full access.`)) {
        const result = promoteToAdmin(email);
        if (result.success) {
            alert(result.message);
            showUserManagementModal(); // Refresh
        } else {
            alert('Error: ' + result.message);
        }
    }
}

/**
 * Handles removing a user
 * @param {string} email - User email
 */
export function handleRemoveUser(email) {
    if (confirm(`Are you sure you want to remove ${email}? This action cannot be undone.`)) {
        const result = removeUser(email);
        if (result.success) {
            alert(result.message);
            showUserManagementModal(); // Refresh
        } else {
            alert('Error: ' + result.message);
        }
    }
}
