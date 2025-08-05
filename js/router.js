import AuthService from './services/AuthService.js';
/**
 * Router - Sistema de roteamento SPA com fallback
 * Gerencia navegação entre páginas com suporte a SPA e redirecionamentos
 */

class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.basePath = '';
        this.mode = 'hash'; // 'hash' ou 'history'
        this.initialized = false;
    }

    /**
     * Inicializar router manualmente
     */
    init() {
        if (this.initialized) {
            return;
        }
        
        // Detectar modo baseado no ambiente
        this.detectMode();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Registrar rotas padrão
        this.registerDefaultRoutes();
        
        // Carregar rota inicial
        this.loadInitialRoute();
        
        this.initialized = true;
    }

    /**
     * Detectar modo de operação
     */
    detectMode() {
        // Se estiver usando protocolo file://, usar hash mode
        if (window.location.protocol === 'file:') {
            this.mode = 'hash';
        } else {
            // Verificar se history API está disponível
            this.mode = window.history && window.history.pushState ? 'history' : 'hash';
        }
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        if (this.mode === 'hash') {
            window.addEventListener('hashchange', () => this.handleRouteChange());
        } else {
            window.addEventListener('popstate', () => this.handleRouteChange());
        }

        // Interceptar cliques em links
        document.addEventListener('click', (e) => this.handleLinkClick(e));
    }

    /**
     * Registrar rota
     */
    register(path, handler, options = {}) {
        const {
            requireAuth = false,
            redirectIfAuth = false,
            title = null,
            beforeEnter = null,
            afterEnter = null
        } = options;

        this.routes.set(path, {
            handler,
            requireAuth,
            redirectIfAuth,
            title,
            beforeEnter,
            afterEnter,
            path
        });

        return this;
    }

    /**
     * Navegar para rota
     */
    navigate(path, options = {}) {
        const { replace = false, silent = false } = options;

        try {
            // Normalizar path
            const normalizedPath = this.normalizePath(path);
            
            // Verificar se é rota externa
            if (this.isExternalPath(normalizedPath)) {
                window.location.href = normalizedPath;
                return;
            }

            // Atualizar URL se não for silent
            if (!silent) {
                this.updateURL(normalizedPath, replace);
            }

            // Carregar rota
            this.loadRoute(normalizedPath);

        } catch (error) {
            console.error('Navigation error:', error);
            Toast?.error('Erro na navegação');
        }
    }

    /**
     * Carregar rota
     */
    async loadRoute(path) {
        const route = this.findRoute(path);
        
        if (!route) {
            this.handle404(path);
            return;
        }

        try {
            // Verificar autenticação
            if (!this.checkAuth(route)) {
                return;
            }

            // Executar beforeEnter se existir
            if (route.beforeEnter) {
                const shouldContinue = await route.beforeEnter(route, path);
                if (shouldContinue === false) return;
            }

            // Atualizar título da página
            if (route.title) {
                document.title = route.title;
            }

            // Executar handler da rota
            await route.handler(path, route);

            // Atualizar rota atual
            this.currentRoute = { ...route, path };

            // Executar afterEnter se existir
            if (route.afterEnter) {
                route.afterEnter(route, path);
            }

            // Disparar evento
            this.dispatchRouteEvent('route:loaded', { route, path });

        } catch (error) {
            console.error('Route loading error:', error);
            this.handleRouteError(error, route, path);
        }
    }

    /**
     * Verificar autenticação
     */
    checkAuth(route) {
        const isAuthenticated = AuthService?.isAuthenticated() || false;

        // Rota requer autenticação
        if (route.requireAuth && !isAuthenticated) {
            Toast?.warning('Você precisa fazer login para acessar esta página');
            this.navigate('/login.html', { replace: true });
            return false;
        }

        // Redirecionar se já autenticado
        if (route.redirectIfAuth && isAuthenticated) {
            this.navigate('/ferramenta.html', { replace: true });
            return false;
        }

        return true;
    }

    /**
     * Encontrar rota correspondente
     */
    findRoute(path) {
        // Busca exata primeiro
        if (this.routes.has(path)) {
            return this.routes.get(path);
        }

        // Busca por padrões (wildcards, parâmetros)
        for (const [routePath, route] of this.routes) {
            if (this.matchRoute(routePath, path)) {
                return route;
            }
        }

        return null;
    }

    /**
     * Verificar se rota corresponde ao padrão
     */
    matchRoute(routePath, actualPath) {
        // Converter rota para regex
        const pattern = routePath
            .replace(/\*/g, '.*')  // Wildcards
            .replace(/:\w+/g, '[^/]+'); // Parâmetros

        const regex = new RegExp(`^${pattern}$`);
        return regex.test(actualPath);
    }

    /**
     * Normalizar path
     */
    normalizePath(path) {
        if (!path) return '/';
        
        // Se for URL completa, retornar como está
        if (path.includes('://')) return path;
        
        // Adicionar .html se não tiver extensão
        if (!path.includes('.') && !path.endsWith('/')) {
            path += '.html';
        }
        
        // Garantir que comece com /
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        
        return path;
    }

    /**
     * Verificar se é path externo
     */
    isExternalPath(path) {
        return path.includes('://') || path.startsWith('mailto:') || path.startsWith('tel:');
    }

    /**
     * Atualizar URL
     */
    updateURL(path, replace = false) {
        if (this.mode === 'hash') {
            const hash = '#' + path;
            if (replace) {
                window.location.replace(hash);
            } else {
                window.location.hash = hash;
            }
        } else {
            const url = this.basePath + path;
            if (replace) {
                window.history.replaceState(null, '', url);
            } else {
                window.history.pushState(null, '', url);
            }
        }
    }

    /**
     * Obter path atual
     */
    getCurrentPath() {
        if (this.mode === 'hash') {
            return window.location.hash.slice(1) || '/';
        } else {
            return window.location.pathname.replace(this.basePath, '') || '/';
        }
    }

    /**
     * Carregar rota inicial
     */
    loadInitialRoute() {
        const path = this.getCurrentPath();
        this.loadRoute(path);
    }

    /**
     * Manipular mudança de rota
     */
    handleRouteChange() {
        const path = this.getCurrentPath();
        this.loadRoute(path);
    }

    /**
     * Manipular clique em links
     */
    handleLinkClick(event) {
        const link = event.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href) return;

        // Ignorar links externos, mailto, tel, etc.
        if (this.isExternalPath(href) || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return;
        }

        // Ignorar se tiver target="_blank" ou modificadores
        if (link.target === '_blank' || event.ctrlKey || event.metaKey || event.shiftKey) {
            return;
        }

        // Interceptar navegação
        event.preventDefault();
        this.navigate(href);
    }

    /**
     * Manipular erro 404
     */
    handle404(path) {
        console.warn('Route not found:', path);
        
        // Tentar redirecionar para páginas comuns
        const commonRedirects = {
            '/': '/index.html',
            '/home': '/index.html',
            '/dashboard': '/ferramenta.html',
            '/tool': '/ferramenta.html',
            '/signin': '/login.html',
            '/signup': '/register.html'
        };

        if (commonRedirects[path]) {
            this.navigate(commonRedirects[path], { replace: true });
            return;
        }

        // Fallback para página inicial
        Toast?.warning('Página não encontrada, redirecionando...');
        setTimeout(() => {
            this.navigate('/index.html', { replace: true });
        }, 2000);
    }

    /**
     * Manipular erro de rota
     */
    handleRouteError(error, route, path) {
        console.error('Route error:', error);
        Toast?.error('Erro ao carregar página');
        
        // Tentar fallback
        if (path !== '/index.html') {
            this.navigate('/index.html', { replace: true });
        }
    }

    /**
     * Disparar evento de rota
     */
    dispatchRouteEvent(type, detail) {
        const event = new CustomEvent(type, { detail });
        window.dispatchEvent(event);
    }

    /**
     * Voltar na história
     */
    back() {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            this.navigate('/index.html');
        }
    }

    /**
     * Avançar na história
     */
    forward() {
        window.history.forward();
    }

    /**
     * Recarregar rota atual
     */
    reload() {
        const currentPath = this.getCurrentPath();
        this.loadRoute(currentPath);
    }

    /**
     * Registrar rotas padrão
     */
    registerDefaultRoutes() {
        // Página inicial
        this.register('/', () => this.loadPage('/index.html'), {
            title: 'PromptPro - Início'
        });

        this.register('/index.html', () => this.loadPage('/index.html'), {
            title: 'PromptPro - Início'
        });

        // Login
        this.register('/login.html', () => this.loadPage('/login.html'), {
            title: 'PromptPro - Login',
            redirectIfAuth: true
        });

        // Registro
        this.register('/register.html', () => this.loadPage('/register.html'), {
            title: 'PromptPro - Cadastro',
            redirectIfAuth: true
        });

        // Ferramenta
        this.register('/ferramenta.html', () => this.loadPage('/ferramenta.html'), {
            title: 'PromptPro - Ferramenta',
            requireAuth: true
        });

        // Admin
        this.register('/admin.html', () => this.loadPage('/admin.html'), {
            title: 'PromptPro - Admin',
            requireAuth: true,
            beforeEnter: () => {
                const user = AuthService?.getCurrentUser();
                if (user?.role !== 'admin') {
                    Toast?.error('Acesso negado');
                    return false;
                }
                return true;
            }
        });

        return this;
    }

    /**
     * Carregar página (fallback para navegação tradicional)
     */
    loadPage(path) {
        // Se estivermos na mesma página, não recarregar
        if (window.location.pathname.endsWith(path)) {
            return;
        }

        // Navegar para a página
        window.location.href = path;
    }

    /**
     * Utilitários para navegação programática
     */
    goToLogin() {
        this.navigate('/login.html');
    }

    goToRegister() {
        this.navigate('/register.html');
    }

    goToHome() {
        this.navigate('/index.html');
    }

    goToDashboard() {
        this.navigate('/ferramenta.html');
    }

    goToAdmin() {
        this.navigate('/admin.html');
    }

    /**
     * Middleware para proteger múltiplas rotas
     */
    protect(paths, middleware) {
        paths.forEach(path => {
            const route = this.routes.get(path);
            if (route) {
                const originalBeforeEnter = route.beforeEnter;
                route.beforeEnter = async (route, path) => {
                    const middlewareResult = await middleware(route, path);
                    if (middlewareResult === false) return false;
                    
                    if (originalBeforeEnter) {
                        return await originalBeforeEnter(route, path);
                    }
                    
                    return true;
                };
            }
        });
    }
}

// Instância única
const router = new Router();

// Disponibilizar globalmente
window.router = router;
window.Router = Router;

console.log('✅ Router carregado e disponível globalmente');

// Inicialização manual será feita pelo main.js
// router.init() será chamado quando todos os módulos estiverem carregados

// Exportar para uso global
export default router;

