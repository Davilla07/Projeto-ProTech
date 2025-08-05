/**
 * Main Application Controller
 * Inicializa todos os sistemas e gerencia o estado global da aplicação
 */

class PromptProApp {
    constructor() {
        this.isInitialized = false;
        this.services = {};
        this.components = {};
        this.state = {
            user: null,
            theme: 'auto',
            currentPage: null,
            loading: false
        };
        
        this.init();
    }

    /**
     * Inicializar aplicação
     */
    async init() {
        try {
            console.log('🚀 Initializing PromptPro...');
            
            // Aguardar DOM estar pronto
            if (document.readyState === 'loading') {
                await new Promise(resolve => 
                    document.addEventListener('DOMContentLoaded', resolve)
                );
            }

            // Inicializar serviços em ordem
            await this.initializeServices();
            
            // Configurar aplicação
            await this.setupApplication();
            
            // Configurar interface
            this.setupUI();
            
            // Marcar como inicializada
            this.isInitialized = true;
            
            console.log('✅ PromptPro initialized successfully');
            
            // Disparar evento de inicialização
            this.dispatchEvent('app:initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize PromptPro:', error);
            this.handleInitError(error);
        }
    }

    /**
     * Inicializar serviços
     */
    async initializeServices() {
        console.log('📦 Loading services...');
        
        // Verificar se serviços estão disponíveis
        const requiredServices = {
            AuthService: 'Sistema de autenticação',
            PropostaService: 'Sistema de propostas', 
            Toast: 'Sistema de notificações',
            Router: 'Sistema de roteamento',
            DarkMode: 'Sistema de modo escuro'
        };

        for (const [serviceName, description] of Object.entries(requiredServices)) {
            if (window[serviceName]) {
                this.services[serviceName] = window[serviceName];
                console.log(`✅ ${description} carregado`);
            } else {
                console.warn(`⚠️ ${description} não encontrado`);
            }
        }

        // Configurar listeners de serviços
        this.setupServiceListeners();
    }

    /**
     * Configurar listeners dos serviços
     */
    setupServiceListeners() {
        // Listener de mudança de autenticação
        window.addEventListener('authStateChanged', (e) => {
            this.state.user = e.detail.user;
            this.updateUIForAuthState(e.detail.isAuthenticated);
            console.log('🔐 Auth state changed:', e.detail.isAuthenticated);
        });

        // Listener de mudança de tema
        window.addEventListener('themeChanged', (e) => {
            console.log('🎨 Theme changed:', e.detail.theme);
        });

        // Listener de mudança de rota
        window.addEventListener('route:loaded', (e) => {
            this.state.currentPage = e.detail.path;
            console.log('🛣️ Route loaded:', e.detail.path);
        });
    }

    /**
     * Configurar aplicação
     */
    async setupApplication() {
        console.log('⚙️ Setting up application...');
        
        // Configurar meta tags
        this.setupMetaTags();
        
        // Configurar atalhos globais
        this.setupKeyboardShortcuts();
        
        // Configurar tratamento de erros globais
        this.setupErrorHandling();
        
        // Configurar manipuladores de formulário
        this.setupFormHandlers();
        
        // Configurar router se disponível
        if (this.services.Router) {
            this.services.Router.registerDefaultRoutes();
        }
        
        // Verificar estado inicial de autenticação
        if (this.services.AuthService) {
            const isAuth = this.services.AuthService.isAuthenticated();
            const user = this.services.AuthService.getCurrentUser();
            this.state.user = user;
            this.updateUIForAuthState(isAuth);
        }
    }

