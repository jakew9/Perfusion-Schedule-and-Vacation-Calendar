// Main application entry point
// This file bootstraps the application and exposes functions to window for onclick handlers

// Import authentication
import { initAuth } from './js/auth/authManager.js';
import {
    showLoginModal,
    showRegistrationModal,
    closeModal,
    handleLogin,
    handleRegistration,
    handleLogout,
    handleSupervisorPassword,
    accessSupervisorView,
    accessSupervisorEdit,
    accessManageVersions,
    checkAuthOnLoad
} from './js/auth/authUI.js';

// Import API
import { initSheetsAPI, fetchScheduleFromSheets } from './js/api/sheetsapi.js';

// Import storage
import { getPublishedSchedule } from './js/storage/localStorageManager.js';

// Import state
import {
    setCurrentScheduleData,
    setEditingScheduleData,
    getCurrentScheduleData
} from './js/state/calendarState.js';

// Import calendar
import {
    initPublishedCalendar,
    initSupervisorViewCalendar,
    initSupervisorEditCalendar
} from './js/calendar/calendarInit.js';

// Import navigation
import { showPage } from './js/components/navigation.js';

// Import modals
import {
    openEditModal,
    closeEditModal,
    saveEdit,
    showEventDetails,
    showUserManagementModal,
    handleApproveUser,
    handleRejectUser,
    handlePromoteToSupervisor,
    handleDemoteToUser,
    handlePromoteToAdmin,
    handleRemoveUser
} from './js/components/modals.js';

// Import version management
import {
    // Publishing
    publishSchedule,
    confirmMonthPublish,
    // Edit page
    initEditMonthSelector,
    loadEditMonth,
    changeEditMonth,
    // Published page
    initPublishedMonthSelector,
    loadPublishedMonth,
    changePublishedMonth,
    // History page
    initHistoryPage,
    loadHistoryForMonth,
    viewHistoryVersion,
    closeHistoryCalendar,
    // Google Sheets import
    showMonthSelectionModal,
    handleMonthImport,
    updateImportPreview,
    // Utility functions
    clearAllScheduleData,
    // Legacy functions
    loadVersionManagement,
    viewVersion,
    deleteVersionFunc
} from './js/components/versionManager.js';

import {
    showAccountTab,
    initAccountMonthSelector,
    loadAccountMonth,
    changeAccountMonth,
    submitShiftRequest,
    updateUnreadBadge,
    updatePendingRequestsBadge,
    showSupervisorMessagingModal,
    sendSupervisorMessage,
    showShiftRequestsModal,
    filterShiftRequests,
    openRequestResponseModal,
    submitRequestResponse,
    showVacationRequestsModal,
    filterVacationRequests,
    openVacationResponseModal,
    submitVacationResponse,
    updatePendingVacationBadge,
    handleVacationDecision,
    submitVacationRequest,
    deleteVacationRequest
} from './js/components/accountPage.js';

// ===== EXPOSE FUNCTIONS TO WINDOW =====
// These functions are called from inline onclick handlers in HTML

// Authentication functions
window.showLoginModal = showLoginModal;
window.showRegistrationModal = showRegistrationModal;
window.closeModal = closeModal;
window.handleLogin = handleLogin;
window.handleRegistration = handleRegistration;
window.logout = handleLogout;
window.handleSupervisorPassword = handleSupervisorPassword;
window.accessSupervisorView = accessSupervisorView;
window.accessSupervisorEdit = accessSupervisorEdit;
window.accessManageVersions = accessManageVersions;

// Navigation functions
window.showPage = showPage;

// Modal functions
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.saveEdit = saveEdit;
window.showEventDetails = showEventDetails;
window.showUserManagementModal = showUserManagementModal;
window.handleApproveUser = handleApproveUser;
window.handleRejectUser = handleRejectUser;
window.handlePromoteToSupervisor = handlePromoteToSupervisor;
window.handleDemoteToUser = handleDemoteToUser;
window.handlePromoteToAdmin = handlePromoteToAdmin;
window.handleRemoveUser = handleRemoveUser;

// Version management functions
window.publishSchedule = publishSchedule;
window.confirmMonthPublish = confirmMonthPublish;
window.loadEditMonth = loadEditMonth;
window.changeEditMonth = changeEditMonth;
window.loadPublishedMonth = loadPublishedMonth;
window.changePublishedMonth = changePublishedMonth;
window.loadHistoryForMonth = loadHistoryForMonth;
window.viewHistoryVersion = viewHistoryVersion;
window.closeHistoryCalendar = closeHistoryCalendar;
window.showMonthSelectionModal = showMonthSelectionModal;
window.handleMonthImport = handleMonthImport;
window.updateImportPreview = updateImportPreview;
// Utility functions
window.clearAllScheduleData = clearAllScheduleData;
// Legacy
window.viewVersion = viewVersion;
window.deleteVersion = deleteVersionFunc;

