/**
 * App Initialization - Sistema de inicialização centralizado
 * 
 * @description Gerencia a inicialização de todos os módulos de forma segura
 * e garante que as dependências sejam carregadas na ordem correta
 * 
 * @author Desenvolvedor Full Stack
 * @version 1.0.0
 * @since 2025-08-03
 */

class AppInitializer {
    constructor() {
        this.loadedModules = new Map();
        this.initStartTime = Date.now();
        this.isProduction = window.location.protocol !== 'file:';
        
        console.group('🚀 App Initializer');
        console.log('Environment:', this.isProduction ? 'Production' : 'Development');
        console.log('Start time:', new Date().toISOString());
        console.log('Base URL:', window.location.href);
        console.log('Protocol:', window.location.protocol);
    }

    /**
     * Inicialização principal da aplicação
     */
    async init() {
        try {
            // Aguardar DOM estar pronto
            await this.waitForDOM();
            
            // Mostrar loading
            this.showLoadingScreen();
            
            // Carregar módulos essenciais primeiro
            await this.loadCoreModules();
            
            // Carregar serviços
            await this.loadServices();
            
            // Carregar controllers e UI
            await this.loadUIModules();
            
            // Inicializar aplicação principal
            await this.initializeMainApp();
            
            // Ocultar loading
            this.hideLoadingScreen();
            
            // Log final
            const totalTime = Date.now() - this.initStartTime;
            console.log(`✅ Aplicação inicializada em ${totalTime}ms`);
            console.groupEnd();
            
            // Disparar evento de inicialização completa
            this.dispatchInitEvent();
            
        } catch (error) {
            console.error('💥 Erro crítico na inicialização:', error);
            console.groupEnd();
            this.showErrorScreen(error);
            throw error;
        }
    }

