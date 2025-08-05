import { Toast } from '../core/toast.js';
/**
 * DarkMode - Sistema de modo escuro/claro
 * Gerencia tema da aplicação com persistência e detecção automática
 */

class DarkModeSystem {
    constructor() {
        this.storageKey = 'promptpro_theme';
        this.currentTheme = null;
        this.systemPreference = null;
        this.observers = new Set();
        
        this.init();
    }

    /**
     * Inicializar sistema de modo escuro
     */
    init() {
        // Detectar preferência do sistema
        this.detectSystemPreference();
        
        // Carregar tema salvo ou usar preferência do sistema
        this.loadTheme();
        
        // Configurar listeners
        this.setupEventListeners();
        
        // Aplicar tema inicial
        this.applyTheme(this.currentTheme);
    }

    /**
     * Detectar preferência do sistema
     */
    detectSystemPreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.systemPreference = 'dark';
        } else {
            this.systemPreference = 'light';
        }
    }

    /**
     * Carregar tema do storage
     */
    loadTheme() {
        try {
            const savedTheme = localStorage.getItem(this.storageKey);
            
            if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
                this.currentTheme = savedTheme;
            } else {
                this.currentTheme = 'auto';
            }
        } catch {
            this.currentTheme = 'auto';
        }
    }

    /**
     * Salvar tema no storage
     */
    saveTheme(theme) {
        try {
            localStorage.setItem(this.storageKey, theme);
        } catch (error) {
            console.warn('Unable to save theme preference:', error);
        }
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Monitorar mudanças na preferência do sistema
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            // Método moderno
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', (e) => {
                    this.systemPreference = e.matches ? 'dark' : 'light';
                    if (this.currentTheme === 'auto') {
                        this.applyTheme('auto');
                    }
                    this.notifyObservers();
                });
            } 
            // Fallback para navegadores mais antigos
            else if (mediaQuery.addListener) {
                mediaQuery.addListener((e) => {
                    this.systemPreference = e.matches ? 'dark' : 'light';
                    if (this.currentTheme === 'auto') {
                        this.applyTheme('auto');
                    }
                    this.notifyObservers();
                });
            }
        }

        // Monitorar mudanças no storage (sincronização entre abas)
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) {
                const newTheme = e.newValue;
                if (newTheme && newTheme !== this.currentTheme) {
                    this.currentTheme = newTheme;
                    this.applyTheme(newTheme);
                    this.notifyObservers();
                }
            }
        });
    }

    /**
     * Aplicar tema
     */
    applyTheme(theme) {
        const resolvedTheme = this.resolveTheme(theme);
        const html = document.documentElement;
        
        // Remover classes anteriores
        html.classList.remove('light', 'dark');
        
        // Adicionar nova classe
        html.classList.add(resolvedTheme);
        
        // Atualizar meta theme-color para mobile
        this.updateThemeColor(resolvedTheme);
        
        // Disparar evento
        this.dispatchThemeEvent(resolvedTheme, theme);
    }

    /**
     * Resolver tema (auto -> light/dark)
     */
    resolveTheme(theme) {
        if (theme === 'auto') {
            return this.systemPreference || 'light';
        }
        return theme;
    }

    /**
     * Atualizar cor do tema para mobile
     */
    updateThemeColor(resolvedTheme) {
        let themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeColorMeta) {
            themeColorMeta = document.createElement('meta');
            themeColorMeta.setAttribute('name', 'theme-color');
            document.head.appendChild(themeColorMeta);
        }
        const colors = {
            light: '#ffffff',
            dark: '#1f2937'
        };
        themeColorMeta.content = colors[resolvedTheme] || colors.light;
    }

    /**
     * Definir tema
     */
    setTheme(theme) {
        if (!['light', 'dark', 'auto'].includes(theme)) {
            console.warn('Invalid theme:', theme);
            return;
        }
        this.currentTheme = theme;
        this.saveTheme(theme);
        this.applyTheme(theme);
        this.notifyObservers();
        // Feedback para o usuário
        const messages = {
            light: 'Modo claro ativado',
            dark: 'Modo escuro ativado',
            auto: 'Modo automático ativado'
        };
        Toast.success(messages[theme]);
    }

    /**
     * Alternar entre temas
     */
    toggle() {
        const sequence = ['light', 'dark', 'auto'];
        const currentIndex = sequence.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % sequence.length;
        
        this.setTheme(sequence[nextIndex]);
    }

    /**
     * Alternar entre claro e escuro (ignorando auto)
     */
    toggleSimple() {
        const resolvedTheme = this.resolveTheme(this.currentTheme);
        const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    /**
     * Obter tema atual
     */
    getTheme() {
        return this.currentTheme;
    }

    /**
     * Obter tema resolvido (sem auto)
     */
    getResolvedTheme() {
        return this.resolveTheme(this.currentTheme);
    }

    /**
     * Verificar se está no modo escuro
     */
    isDark() {
        return this.resolveTheme(this.currentTheme) === 'dark';
    }

    /**
     * Verificar se está no modo claro
     */
    isLight() {
        return this.resolveTheme(this.currentTheme) === 'light';
    }

    /**
     * Verificar se está no modo automático
     */
    isAuto() {
        return this.currentTheme === 'auto';
    }

    /**
     * Disparar evento de mudança de tema
     */
    dispatchThemeEvent(resolvedTheme, originalTheme) {
        const event = new CustomEvent('themeChanged', {
            detail: {
                theme: originalTheme,
                resolvedTheme: resolvedTheme,
                isDark: resolvedTheme === 'dark',
                isLight: resolvedTheme === 'light',
                isAuto: originalTheme === 'auto'
            }
        });
        
        window.dispatchEvent(event);
    }

    /**
     * Adicionar observer para mudanças de tema
     */
    addObserver(callback) {
        this.observers.add(callback);
        
        // Chamada inicial
        callback({
            theme: this.currentTheme,
            resolvedTheme: this.resolveTheme(this.currentTheme),
            isDark: this.isDark(),
            isLight: this.isLight(),
            isAuto: this.isAuto()
        });

        // Retornar função para remover observer
        return () => this.observers.delete(callback);
    }

    /**
     * Notificar observers
     */
    notifyObservers() {
        const data = {
            theme: this.currentTheme,
            resolvedTheme: this.resolveTheme(this.currentTheme),
            isDark: this.isDark(),
            isLight: this.isLight(),
            isAuto: this.isAuto()
        };

        this.observers.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in theme observer:', error);
            }
        });
    }

    /**
     * Criar toggle button
     */
    createToggleButton(options = {}) {
        const {
            container = document.body,
            className = '',
            showLabel = true,
            position = 'fixed'
        } = options;

        const button = document.createElement('button');
        button.className = `
            ${position === 'fixed' ? 'fixed top-4 right-20 z-40' : ''} 
            inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md
            text-gray-500 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200
            ${className}
        `;

        const updateButton = () => {
            const isDark = this.isDark();
            const isAuto = this.isAuto();
            
            let icon, label;
            
            if (isAuto) {
                icon = '🌗';
                label = 'Auto';
            } else if (isDark) {
                icon = '🌙';
                label = 'Escuro';
            } else {
                icon = '☀️';
                label = 'Claro';
            }

            button.innerHTML = `
                <span class="text-base mr-1">${icon}</span>
                ${showLabel ? `<span class="hidden sm:inline">${label}</span>` : ''}
            `;

            button.title = `Tema atual: ${label}. Clique para alterar.`;
        };

        // Configurar evento de clique
        button.addEventListener('click', () => this.toggle());

        // Observer para atualizar o botão
        this.addObserver(updateButton);

        // Atualização inicial
        updateButton();

        // Adicionar ao container
        if (container) {
            container.appendChild(button);
        }

        return button;
    }

    /**
     * Obter CSS para transições suaves
     */
    getTransitionCSS() {
        return `
            * {
                transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease !important;
            }
            
            *:before,
            *:after {
                transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease !important;
            }
        `;
    }

    /**
     * Aplicar transições suaves
     */
    enableTransitions() {
        // Verificar se já foram aplicadas
        if (document.getElementById('dark-mode-transitions')) return;

        const style = document.createElement('style');
        style.id = 'dark-mode-transitions';
        style.textContent = this.getTransitionCSS();
        document.head.appendChild(style);
    }

    /**
     * Configurar automaticamente
     */
    autoSetup(options = {}) {
        const {
            enableTransitions = true,
            createToggleButton = true,
            toggleButtonOptions = {}
        } = options;

        if (enableTransitions) {
            this.enableTransitions();
        }

        if (createToggleButton) {
            // Aguardar DOM estar pronto
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.createToggleButton(toggleButtonOptions);
                });
            } else {
                this.createToggleButton(toggleButtonOptions);
            }
        }

        return this;
    }
}

// Instância única
const darkMode = new DarkModeSystem();

// Disponibilizar globalmente (apenas uma instância)
window.DarkMode = darkMode;

// Auto-setup básico
darkMode.autoSetup({
    enableTransitions: true,
    createToggleButton: false // Será criado manualmente nas páginas
});

export default darkMode;