// Account page functions
window.showAccountTab = showAccountTab;
window.loadAccountMonth = loadAccountMonth;
window.changeAccountMonth = changeAccountMonth;
window.submitShiftRequest = submitShiftRequest;
window.showSupervisorMessagingModal = showSupervisorMessagingModal;
window.sendSupervisorMessage = sendSupervisorMessage;
window.showShiftRequestsModal = showShiftRequestsModal;
window.filterShiftRequests = filterShiftRequests;
window.openRequestResponseModal = openRequestResponseModal;
window.submitRequestResponse = submitRequestResponse;
window.showVacationRequestsModal = showVacationRequestsModal;
window.filterVacationRequests = filterVacationRequests;
window.openVacationResponseModal = openVacationResponseModal;
window.submitVacationResponse = submitVacationResponse;
window.handleVacationDecision = handleVacationDecision;
window.submitVacationRequest = submitVacationRequest;
window.deleteVacationRequest = deleteVacationRequest;

// ===== SCHEDULE LOADING FUNCTIONS =====

/**
 * Loads the published schedule (month-based)
 */
async function loadPublishedSchedule() {
    try {
        console.log('Initializing published schedule with month selector');
        // Initialize month-based selector and load current/most recent month
        initPublishedMonthSelector();
    } catch (error) {
        console.error('Error loading published schedule:', error);
        alert('Error loading schedule. Please check your configuration and try again.');
    }
}

/**
 * Loads the supervisor view
 */
async function loadSupervisorView() {
    try {
        // Load from current published schedule
        let publishedData = getPublishedSchedule();

        if (publishedData && publishedData.events) {
            initSupervisorViewCalendar(publishedData.events);
        } else {
            // Load from Google Sheets
            await initSheetsAPI();
            const events = await fetchScheduleFromSheets();

            if (events && events.length > 0) {
                initSupervisorViewCalendar(events);
            } else {
                alert('No schedule data available');
            }
        }
    } catch (error) {
        console.error('Error loading supervisor view:', error);
        alert('Error loading schedule: ' + error.message);
    }
}

/**
 * Loads the supervisor edit page (month-based)
 */
async function loadSupervisorEdit() {
    try {
        // Initialize Google Sheets API
        await initSheetsAPI();

        // Load from all published schedules as starting point
        const { getAllPublishedSchedules } = await import('./js/storage/localStorageManager.js');
        const allPublished = getAllPublishedSchedules();

        // Collect all events from all published months
        let allEvents = [];
        Object.values(allPublished).forEach(monthData => {
            if (monthData && monthData.events) {
                allEvents = allEvents.concat(monthData.events);
            }
        });

        if (allEvents.length > 0) {
            console.log(`Loading ${allEvents.length} events from published schedules for editing`);
            setEditingScheduleData(allEvents);
        } else {
            console.log('No published schedules - starting with empty dataset');
            setEditingScheduleData([]);
        }

        // Initialize month selector and load current month view
        initEditMonthSelector();

    } catch (error) {
        console.error('Error loading supervisor edit:', error);
        alert('Error loading schedule: ' + error.message);
    }
}

// Expose loading functions to window
window.loadPublishedSchedule = loadPublishedSchedule;
window.loadSupervisorView = loadSupervisorView;
window.loadSupervisorEdit = loadSupervisorEdit;

// ===== APPLICATION INITIALIZATION =====

/**
 * Initialize the application
 */
async function initApp() {
    console.log('Initializing U of U Perfusion Schedule Manager...');

    try {
        // Initialize authentication system
        initAuth();

        // Initialize Google Sheets API
        await initSheetsAPI();

        // Check authentication status and show appropriate page
        checkAuthOnLoad();

        // Load version management when on manage published page
        const managePublishedPage = document.getElementById('managePublishedPage');
        if (managePublishedPage) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.target.classList.contains('active')) {
                        loadVersionManagement();
                    }
                });
            });

            observer.observe(managePublishedPage, {
                attributes: true,
                attributeFilter: ['class']
            });
        }

        // Load schedule history when on schedule history page
        const scheduleHistoryPage = document.getElementById('scheduleHistoryPage');
        if (scheduleHistoryPage) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.target.classList.contains('active')) {
                        initHistoryPage();
                    }
                });
            });

            observer.observe(scheduleHistoryPage, {
                attributes: true,
                attributeFilter: ['class']
            });
        }

        // Load account page when activated
        const yourAccountPage = document.getElementById('yourAccountPage');
        if (yourAccountPage) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.target.classList.contains('active')) {
                        showAccountTab('messages');
                        updateUnreadBadge();
                    }
                });
            });

            observer.observe(yourAccountPage, {
                attributes: true,
                attributeFilter: ['class']
            });
        }

        // Update badges on page load
        updateUnreadBadge();
        updatePendingRequestsBadge();

        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        alert('Error initializing application. Please check the console for details.');
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// ===== MODAL CLOSE ON OUTSIDE CLICK =====
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};
