// Authentication management module

import {
    getCurrentUser,
    saveCurrentUser,
    clearCurrentUser,
    getAllUsers,
    addUser,
    updateUser,
    deleteUser,
    getPendingRegistrations,
    addPendingRegistration,
    removePendingRegistration,
    initializeStorage
} from '../storage/localStorageManager.js';

import { CONFIG } from '../config.js';

/**
 * Initialize authentication system
 */
export function initAuth() {
    initializeStorage(CONFIG.DEFAULT_ADMIN);
}

/**
 * Attempts to log in a user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object} Result object with success and message/user
 */
export function login(email, password) {
    const users = getAllUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        return { success: false, message: 'User not found' };
    }

    if (!user.approved) {
        return { success: false, message: 'Account pending approval' };
    }

    // In production, use proper password hashing (bcrypt, etc.)
    if (user.password !== password) {
        return { success: false, message: 'Incorrect password' };
    }

    // Save session
    const sessionUser = {
        email: user.email,
        name: user.name,
        role: user.role
    };
    saveCurrentUser(sessionUser);

    return { success: true, user: sessionUser };
}

/**
 * Handles Google Sign-In
 * @param {Object} googleUser - Google user credential response
 * @returns {Object} Result object with success and message/user
 */
export function loginWithGoogle(googleUser) {
    const { email, name, picture } = googleUser;
    const users = getAllUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        // New Google user - needs to request access
        return {
            success: false,
            message: 'Account not found. Please request access first.',
            needsRegistration: true,
            googleUser: googleUser
        };
    }

    if (!user.approved) {
        return { success: false, message: 'Account pending approval' };
    }

    // Save session with Google profile info
    const sessionUser = {
        email: user.email,
        name: user.name,
        role: user.role,
        picture: picture || user.picture, // Google profile picture
        authMethod: 'google'
    };
    saveCurrentUser(sessionUser);

    return { success: true, user: sessionUser };
}

/**
 * Registers a new user via Google Sign-In
 * @param {Object} googleUser - Google user data
 * @returns {Object} Result object
 */
export function registerWithGoogle(googleUser) {
    const { email, name, picture } = googleUser;
    const users = getAllUsers();
    const pending = getPendingRegistrations();

    // Check if email already exists
    if (users.some(u => u.email === email)) {
        return { success: false, message: 'Email already registered' };
    }

    // Check if already pending
    if (pending.some(r => r.email === email)) {
        return { success: false, message: 'Registration already pending approval' };
    }

    // Add to pending registrations
    const registration = {
        email: email,
        name: name,
        picture: picture,
        role: 'user',
        authMethod: 'google'
    };

    const added = addPendingRegistration(registration);

    if (added) {
        return { success: true, message: 'Access request submitted for approval' };
    } else {
        return { success: false, message: 'Registration failed' };
    }
}

/**
 * Logs out the current user
 */
export function logout() {
    clearCurrentUser();
}

/**
 * Checks if a user is currently logged in
 * @returns {boolean} True if logged in
 */
export function isLoggedIn() {
    return getCurrentUser() !== null;
}

/**
 * Gets the current logged-in user
 * @returns {Object|null} User object or null
 */
export function getLoggedInUser() {
    return getCurrentUser();
}

/**
 * Checks if current user has supervisor or admin role
 * @returns {boolean} True if user is supervisor or admin
 */
export function isSupervisorOrAdmin() {
    const user = getCurrentUser();
    return user && (user.role === 'supervisor' || user.role === 'admin');
}

/**
 * Checks if current user has admin role
 * @returns {boolean} True if user is admin
 */
export function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

/**
 * Verifies legacy supervisor password
 * @param {string} password - Password to verify
 * @returns {boolean} True if password matches
 */
export function verifySupervisorPassword(password) {
    return password === CONFIG.SUPERVISOR_PASSWORD;
}

/**
 * Registers a new user (pending approval)
 * @param {Object} userData - User registration data
 * @returns {Object} Result object with success and message
 */