    /**
     * Aguardar DOM estar pronto
     */
    async waitForDOM() {
        if (document.readyState === 'loading') {
            return new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
    }

    /**
     * Carregar módulos essenciais
     */
    async loadCoreModules() {
        console.log('📦 Carregando módulos essenciais...');
        
        const coreModules = [
            { name: 'toast', path: './core/toast.js' },
            { name: 'validation', path: './core/validation.js' },
            { name: 'crypto', path: './core/crypto.utils.js' },
            { name: 'debug', path: './core/debug.js' },
            { name: 'healthCheck', path: './core/health-check.js' },
            { name: 'sessionManager', path: './core/session.manager.js' }
        ];

        for (const module of coreModules) {
            try {
                console.log(`🔄 Tentando carregar: ${module.name} de ${module.path}`);
                const imported = await import(module.path);
                this.loadedModules.set(module.name, imported);
                console.log(`✅ ${module.name} carregado`);
            } catch (error) {
                console.error(`❌ Erro ao carregar ${module.name}:`, error);
                console.error(`❌ Caminho tentado: ${module.path}`);
                throw new Error(`Módulo essencial ${module.name} não pôde ser carregado`);
            }
        }
    }

    /**
     * Carregar serviços
     */
    async loadServices() {
        console.log('🔧 Carregando serviços...');
        
        const services = [
            { name: 'authService', path: './services/AuthService.js' },
            { name: 'propostaService', path: './services/propostaService.js' }
        ];

        for (const service of services) {
            try {
                const imported = await import(service.path);
                this.loadedModules.set(service.name, imported);
                console.log(`✅ ${service.name} carregado`);
            } catch (error) {
                console.warn(`⚠️ Erro ao carregar ${service.name}:`, error);
                // Serviços não são críticos, continuar sem eles
            }
        }
    }

    /**
     * Carregar módulos de UI
     */
    async loadUIModules() {
        console.log('🎨 Carregando módulos de interface...');
        
        const uiModules = [
            { name: 'darkMode', path: './ui/darkmode.js' },
            { name: 'router', path: './router.js' },
            { name: 'loginController', path: './controllers/loginController.js' }
        ];

        for (const module of uiModules) {
            try {
                const imported = await import(module.path);
                this.loadedModules.set(module.name, imported);
                console.log(`✅ ${module.name} carregado`);
            } catch (error) {
                console.warn(`⚠️ Erro ao carregar ${module.name}:`, error);
                // Módulos de UI não são críticos
            }
        }
    }

    /**
     * Inicializar aplicação principal
     */
    async initializeMainApp() {
        console.log('🏗️ Inicializando aplicação principal...');
        
        try {
            // Carregar e inicializar main app
            const mainModule = await import('./main.js');
            this.loadedModules.set('main', mainModule);
            
            // Verificar se PromptProApp foi criada globalmente
            if (window.app && typeof window.app.init === 'function') {
                console.log('✅ Aplicação principal inicializada');
            } else {
                console.warn('⚠️ Aplicação principal não encontrada');
            }
            
        } catch (error) {
            console.error('❌ Erro ao inicializar aplicação principal:', error);
            // Tentar fallback
            this.initFallbackApp();
        }
    }

    /**
     * Inicializar aplicação de fallback
     */
    initFallbackApp() {
        console.log('🔄 Inicializando modo de fallback...');
        
        // Criar aplicação básica
        window.app = {
            initialized: true,
            modules: this.loadedModules,
            toast: this.loadedModules.get('toast')?.Toast,
            
            showToast(message, type = 'info') {
                if (this.toast) {
                    this.toast[type](message);
                } else {
                    console.log(`[${type.toUpperCase()}] ${message}`);
                }
            },
            
            navigate(path) {
                window.location.href = path;
            }
        };
        
        // Configurar navegação básica
        this.setupBasicNavigation();
    }

    /**
     * Configurar navegação básica
     */
    setupBasicNavigation() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-action]');
            if (link) {
                e.preventDefault();
                
                const action = link.getAttribute('data-action');
                
                switch (action) {
                    case 'login':
                        window.location.href = 'login.html';
                        break;
                    case 'register':
                        window.location.href = 'register.html';
                        break;
                    case 'dashboard':
                        window.location.href = 'ferramenta.html';
                        break;
                    case 'demo':
                        window.location.href = 'ferramenta.html';
                        break;
                    case 'toggle-theme':
                        this.toggleTheme();
                        break;
                }
            }
        });
    }

    /**
     * Toggle tema simples
     */
    toggleTheme() {
        const html = document.documentElement;
        if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            html.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
    }

    /**
     * Mostrar tela de loading
     */
    showLoadingScreen() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    /**
     * Ocultar tela de loading
     */
    hideLoadingScreen() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            setTimeout(() => {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 300);
            }, 500);
        }
    }

    /**
     * Mostrar tela de erro
     */
    showErrorScreen(error) {
        this.hideLoadingScreen();
        
        document.body.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div class="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 text-center">
                    <div class="mb-4">
                        <svg class="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Erro de Inicialização
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Houve um problema ao carregar a aplicação. Verifique sua conexão e tente novamente.
                    </p>
                    <div class="space-y-2">
                        <button onclick="window.location.reload()" 
                                class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                            Recarregar Página
                        </button>
                        <button onclick="window.location.href='login.html'" 
                                class="w-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                            Ir para Login
                        </button>
                    </div>
                    ${this.isProduction ? '' : `
                        <details class="mt-4 text-left">
                            <summary class="cursor-pointer text-sm text-gray-500">Detalhes do erro</summary>
                            <pre class="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">${error.message}</pre>
                        </details>
                    `}
                </div>
            </div>
        `;
    }

    /**
     * Disparar evento de inicialização
     */
    dispatchInitEvent() {
        const event = new CustomEvent('app:initialized', {
            detail: {
                modules: Array.from(this.loadedModules.keys()),
                initTime: Date.now() - this.initStartTime,
                timestamp: new Date().toISOString()
            }
        });
        
        window.dispatchEvent(event);
    }

    /**
     * Obter status dos módulos carregados
     */
    getModulesStatus() {
        return {
            loaded: Array.from(this.loadedModules.keys()),
            total: this.loadedModules.size,
            initTime: Date.now() - this.initStartTime
        };
    }
}

// Exportar apenas a classe, sem instanciar ou auto-inicializar
// A inicialização agora é responsabilidade do AppBootstrapper
export default AppInitializer;
