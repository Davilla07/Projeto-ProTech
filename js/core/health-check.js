/**
 * Health Check System - Sistema de verificação de saúde da aplicação
 * 
 * @description Monitora o status de todos os módulos e serviços
 * 
 * @author Desenvolvedor Full Stack
 * @version 1.2.0
 * @since 2025-08-03
 */

class HealthCheckSystem {
    constructor() {
        this.checks = new Map();
        this.lastCheck = null;
        this.isHealthy = false;
        
        console.log('🏥 Health Check System inicializado');
    }

    /**
     * Registrar uma verificação de saúde
     * @param {string} name Nome da verificação
     * @param {Function} checkFn Função de verificação
     * @param {number} timeout Timeout em ms
     */
    registerCheck(name, checkFn, timeout = 5000) {
        this.checks.set(name, {
            name,
            checkFn,
            timeout,
            lastResult: null,
            lastRun: null
        });
    }

    /**
     * Executar todas as verificações
     * @returns {Promise<Object>} Resultado das verificações
     */
    async runAllChecks() {
        console.group('🔍 Executando Health Checks');
        
        const results = {
            timestamp: new Date().toISOString(),
            overall: 'unknown',
            checks: {},
            summary: {
                total: this.checks.size,
                passed: 0,
                failed: 0,
                warnings: 0
            }
        };

        for (const [name, check] of this.checks) {
            try {
                console.log(`⏳ Verificando ${name}...`);
                
                const startTime = Date.now();
                const result = await Promise.race([
                    check.checkFn(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout')), check.timeout)
                    )
                ]);
                
                const duration = Date.now() - startTime;
                
                results.checks[name] = {
                    status: result.status || 'passed',
                    message: result.message || 'OK',
                    duration,
                    details: result.details || null
                };

                if (result.status === 'failed') {
                    results.summary.failed++;
                    console.error(`❌ ${name}: ${result.message}`);
                } else if (result.status === 'warning') {
                    results.summary.warnings++;
                    console.warn(`⚠️ ${name}: ${result.message}`);
                } else {
                    results.summary.passed++;
                    console.log(`✅ ${name}: OK (${duration}ms)`);
                }

                check.lastResult = results.checks[name];
                check.lastRun = Date.now();

            } catch (error) {
                results.checks[name] = {
                    status: 'failed',
                    message: error.message,
                    duration: check.timeout,
                    details: { error: error.toString() }
                };
                
                results.summary.failed++;
                console.error(`💥 ${name}: ${error.message}`);
            }
        }

        // Determinar status geral
        if (results.summary.failed > 0) {
            results.overall = 'unhealthy';
        } else if (results.summary.warnings > 0) {
            results.overall = 'degraded';
        } else {
            results.overall = 'healthy';
        }

        this.isHealthy = results.overall === 'healthy';
        this.lastCheck = results;

        console.log(`📊 Resumo: ${results.summary.passed}/${results.summary.total} checks passaram`);
        console.groupEnd();

        return results;
    }

    /**
     * Verificações padrão do sistema
     */
    setupDefaultChecks() {
        // Verificar módulos globais essenciais
        this.registerCheck('Global Modules', async () => {
            const required = ['Toast', 'Router', 'AuthService', 'DarkMode'];
            const missing = required.filter(mod => !window[mod]);
            
            if (missing.length > 0) {
                return {
                    status: 'failed',
                    message: `Módulos ausentes: ${missing.join(', ')}`,
                    details: { missing, available: required.filter(mod => window[mod]) }
                };
            }
            
            return {
                status: 'passed',
                message: 'Todos os módulos globais disponíveis',
                details: { modules: required }
            };
        });

        // Verificar LocalStorage
        this.registerCheck('Local Storage', async () => {
            try {
                const testKey = '_health_check_test';
                localStorage.setItem(testKey, 'test');
                localStorage.removeItem(testKey);
                
                return {
                    status: 'passed',
                    message: 'LocalStorage funcional'
                };
            } catch (error) {
                return {
                    status: 'failed',
                    message: 'LocalStorage não disponível',
                    details: { error: error.message }
                };
            }
        });

        // Verificar Console
        this.registerCheck('Console API', async () => {
            const methods = ['log', 'warn', 'error', 'group', 'groupEnd'];
            const missing = methods.filter(method => typeof console[method] !== 'function');
            
            if (missing.length > 0) {
                return {
                    status: 'warning',
                    message: `Métodos de console ausentes: ${missing.join(', ')}`
                };
            }
            
            return {
                status: 'passed',
                message: 'Console API completa'
            };
        });

        // Verificar DOM
        this.registerCheck('DOM Ready', async () => {
            if (document.readyState === 'loading') {
                return {
                    status: 'warning',
                    message: 'DOM ainda carregando'
                };
            }
            
            return {
                status: 'passed',
                message: `DOM ${document.readyState}`
            };
        });

        // Verificar Router se disponível
        this.registerCheck('Router System', async () => {
            if (!window.Router) {
                return {
                    status: 'failed',
                    message: 'Router não encontrado'
                };
            }
            
            if (typeof window.Router.getCurrentRoute === 'function') {
                const currentRoute = window.Router.getCurrentRoute();
                return {
                    status: 'passed',
                    message: 'Router funcional',
                    details: { currentRoute }
                };
            }
            
            return {
                status: 'warning',
                message: 'Router disponível mas pode não estar inicializado'
            };
        });

        console.log('📋 Verificações padrão configuradas');
    }

    /**
     * Executar verificação rápida (só essenciais)
     */
    async quickCheck() {
        const essentials = ['Global Modules', 'Local Storage', 'DOM Ready'];
        const results = { passed: 0, total: essentials.length, issues: [] };
        
        for (const name of essentials) {
            const check = this.checks.get(name);
            if (check) {
                try {
                    const result = await check.checkFn();
                    if (result.status === 'passed') {
                        results.passed++;
                    } else {
                        results.issues.push(`${name}: ${result.message}`);
                    }
                } catch (error) {
                    results.issues.push(`${name}: ${error.message}`);
                }
            }
        }
        
        return results;
    }

    /**
     * Obter relatório de status atual
     */
    getStatusReport() {
        if (!this.lastCheck) {
            return { status: 'unknown', message: 'Nenhuma verificação executada ainda' };
        }
        
        return {
            status: this.lastCheck.overall,
            timestamp: this.lastCheck.timestamp,
            summary: this.lastCheck.summary,
            isHealthy: this.isHealthy
        };
    }
}

// Instância global
const healthCheck = new HealthCheckSystem();

// Disponibilizar globalmente
window.HealthCheck = healthCheck;
window.healthCheck = healthCheck;

// Configurar verificações padrão
healthCheck.setupDefaultChecks();

// Função de conveniência para verificação rápida
window.checkHealth = async () => {
    console.log('🩺 Executando verificação de saúde...');
    const results = await healthCheck.runAllChecks();
    console.table(results.summary);
    return results;
};

// Função para verificação rápida
window.quickHealth = async () => {
    const results = await healthCheck.quickCheck();
    console.log(`⚡ Check rápido: ${results.passed}/${results.total} OK`);
    if (results.issues.length > 0) {
        console.warn('⚠️ Problemas encontrados:', results.issues);
    }
    return results;
};

console.log('✅ Health Check System carregado e disponível globalmente');
console.log('🏥 Use checkHealth() ou quickHealth() para diagnóstico');

export default healthCheck;
