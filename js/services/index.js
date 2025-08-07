/**
 * Services Module Exports
 * Centralized exports for all service classes
 * 
 * @description This file centralizes all exports from the services directory,
 * providing a single import point for all business logic services.
 * 
 * @author Desenvolvedor Full Stack
 * @version 1.0.0
 * @since 2025-01-09
 */

// Authentication service
export { default as AuthService } from './AuthService.js';

// Proposal/Prompt service
export { default as PropostaService } from './propostaService.js';

console.log('🔧 Services centralized exports loaded');