export function registerUser(userData) {
    const users = getAllUsers();
    const pending = getPendingRegistrations();

    // Check if email already exists
    if (users.some(u => u.email === userData.email)) {
        return { success: false, message: 'Email already registered' };
    }

    // Check if already pending
    if (pending.some(r => r.email === userData.email)) {
        return { success: false, message: 'Registration already pending approval' };
    }

    // Add to pending registrations
    const registration = {
        email: userData.email,
        password: userData.password, // In production, hash this
        name: userData.name,
        role: 'user' // Default role
    };

    const added = addPendingRegistration(registration);

    if (added) {
        return { success: true, message: 'Registration submitted for approval' };
    } else {
        return { success: false, message: 'Registration failed' };
    }
}

/**
 * Approves a pending registration (admin only)
 * @param {string} email - Email of registration to approve
 * @returns {Object} Result object
 */
export function approveRegistration(email) {
    if (!isAdmin()) {
        return { success: false, message: 'Admin access required' };
    }

    const pending = getPendingRegistrations();
    const registration = pending.find(r => r.email === email);

    if (!registration) {
        return { success: false, message: 'Registration not found' };
    }

    // Add to users
    const user = {
        ...registration,
        approved: true,
        createdAt: new Date().toISOString()
    };

    delete user.requestedAt;

    addUser(user);
    removePendingRegistration(email);

    return { success: true, message: 'User approved' };
}

/**
 * Rejects a pending registration (admin only)
 * @param {string} email - Email of registration to reject
 * @returns {Object} Result object
 */
export function rejectRegistration(email) {
    if (!isAdmin()) {
        return { success: false, message: 'Admin access required' };
    }

    removePendingRegistration(email);
    return { success: true, message: 'Registration rejected' };
}

/**
 * Promotes a user to supervisor (admin only)
 * @param {string} email - User email
 * @returns {Object} Result object
 */
export function promoteToSupervisor(email) {
    if (!isAdmin()) {
        return { success: false, message: 'Admin access required' };
    }

    const updated = updateUser(email, { role: 'supervisor' });
    if (updated) {
        return { success: true, message: 'User promoted to supervisor' };
    } else {
        return { success: false, message: 'Failed to update user' };
    }
}

/**
 * Demotes a supervisor to regular user (admin only)
 * @param {string} email - User email
 * @returns {Object} Result object
 */
export function demoteToUser(email) {
    if (!isAdmin()) {
        return { success: false, message: 'Admin access required' };
    }

    const updated = updateUser(email, { role: 'user' });
    if (updated) {
        return { success: true, message: 'User demoted to regular user' };
    } else {
        return { success: false, message: 'Failed to update user' };
    }
}

/**
 * Promotes a user to admin (admin only)
 * @param {string} email - User email
 * @returns {Object} Result object
 */
export function promoteToAdmin(email) {
    if (!isAdmin()) {
        return { success: false, message: 'Admin access required' };
    }

    const updated = updateUser(email, { role: 'admin' });
    if (updated) {
        return { success: true, message: 'User promoted to admin' };
    } else {
        return { success: false, message: 'Failed to update user' };
    }
}

/**
 * Removes a user (admin only)
 * @param {string} email - User email
 * @returns {Object} Result object
 */
export function removeUser(email) {
    if (!isAdmin()) {
        return { success: false, message: 'Admin access required' };
    }

    // Prevent removing yourself
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.email === email) {
        return { success: false, message: 'Cannot remove yourself' };
    }

    const deleted = deleteUser(email);
    if (deleted) {
        return { success: true, message: 'User removed' };
    } else {
        return { success: false, message: 'Failed to remove user' };
    }
}

/**
 * Gets all users (admin only)
 * @returns {Array} Array of users or empty array
 */
export function getUsers() {
    if (!isAdmin()) {
        return [];
    }
    return getAllUsers();
}

/**
 * Gets pending registrations (admin only)
 * @returns {Array} Array of pending registrations or empty array
 */
export function getPendingUsers() {
    if (!isAdmin()) {
        return [];
    }
    return getPendingRegistrations();
}
