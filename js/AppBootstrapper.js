/**
 * AppBootstrapper - Sistema de boot e verificação inicial
 * 
 * @description Responsável apenas por:
 * - Identificar ambiente (dev/prod)
 * - Verificar suporte ES6 Modules
 * - Registrar hora de início
 * - Inicializar AppInitializer
 * - Tratamento de erros globais
 * 
 * @author Desenvolvedor Full Stack
 * @version 1.0.0
 * @since 2025-08-06
 */

class AppBootstrapper {
    constructor() {
        this.bootStartTime = Date.now();
        this.environment = null;
        this.browserSupport = {
            es6Modules: false,
            asyncAwait: false,
            webAPIs: false
        };
        this.bootLogs = [];
        
        console.group('🚀 ProTech AppBootstrapper');
        this.logBoot('🔄 Sistema iniciando...');
        this.logBoot(`⏰ Timestamp: ${new Date().toISOString()}`);
    }

    /**
     * Método principal de boot
     */
    async boot() {
        try {
            // 1. Identificar ambiente
            this.identifyEnvironment();
            
            // 2. Verificar suporte do navegador
            this.checkBrowserSupport();
            
            // 3. Verificar se pode prosseguir
            this.validateEnvironment();
            
            // 4. Registrar informações de boot
            this.registerBootInfo();
            
            // 5. Inicializar o AppInitializer
            await this.initializeApp();
            
            // 6. Boot concluído com sucesso
            this.bootComplete();
            
        } catch (error) {
            this.handleBootFailure(error);
            throw error;
        }
    }

    /**
     * Identificar o ambiente de execução
     */
    identifyEnvironment() {
        this.logBoot('🔍 Identificando ambiente...');
        
        // Verificar protocolo
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        
        if (protocol === 'file:') {
            this.environment = 'development-local';
        } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
            this.environment = 'development-server';
        } else if (hostname.includes('github.io') || hostname.includes('netlify') || hostname.includes('vercel')) {
            this.environment = 'production-static';
        } else {
            this.environment = 'production-server';
        }
        
