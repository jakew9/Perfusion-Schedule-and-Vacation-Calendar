// Authentication UI functions

import {
    login,
    logout,
    registerUser,
    verifySupervisorPassword,
    getLoggedInUser,
    isAdmin,
    isSupervisorOrAdmin,
    loginWithGoogle,
    registerWithGoogle
} from './authManager.js';

import { CONFIG } from '../config.js';

/**
 * Shows the login modal
 */
export function showLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.style.display = 'block';
    document.getElementById('loginError').classList.remove('show');
    document.getElementById('loginForm').reset();
}

/**
 * Shows the registration modal
 */
export function showRegistrationModal() {
    const modal = document.getElementById('registrationModal');
    modal.style.display = 'block';
    document.getElementById('registrationError').classList.remove('show');
    document.getElementById('registrationSuccess').classList.remove('show');
    document.getElementById('registrationForm').reset();
}

/**
 * Closes a modal by ID
 * @param {string} modalId - Modal element ID
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
}

/**
 * Handles login form submission
 * @param {Event} event - Form submit event
 */
export function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    const result = login(email, password);

    if (result.success) {
        closeModal('loginModal');
        // Navigate to published schedule page
        window.showPage('publishedSchedulePage');
        // Load the published schedule
        if (window.loadPublishedSchedule) {
            window.loadPublishedSchedule();
        }
    } else {
        errorDiv.textContent = result.message;
        errorDiv.classList.add('show');
    }
}

/**
 * Handles registration form submission
 * @param {Event} event - Form submit event
 */
export function handleRegistration(event) {
    event.preventDefault();

    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    const errorDiv = document.getElementById('registrationError');
    const successDiv = document.getElementById('registrationSuccess');

    // Clear previous messages
    errorDiv.classList.remove('show');
    successDiv.classList.remove('show');

    // Validate passwords match
    if (password !== passwordConfirm) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.classList.add('show');
        return;
    }

    const result = registerUser({ name, email, password });

    if (result.success) {
        successDiv.textContent = result.message;
        successDiv.classList.add('show');
        document.getElementById('registrationForm').reset();

        // Close modal after 2 seconds
        setTimeout(() => {
            closeModal('registrationModal');
        }, 2000);
    } else {
        errorDiv.textContent = result.message;
        errorDiv.classList.add('show');
    }
}

/**
 * Logs out the current user
 */
export function handleLogout() {
    logout();
    window.showPage('loginPage');
}

/**
 * Shows supervisor password modal and stores the intended action
 * @param {string} action - Action to perform after password verification
 */
export function showSupervisorPasswordModal(action) {
    const modal = document.getElementById('supervisorPasswordModal');
    modal.style.display = 'block';
    modal.dataset.action = action; // Store action in modal data
    document.getElementById('supervisorPasswordError').classList.remove('show');
    document.getElementById('supervisorPasswordForm').reset();
}

/**
 * Handles supervisor password form submission
 * @param {Event} event - Form submit event
 */
export function handleSupervisorPassword(event) {
    event.preventDefault();

    const password = document.getElementById('supervisorPassword').value;
    const errorDiv = document.getElementById('supervisorPasswordError');
    const modal = document.getElementById('supervisorPasswordModal');
    const action = modal.dataset.action;

    // Check if user is already supervisor/admin
    if (isSupervisorOrAdmin()) {
        closeModal('supervisorPasswordModal');
        performSupervisorAction(action);
        return;
    }

    // Verify legacy password
    if (verifySupervisorPassword(password)) {
        closeModal('supervisorPasswordModal');
        performSupervisorAction(action);
    } else {
        errorDiv.textContent = 'Incorrect supervisor password';
        errorDiv.classList.add('show');
    }
}

/**
 * Performs the requested supervisor action
 * @param {string} action - Action to perform
 */