    /**
     * Configurar meta tags
     */
    setupMetaTags() {
        // Viewport para mobile
        if (!document.querySelector('meta[name="viewport"]')) {
            const viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0';
            document.head.appendChild(viewport);
        }

        // Charset
        if (!document.querySelector('meta[charset]')) {
            const charset = document.createElement('meta');
            charset.setAttribute('charset', 'UTF-8');
            document.head.insertBefore(charset, document.head.firstChild);
        }

        // Meta tags para PWA
        const metaTags = [
            { name: 'application-name', content: 'PromptPro' },
            { name: 'apple-mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
            { name: 'apple-mobile-web-app-title', content: 'PromptPro' },
            { name: 'description', content: 'Ferramenta profissional para criação de prompts de IA' },
            { name: 'format-detection', content: 'telephone=no' },
            { name: 'mobile-web-app-capable', content: 'yes' },
            { name: 'msapplication-TileColor', content: '#2563eb' },
            { name: 'msapplication-tap-highlight', content: 'no' }
        ];

        metaTags.forEach(({ name, content }) => {
            if (!document.querySelector(`meta[name="${name}"]`)) {
                const meta = document.createElement('meta');
                meta.name = name;
                meta.content = content;
                document.head.appendChild(meta);
            }
        });
    }

    /**
     * Configurar atalhos de teclado globais
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + / para debug
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                this.showDebugInfo();
                return;
            }

            // Alt + D para dashboard (se logado)
            if (e.altKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                if (this.state.user && this.services.Router) {
                    this.services.Router.goToDashboard();
                } else {
                    this.services.Toast?.warning('Faça login para acessar o dashboard');
                }
                return;
            }

            // Alt + L para login
            if (e.altKey && e.key.toLowerCase() === 'l') {
                e.preventDefault();
                if (this.services.Router) {
                    this.services.Router.goToLogin();
                }
                return;
            }

            // Alt + R para registro
            if (e.altKey && e.key.toLowerCase() === 'r') {
                e.preventDefault();
                if (this.services.Router) {
                    this.services.Router.goToRegister();
                }
                return;
            }

            // Alt + H para home
            if (e.altKey && e.key.toLowerCase() === 'h') {
                e.preventDefault();
                if (this.services.Router) {
                    this.services.Router.goToHome();
                }
                return;
            }

            // Alt + T para toggle tema
            if (e.altKey && e.key.toLowerCase() === 't') {
                e.preventDefault();
                if (this.services.DarkMode) {
                    this.services.DarkMode.toggleSimple();
                }
                return;
            }

            // Escape para fechar modais/toasts
            if (e.key === 'Escape') {
                this.handleEscape();
                return;
            }
        });
    }

    /**
     * Configurar tratamento de erros globais
     */
    setupErrorHandling() {
        // Erros JavaScript
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.handleGlobalError(e.error, 'JavaScript Error');
        });