        this.logBoot(`📍 Ambiente identificado: ${this.environment}`);
        this.logBoot(`🌐 URL: ${window.location.href}`);
        this.logBoot(`🔗 Protocolo: ${protocol}`);
    }

    /**
     * Verificar suporte do navegador
     */
    checkBrowserSupport() {
        this.logBoot('🔧 Verificando suporte do navegador...');
        
        // Verificar ES6 Modules (usando try/catch em vez de typeof)
        try {
            // Se estamos aqui, o navegador já suporta ES6 modules
            this.browserSupport.es6Modules = true;
        } catch (error) {
            this.browserSupport.es6Modules = false;
        }
        
        // Verificar async/await (indiretamente através de Promise)
        this.browserSupport.asyncAwait = typeof Promise !== 'undefined' && 
                                        typeof Promise.prototype.finally === 'function';
        
        // Verificar Web APIs essenciais
        this.browserSupport.webAPIs = typeof localStorage !== 'undefined' && 
                                     typeof sessionStorage !== 'undefined' &&
                                     typeof document.addEventListener === 'function';
        
        this.logBoot(`📦 ES6 Modules: ${this.browserSupport.es6Modules ? '✅' : '❌'}`);
        this.logBoot(`⚡ Async/Await: ${this.browserSupport.asyncAwait ? '✅' : '❌'}`);
        this.logBoot(`🛠️ Web APIs: ${this.browserSupport.webAPIs ? '✅' : '❌'}`);
    }

    /**
     * Validar se o ambiente pode executar a aplicação
     */
    validateEnvironment() {
        this.logBoot('✅ Validando compatibilidade...');
        
        const errors = [];
        
        if (!this.browserSupport.es6Modules) {
            errors.push('ES6 Modules não suportados');
        }
        
        if (!this.browserSupport.asyncAwait) {
            errors.push('Async/Await não suportado');
        }
        
        if (!this.browserSupport.webAPIs) {
            errors.push('Web APIs essenciais não disponíveis');
        }
        
        if (errors.length > 0) {
            throw new Error(`Navegador incompatível: ${errors.join(', ')}`);
        }
        
        this.logBoot('✅ Ambiente compatível');
    }

    /**
     * Registrar informações de boot
     */
    registerBootInfo() {
        this.logBoot('📋 Registrando informações do sistema...');
        
        // Informações do navegador
        const userAgent = navigator.userAgent;
        const language = navigator.language;
        const cookiesEnabled = navigator.cookieEnabled;
        
        // Informações da tela
        const screenInfo = {
            width: screen.width,
            height: screen.height,
            colorDepth: screen.colorDepth
        };
        
        // Armazenar no objeto global para debug
        window.proTechBootInfo = {
            bootTime: this.bootStartTime,
            environment: this.environment,
            browserSupport: this.browserSupport,
            userAgent,
            language,
            cookiesEnabled,
            screenInfo,
            bootLogs: [...this.bootLogs]
        };
        
        this.logBoot(`🖥️ Navegador: ${userAgent.split(' ')[0]}`);
        this.logBoot(`🌍 Idioma: ${language}`);
        this.logBoot(`🍪 Cookies: ${cookiesEnabled ? '✅' : '❌'}`);
        this.logBoot(`📺 Resolução: ${screenInfo.width}x${screenInfo.height}`);
    }

    /**
     * Inicializar o AppInitializer
     */
    async initializeApp() {
        this.logBoot('🏗️ Carregando AppInitializer...');
        
        try {
            // Importar dinamicamente o AppInitializer
            const { default: AppInitializer } = await import('./app.init.js');
            
            this.logBoot('✅ AppInitializer importado com sucesso');
            
            // Criar instância e inicializar
            const appInitializer = new AppInitializer();
            
            // Disponibilizar globalmente
            window.appInitializer = appInitializer;
            
            this.logBoot('🚀 Iniciando AppInitializer...');
            
            // Inicializar a aplicação
            await appInitializer.init();
            
            this.logBoot('✅ AppInitializer concluído');
            
        } catch (error) {
            this.logBoot(`❌ Erro ao carregar AppInitializer: ${error.message}`);
            throw new Error(`Falha na inicialização: ${error.message}`);
        }
    }

    /**
     * Boot concluído com sucesso
     */
    bootComplete() {
        const totalBootTime = Date.now() - this.bootStartTime;
        this.logBoot(`🎉 Boot concluído em ${totalBootTime}ms`);
        this.logBoot('✅ ProTech está pronto para uso!');
        
        console.groupEnd();
        
        // Disparar evento de boot completo
        window.dispatchEvent(new CustomEvent('protech:boot:complete', {
            detail: {
                bootTime: totalBootTime,
                environment: this.environment,
                timestamp: new Date().toISOString()
            }
        }));
        
        // Limpar logs de boot após sucesso (opcional)
        if (this.environment.includes('production')) {
            setTimeout(() => {
                delete window.proTechBootInfo.bootLogs;
            }, 5000);
        }
    }

    /**
     * Tratar falhas no boot
     */
    handleBootFailure(error) {
        this.logBoot(`💥 FALHA CRÍTICA: ${error.message}`);
        console.groupEnd();
        
        // Criar tela de erro amigável
        this.showCriticalErrorScreen(error);
        
        // Disparar evento de erro
        window.dispatchEvent(new CustomEvent('protech:boot:error', {
            detail: {
                error: error.message,
                environment: this.environment,
                browserSupport: this.browserSupport,
                timestamp: new Date().toISOString()
            }
        }));
    }

    /**
     * Exibir tela de erro crítico
     */
    showCriticalErrorScreen(error) {
        const errorHTML = `
            <div id="protech-critical-error" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #1e3a8a, #3b82f6);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            ">
                <div style="
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border-radius: 16px;
                    padding: 40px;
                    max-width: 500px;
                    text-align: center;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                ">
                    <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">
                        Oops! Algo deu errado
                    </h2>
                    <p style="margin: 0 0 24px 0; opacity: 0.9; line-height: 1.5;">
                        ${error.message || 'Erro desconhecido na inicialização'}
                    </p>
                    <div style="margin-bottom: 24px; padding: 16px; background: rgba(0, 0, 0, 0.2); border-radius: 8px; font-size: 14px;">
                        <strong>Ambiente:</strong> ${this.environment || 'Desconhecido'}<br>
                        <strong>Navegador:</strong> ${this.browserSupport.es6Modules ? 'Compatível' : 'Incompatível'}
                    </div>
                    <button onclick="window.location.reload()" style="
                        background: white;
                        color: #1e3a8a;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 16px;
                    ">
                        🔄 Tentar Novamente
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', errorHTML);
    }

    /**
     * Log interno do boot
     */
    logBoot(message) {
        const timestamp = Date.now() - this.bootStartTime;
        const logMessage = `[${timestamp}ms] ${message}`;
        this.bootLogs.push(logMessage);
        console.log(logMessage);
    }
}

// Função global para boot
window.bootProTech = async function() {
    const bootstrapper = new AppBootstrapper();
    await bootstrapper.boot();
    return bootstrapper;
};

export default AppBootstrapper;
