// Navigation management

/**
 * Shows a specific page and hides others
 * @param {string} pageId - ID of page to show
 */
export function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });

    // Show requested page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        updateNavButtons(pageId);
    } else {
        console.error(`Page ${pageId} not found`);
    }
}

/**
 * Updates navigation button active states
 * @param {string} activePageId - ID of currently active page
 */
function updateNavButtons(activePageId) {
    // Map page IDs to navigation buttons
    const pageNavMap = {
        'publishedSchedulePage': 0,
        'scheduleHistoryPage': 1,
        'preferencesPage': 2,
        'supervisorPage': 3
    };

    // Get all navigation buttons
    const navBtns = document.querySelectorAll('.nav-btn');

    // Remove active class from all
    navBtns.forEach(btn => {
        btn.classList.remove('active');
    });

    // Add active class to current page's button
    const navIndex = pageNavMap[activePageId];
    if (navIndex !== undefined && navBtns[navIndex]) {
        navBtns[navIndex].classList.add('active');
    }
}

/**
 * Navigates back to login page (used in logout)
 */
export function goToLogin() {
    showPage('loginPage');
}

/**
 * Navigates to published schedule page
 */
export function goToPublishedSchedule() {
    showPage('publishedSchedulePage');
}

/**
 * Navigates to supervisor page
 */
export function goToSupervisor() {
    showPage('supervisorPage');
}