        // Promises rejeitadas
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            this.handleGlobalError(e.reason, 'Promise Rejection');
        });
    }

    /**
     * Configurar interface do usuário
     */
    setupUI() {
        console.log('🎨 Setting up UI...');
        
        // Configurar tema escuro automaticamente
        if (this.services.DarkMode) {
            this.services.DarkMode.enableTransitions();
        }
        
        // Adicionar classes globais ao body
        document.body.classList.add('font-sans', 'antialiased');
        
        // Detectar página atual e configurar UI específica
        this.detectCurrentPageAndSetup();
        
        // Configurar toast container
        if (this.services.Toast) {
            // Toast system já cria seu próprio container
        }
    }

    /**
     * Detectar página atual e configurar
     */
    detectCurrentPageAndSetup() {
        const path = window.location.pathname;
        const page = this.getPageFromPath(path);
        
        this.state.currentPage = page;
        
        console.log('📄 Current page:', page);
        
        // Configurações específicas por página
        switch (page) {
            case 'index':
                this.setupHomePage();
                break;
            case 'login':
                this.setupLoginPage();
                break;
            case 'register':
                this.setupRegisterPage();
                break;
            case 'ferramenta':
                this.setupToolPage();
                break;
            case 'admin':
                this.setupAdminPage();
                break;
            default:
                this.setupDefaultPage();
        }
    }

    /**
     * Obter nome da página do path
     */
    getPageFromPath(path) {
        const filename = path.split('/').pop() || 'index.html';
        return filename.replace('.html', '') || 'index';
    }

    /**
     * Configurar página inicial
     */
    setupHomePage() {
        console.log('🏠 Setting up home page');
        this.setupNavigationButtons();
    }

    /**
     * Configurar página de login
     */
    setupLoginPage() {
        console.log('🔐 Setting up login page');
        
        // Redirecionar se já logado
        if (this.state.user) {
            this.services.Router?.goToDashboard();
            return;
        }
        
        this.setupLoginForm();
    }

    /**
     * Configurar página de registro
     */
    setupRegisterPage() {
        console.log('📝 Setting up register page');
        
        // Redirecionar se já logado
        if (this.state.user) {
            this.services.Router?.goToDashboard();
            return;
        }
        
        this.setupRegisterForm();
    }

    /**
     * Configurar página da ferramenta
     */
    setupToolPage() {
        console.log('🛠️ Setting up tool page');
        
        // Verificar autenticação
        if (!this.state.user) {
            this.services.Toast?.warning('Você precisa fazer login para acessar a ferramenta');
            this.services.Router?.goToLogin();
            return;
        }
        
        this.setupToolInterface();
    }

    /**
     * Configurar página admin
     */
    setupAdminPage() {
        console.log('👑 Setting up admin page');
        
        // Verificar permissões
        if (!this.state.user || this.state.user.role !== 'admin') {
            this.services.Toast?.error('Acesso negado');
            this.services.Router?.goToHome();
            return;
        }
        
        this.setupAdminInterface();
    }

    /**
     * Configurar página padrão
     */
    setupDefaultPage() {
        console.log('📄 Setting up default page');
        this.setupNavigationButtons();
    }

    /**
     * Configurar botões de navegação
     */
    setupNavigationButtons() {
        // Botões de login/logout
        const loginBtns = document.querySelectorAll('[data-action="login"]');
        loginBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.services.Router?.goToLogin();
            });
        });

        // Botões de registro
        const registerBtns = document.querySelectorAll('[data-action="register"]');
        registerBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.services.Router?.goToRegister();
            });
        });

        // Botões de dashboard
        const dashboardBtns = document.querySelectorAll('[data-action="dashboard"]');
        dashboardBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.state.user) {
                    this.services.Router?.goToDashboard();
                } else {
                    this.services.Toast?.warning('Faça login para acessar o dashboard');
                    this.services.Router?.goToLogin();
                }
            });
        });

        // Botões de logout
        const logoutBtns = document.querySelectorAll('[data-action="logout"]');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });

        // Botões de toggle tema
        const themeBtns = document.querySelectorAll('[data-action="toggle-theme"]');
        themeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.services.DarkMode?.toggleSimple();
            });
        });
    }

    /**
     * Configurar formulário de login
     */
    setupLoginForm() {
        const form = document.getElementById('loginForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin(new FormData(form));
        });
    }

    /**
     * Configurar formulário de registro
     */
    setupRegisterForm() {
        const form = document.getElementById('registerForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegister(new FormData(form));
        });
    }

    /**
     * Configurar interface da ferramenta
     */
    setupToolInterface() {
        // Configurar formulário de geração de proposta
        const form = document.getElementById('propostaForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleGenerateProposta(new FormData(form));
            });
        }
        
        // Atualizar info do usuário
        this.updateUserInfo();
    }

    /**
     * Configurar interface admin
     */
    setupAdminInterface() {
        // Configurações específicas do admin
        this.updateUserInfo();
    }

    /**
     * Manipular login
     */
    async handleLogin(formData) {
        if (!this.services.AuthService) return;

        const credentials = {
            email: formData.get('email'),
            password: formData.get('password'),
            rememberMe: formData.get('rememberMe') === 'on'
        };

        try {
            this.setLoading(true);
            const result = await this.services.AuthService.login(credentials);
            
            if (result.success) {
                this.services.Toast?.success(result.message);
                this.services.Router?.goToDashboard();
            } else {
                this.services.Toast?.error(result.message);
            }
        } catch (error) {
            this.services.Toast?.error('Erro ao fazer login');
            console.error('Login error:', error);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Manipular registro
     */
    async handleRegister(formData) {
        if (!this.services.AuthService) return;

        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            rememberMe: formData.get('rememberMe') === 'on'
        };

        try {
            this.setLoading(true);
            const result = await this.services.AuthService.register(userData);
            
            if (result.success) {
                this.services.Toast?.success(result.message);
                this.services.Router?.goToDashboard();
            } else {
                this.services.Toast?.error(result.message);
            }
        } catch (error) {
            this.services.Toast?.error('Erro ao criar conta');
            console.error('Register error:', error);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Manipular geração de proposta
     */
    async handleGenerateProposta(formData) {
        if (!this.services.PropostaService) return;

        const params = {
            tipo: formData.get('tipo'),
            tema: formData.get('tema'),
            objetivo: formData.get('objetivo'),
            publicoAlvo: formData.get('publicoAlvo'),
            tom: formData.get('tom'),
            detalhes: formData.get('detalhes')
        };

        try {
            this.setLoading(true);
            const result = await this.services.PropostaService.generateProposta(params);
            
            if (result.success) {
                this.services.Toast?.success(result.message);
                this.displayProposta(result.proposta);
            } else {
                this.services.Toast?.error(result.message);
            }
        } catch (error) {
            this.services.Toast?.error('Erro ao gerar proposta');
            console.error('Generate proposta error:', error);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Exibir proposta gerada
     */
    displayProposta(proposta) {
        const container = document.getElementById('propostaResult');
        if (!container) return;

        container.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                        ${proposta.tema}
                    </h3>
                    <button onclick="app.exportProposta('${proposta.id}')" 
                            class="text-sm text-blue-600 hover:text-blue-500">
                        Exportar
                    </button>
                </div>
                
                <div class="prose dark:prose-invert max-w-none">
                    <pre class="whitespace-pre-wrap text-sm">${proposta.prompt}</pre>
                </div>
                
                <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div class="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>Template: ${proposta.template}</span>
                        <span>Complexidade: ${proposta.metadata.complexity}</span>
                        <span>Tempo estimado: ${proposta.metadata.estimatedTime}min</span>
                    </div>
                </div>
            </div>
        `;

        container.style.display = 'block';
        container.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Exportar proposta
     */
    exportProposta(propostaId) {
        if (!this.services.PropostaService) return;
        
        const proposta = this.services.PropostaService.getPropostaById(propostaId);
        if (proposta) {
            this.services.PropostaService.exportProposta(proposta);
            this.services.Toast?.success('Proposta exportada com sucesso!');
        }
    }

    /**
     * Fazer logout
     */
    async logout() {
        if (!this.services.AuthService) return;

        try {
            const result = this.services.AuthService.logout();
            if (result.success) {
                this.services.Toast?.success(result.message);
                this.services.Router?.goToHome();
            }
        } catch (error) {
            this.services.Toast?.error('Erro ao fazer logout');
            console.error('Logout error:', error);
        }
    }

    /**
     * Atualizar UI baseado no estado de autenticação
     */
    updateUIForAuthState(isAuthenticated) {
        // Mostrar/ocultar elementos baseado na autenticação
        const authElements = document.querySelectorAll('[data-auth="true"]');
        const guestElements = document.querySelectorAll('[data-auth="false"]');

        authElements.forEach(el => {
            el.style.display = isAuthenticated ? '' : 'none';
        });

        guestElements.forEach(el => {
            el.style.display = isAuthenticated ? 'none' : '';
        });

        // Atualizar informações do usuário
        if (isAuthenticated) {
            this.updateUserInfo();
        }
    }

    /**
     * Atualizar informações do usuário na UI
     */
    updateUserInfo() {
        if (!this.state.user) return;

        const userNameElements = document.querySelectorAll('[data-user="name"]');
        const userEmailElements = document.querySelectorAll('[data-user="email"]');

        userNameElements.forEach(el => {
            el.textContent = this.state.user.name;
        });

        userEmailElements.forEach(el => {
            el.textContent = this.state.user.email;
        });
    }

    /**
     * Definir estado de loading
     */
    setLoading(loading) {
        this.state.loading = loading;
        
        // Atualizar UI de loading
        const loadingElements = document.querySelectorAll('[data-loading]');
        loadingElements.forEach(el => {
            if (loading) {
                el.setAttribute('disabled', 'true');
                const originalText = el.textContent;
                el.setAttribute('data-original-text', originalText);
                el.textContent = 'Carregando...';
            } else {
                el.removeAttribute('disabled');
                const originalText = el.getAttribute('data-original-text');
                if (originalText) {
                    el.textContent = originalText;
                    el.removeAttribute('data-original-text');
                }
            }
        });
    }

    /**
     * Manipular tecla Escape
     */
    handleEscape() {
        // Fechar toasts
        if (this.services.Toast && this.services.Toast.count() > 0) {
            this.services.Toast.clear();
            return;
        }

        // Fechar modais (se existirem)
        const modals = document.querySelectorAll('.modal.open, [data-modal].open');
        if (modals.length > 0) {
            modals.forEach(modal => modal.classList.remove('open'));
            return;
        }
    }

    /**
     * Mostrar informações de debug
     */
    showDebugInfo() {
        const info = {
            version: '1.0.0',
            initialized: this.isInitialized,
            services: Object.keys(this.services),
            state: this.state,
            currentPage: this.state.currentPage,
            userAgent: navigator.userAgent,
            localStorage: this.getStorageInfo()
        };

        console.group('🔍 PromptPro Debug Info');
        console.log('App State:', info);
        console.log('Services:', this.services);
        console.groupEnd();

        if (this.services.Toast) {
            this.services.Toast.info('Informações de debug no console', {
                duration: 3000
            });
        }
    }

    /**
     * Obter informações de storage
     */
    getStorageInfo() {
        try {
            const info = {
                localStorage: {
                    used: JSON.stringify(localStorage).length,
                    keys: Object.keys(localStorage).length
                },
                sessionStorage: {
                    used: JSON.stringify(sessionStorage).length,
                    keys: Object.keys(sessionStorage).length
                }
            };
            return info;
        } catch {
            return { error: 'Unable to access storage' };
        }
    }

    /**
     * Manipular erro global
     */
    handleGlobalError(error, type) {
        console.error(`Global ${type}:`, error);
        
        // Não mostrar toast para erros muito frequentes
        if (this.shouldShowErrorToast(error)) {
            this.services.Toast?.error('Ocorreu um erro inesperado');
        }
    }

    /**
     * Verificar se deve mostrar toast de erro
     */
    shouldShowErrorToast(error) {
        const ignoredErrors = [
            'ResizeObserver loop limit exceeded',
            'Non-Error promise rejection captured',
            'Script error.'
        ];

        const errorMsg = error.message || error.toString();
        return !ignoredErrors.some(ignored => errorMsg.includes(ignored));
    }

    /**
     * Manipular erro de inicialização
     */
    handleInitError(error) {
        document.body.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gray-50">
                <div class="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
                    <div class="flex items-center mb-4">
                        <div class="flex-shrink-0">
                            <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-lg font-medium text-gray-900">Erro de Inicialização</h3>
                        </div>
                    </div>
                    <p class="text-sm text-gray-500 mb-4">
                        Ocorreu um erro ao inicializar a aplicação. Por favor, recarregue a página.
                    </p>
                    <button onclick="window.location.reload()" 
                            class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        Recarregar Página
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Disparar evento customizado
     */
    dispatchEvent(type, detail = {}) {
        const event = new CustomEvent(type, { detail });
        window.dispatchEvent(event);
    }

    /**
     * Obter estado da aplicação
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Verificar se aplicação foi inicializada
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * Configurar manipuladores de formulário
     */
    setupFormHandlers() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLoginSubmit(e));
        }
        
        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegisterSubmit(e));
        }
        
        // Prompt generation form
        const promptForm = document.getElementById('promptForm');
        if (promptForm) {
            promptForm.addEventListener('submit', (e) => this.handlePromptSubmit(e));
        }
    }
    
    /**
     * Manipular submissão do formulário de login
     */
    async handleLoginSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('[data-loading]');
        const emailInput = form.querySelector('#email');
        const passwordInput = form.querySelector('#password');
        const rememberMe = form.querySelector('#rememberMe');
        
        if (!emailInput || !passwordInput) return;
        
        this.setLoadingState(submitBtn, true);
        
        try {
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const remember = rememberMe?.checked || false;
            
            const result = await this.services.AuthService.login({
                email: email,
                password: password,
                rememberMe: remember
            });
            
            if (result.success) {
                this.services.Toast?.success(result.message);
                this.services.Router?.navigate('ferramenta');
            } else {
                this.services.Toast?.error(result.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.services.Toast?.error('Erro ao fazer login. Tente novamente.');
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }
    
    /**
     * Manipular submissão do formulário de registro
     */
    async handleRegisterSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('[data-loading]');
        const fullNameInput = form.querySelector('#fullName');
        const emailInput = form.querySelector('#email');
        const passwordInput = form.querySelector('#password');
        const confirmPasswordInput = form.querySelector('#confirmPassword');
        const agreeTermsInput = form.querySelector('#agreeTerms');
        const newsletterInput = form.querySelector('#newsletter');
        
        if (!fullNameInput || !emailInput || !passwordInput || !confirmPasswordInput) return;
        
        // Validar formulário
        if (!this.validateRegisterForm(form)) return;
        
        this.setLoadingState(submitBtn, true);
        
        try {
            const userData = {
                name: fullNameInput.value.trim(),
                email: emailInput.value.trim(),
                password: passwordInput.value,
                agreeTerms: agreeTermsInput?.checked || false,
                newsletter: newsletterInput?.checked || false
            };
            
            const result = await this.services.AuthService.register(userData);
            
            if (result.success) {
                this.services.Toast?.success(result.message);
                this.services.Router?.navigate('ferramenta');
            } else {
                this.services.Toast?.error(result.message);
            }
        } catch (error) {
            console.error('Register error:', error);
            this.services.Toast?.error('Erro ao criar conta. Tente novamente.');
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }
    
    /**
     * Manipular submissão do formulário de prompt
     */
    async handlePromptSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('[data-loading]');
        const objetivoInput = form.querySelector('#objetivo');
        const contextoInput = form.querySelector('#contexto');
        const tipoInput = form.querySelector('#tipo');
        const tomInput = form.querySelector('#tom');
        const tamanhoInput = form.querySelector('#tamanho');
        const idiomaInput = form.querySelector('#idioma');
        const keywordsInput = form.querySelector('#keywords');
        
        if (!objetivoInput?.value.trim()) {
            this.services.Toast?.error('Por favor, defina o objetivo do prompt');
            objetivoInput?.focus();
            return;
        }
        
        this.setLoadingState(submitBtn, true);
        
        try {
            const promptData = {
                objetivo: objetivoInput.value.trim(),
                contexto: contextoInput?.value.trim() || '',
                tipo: tipoInput?.value || '',
                tom: tomInput?.value || '',
                tamanho: tamanhoInput?.value || '',
                idioma: idiomaInput?.value || 'portugues',
                keywords: keywordsInput?.value.trim() || ''
            };
            
            const generatedPrompt = await this.propostaService.generateProposta(promptData);
            
            if (generatedPrompt && generatedPrompt.prompt) {
                this.displayGeneratedPrompt(generatedPrompt);
                this.saveToHistory(promptData, generatedPrompt);
                this.services.Toast?.success('Prompt gerado com sucesso!');
            } else {
                this.services.Toast?.error('Erro ao gerar prompt. Tente novamente.');
            }
        } catch (error) {
            console.error('Prompt generation error:', error);
            this.services.Toast?.error('Erro ao gerar prompt. Verifique os dados e tente novamente.');
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }
    
    /**
     * Exibir prompt gerado na seção de resultados
     */
    displayGeneratedPrompt(promptData) {
        const resultsSection = document.getElementById('resultsSection');
        const promptResult = document.getElementById('promptResult');
        const promptMetadata = document.getElementById('promptMetadata');
        
        if (resultsSection && promptResult) {
            promptResult.textContent = promptData.prompt;
            resultsSection.classList.remove('hidden');
            
            // Popular metadados
            if (promptMetadata && promptData.metadata) {
                promptMetadata.innerHTML = `
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <div class="font-medium text-blue-900 dark:text-blue-200">Caracteres</div>
                        <div class="text-blue-700 dark:text-blue-300">${promptData.metadata.caracteres}</div>
                    </div>
                    <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <div class="font-medium text-green-900 dark:text-green-200">Palavras</div>
                        <div class="text-green-700 dark:text-green-300">${promptData.metadata.palavras}</div>
                    </div>
                    <div class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                        <div class="font-medium text-purple-900 dark:text-purple-200">Criado em</div>
                        <div class="text-purple-700 dark:text-purple-300">${new Date(promptData.metadata.timestamp).toLocaleString()}</div>
                    </div>
                `;
            }
            
            // Rolar para resultados
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    /**
     * Salvar prompt no histórico
     */
    saveToHistory(promptData, generatedPrompt) {
        try {
            const history = JSON.parse(localStorage.getItem('promptHistory') || '[]');
            const historyItem = {
                ...promptData,
                generatedPrompt: generatedPrompt.prompt,
                metadata: generatedPrompt.metadata,
                id: Date.now().toString(),
                timestamp: new Date().toISOString()
            };
            
            history.unshift(historyItem);
            
            // Manter apenas últimos 50 itens
            if (history.length > 50) {
                history.splice(50);
            }
            
            localStorage.setItem('promptHistory', JSON.stringify(history));
        } catch (error) {
            console.error('Error saving to history:', error);
        }
    }
    
    /**
     * Validar formulário de registro
     */
    validateRegisterForm(form) {
        const fullName = form.querySelector('#fullName');
        const email = form.querySelector('#email');
        const password = form.querySelector('#password');
        const confirmPassword = form.querySelector('#confirmPassword');
        const agreeTerms = form.querySelector('#agreeTerms');
        
        let isValid = true;
        
        // Validar nome completo
        if (!fullName?.value.trim() || fullName.value.trim().length < 2) {
            this.services.Toast?.error('Nome deve ter pelo menos 2 caracteres');
            isValid = false;
        }
        
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email?.value.trim() || !emailRegex.test(email.value.trim())) {
            this.services.Toast?.error('E-mail inválido');
            isValid = false;
        }
        
        // Validar senha
        if (!password?.value || password.value.length < 6) {
            this.services.Toast?.error('Senha deve ter pelo menos 6 caracteres');
            isValid = false;
        }
        
        // Validar confirmação de senha
        if (password?.value !== confirmPassword?.value) {
            this.services.Toast?.error('Senhas não coincidem');
            isValid = false;
        }
        
        // Validar aceitação dos termos
        if (!agreeTerms?.checked) {
            this.services.Toast?.error('Você deve aceitar os termos e condições');
            isValid = false;
        }
        
        return isValid;
    }
}

// Inicializar aplicação automaticamente quando todos os módulos estiverem carregados
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para garantir que todos os módulos foram carregados
    setTimeout(() => {
        console.log('🚀 Initializing PromptPro App...');
        const app = new PromptProApp();
        
        // Exportar para uso global
        window.PromptProApp = app;
        window.app = app;
        
        // Inicializar o router se disponível
        if (window.Router && window.Router.init) {
            console.log('🛣️ Initializing Router...');
            window.Router.init();
        } else {
            console.warn('⚠️ Router not available for initialization');
        }
        
        console.log('✅ App initialization complete');
    }, 100);
});

export default PromptProApp;