function performSupervisorAction(action) {
    switch (action) {
        case 'view':
            window.showPage('supervisorViewPage');
            if (window.loadSupervisorView) {
                window.loadSupervisorView();
            }
            break;
        case 'edit':
            window.showPage('supervisorEditPage');
            if (window.loadSupervisorEdit) {
                window.loadSupervisorEdit();
            }
            break;
        default:
            console.error('Unknown supervisor action:', action);
    }
}

/**
 * Checks access and shows supervisor view
 */
export function accessSupervisorView() {
    if (isSupervisorOrAdmin()) {
        window.showPage('supervisorViewPage');
        if (window.loadSupervisorView) {
            window.loadSupervisorView();
        }
    } else {
        alert('Access Denied: You are not authorized to view this page. Please contact an administrator if you need supervisor access.');
    }
}

/**
 * Checks access and shows supervisor edit
 */
export function accessSupervisorEdit() {
    if (isSupervisorOrAdmin()) {
        window.showPage('supervisorEditPage');
        if (window.loadSupervisorEdit) {
            window.loadSupervisorEdit();
        }
    } else {
        alert('Access Denied: You are not authorized to edit schedules. Please contact an administrator if you need supervisor access.');
    }
}

/**
 * Checks access and shows manage published versions page
 */
export function accessManageVersions() {
    if (isSupervisorOrAdmin()) {
        window.showPage('managePublishedPage');
    } else {
        alert('Access Denied: You are not authorized to manage schedule versions. Please contact an administrator if you need supervisor access.');
    }
}

/**
 * Checks if user is logged in on page load
 */
export function checkAuthOnLoad() {
    const user = getLoggedInUser();
    if (user) {
        // User is logged in, show published schedule
        window.showPage('publishedSchedulePage');
        if (window.loadPublishedSchedule) {
            window.loadPublishedSchedule();
        }
    } else {
        // Not logged in, show login page
        window.showPage('loginPage');
        // Initialize Google Sign-In button
        initGoogleSignIn();
    }
}

// ===== GOOGLE SIGN-IN =====

/**
 * Initializes Google Sign-In button
 */
export function initGoogleSignIn() {
    console.log('Attempting to initialize Google Sign-In...');

    // Wait for Google Identity Services to load
    if (typeof google === 'undefined') {
        console.log('Google Identity Services not loaded yet, retrying...');
        setTimeout(initGoogleSignIn, 100);
        return;
    }

    console.log('Google Identity Services loaded');

    const buttonElement = document.getElementById('googleSignInButton');
    if (!buttonElement) {
        console.error('Google Sign-In button element not found!');
        return;
    }

    try {
        google.accounts.id.initialize({
            client_id: CONFIG.GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback,
            auto_select: false
        });

        console.log('Google Sign-In initialized, rendering button...');

        google.accounts.id.renderButton(
            buttonElement,
            {
                theme: 'filled_blue',
                size: 'large',
                text: 'signin_with',
                shape: 'rectangular',
                width: 300
            }
        );

        console.log('Google Sign-In button rendered successfully');
    } catch (error) {
        console.error('Error initializing Google Sign-In:', error);
    }
}

/**
 * Handles Google Sign-In callback
 * @param {Object} response - Google credential response
 */
function handleGoogleCallback(response) {
    // Decode the JWT token to get user info
    const userInfo = parseJwt(response.credential);

    const googleUser = {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
    };

    // Try to login
    const result = loginWithGoogle(googleUser);

    if (result.success) {
        // Successful login
        window.showPage('publishedSchedulePage');
        if (window.loadPublishedSchedule) {
            window.loadPublishedSchedule();
        }
    } else if (result.needsRegistration) {
        // New user - ask if they want to request access
        if (confirm(`Welcome ${googleUser.name}!\n\nYou're signing in for the first time. Would you like to request access?`)) {
            const regResult = registerWithGoogle(googleUser);
            if (regResult.success) {
                alert('Access request submitted! An administrator will review your request.');
            } else {
                alert('Error: ' + regResult.message);
            }
        }
    } else {
        // Account pending or other error
        alert(result.message);
    }
}

/**
 * Parses JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}
