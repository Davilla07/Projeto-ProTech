/**
 * Core Module Exports
 * Centralized exports for all core utilities
 * 
 * @description This file centralizes all exports from the core directory,
 * providing a single import point for all core functionality.
 * 
 * @author Desenvolvedor Full Stack
 * @version 1.0.0
 * @since 2025-01-09
 */

// Crypto utilities
export { CryptoUtils } from './crypto.utils.js';

// Toast notifications system
export { Toast } from './toast.js';

// Validation system
export { Validation } from './validation.js';

// Session management
export { default as UserSessionManager } from './session.manager.js';

// Health check system
export { default as HealthCheckSystem } from './health-check.js';

// Debug utilities (no exports, only global functions)
import './debug.js';

console.log('📦 Core modules centralized exports loaded');
