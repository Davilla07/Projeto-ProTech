
/**
 * AuthService.js - Serviço de autenticação consolidado e profissional
 * 
 * @description Unifica toda a lógica de autenticação da aplicação, gerenciando
 * login, logout, sessões, monitoramento de inatividade e segurança.
 * Consolida funcionalidades anteriormente espalhadas em auth.js, auth.class.js
 * e auth-simple.js para uma abordagem centralizada e modular.
 * 
 * @author ProTech Development Team
 * @version 2.0.0
 * @since 2025-08-06
 */

import { Toast, CryptoUtils, Validation } from '../core/index.js';

/**
 * Serviço centralizado de autenticação
 * Gerencia login, logout, sessões e segurança
 */
class AuthService {
  constructor() {
    // Chaves de armazenamento local
    this.sessionKey = 'ferramenta_protech_session';
    this.userKey = 'usuariosRegistrados';
    
    // Configurações de segurança
    this.maxTentativas = 3;
    this.tentativasLogin = 0;
    
    // Monitoramento de atividade
    this.ultimaAtividade = Date.now();
    this.intervaloInatividade = 30 * 60 * 1000; // 30 minutos em ms
    this.timerInatividade = null;
    
    // Estados de controle
    this.carregado = false;
    this.processandoLogin = false;
    
    // Usuários padrão para demonstração
    // TODO: Migrar para autenticação via API em produção
    this.usuariosPadrao = [
      { id: 1, email: 'admin@promptpro.com', senha: 'admin123', role: 'admin' },
      { id: 2, email: 'demo@promptpro.com', senha: 'demo123', role: 'user' }
    ];
    
    // Inicializar monitoramentos
    this.inicializarMonitoramentoInatividade();
    this.inicializarUsuariosPadrao();
  }

  /**
   * Inicializa o serviço de autenticação
   * Verifica dependências e estado de login existente
   * 
   * @returns {Promise<void>}
   */
  async iniciar() {
    await this.aguardarDependencias();
    
    // Se já está logado, redirecionar para área autenticada
    if (this.verificarLogin()) {
      this.redirecionarParaBoasVindas();
      return;
    }
    
    this.carregado = true;
  }

  /**
   * Aguarda carregamento das dependências críticas
   * Sistema de fallback para evitar erros de módulos não carregados
   * 
   * @private
   * @returns {Promise<void>}
   */
  async aguardarDependencias() {
    const dependencias = [Toast, CryptoUtils, Validation];
    
    for (const dep of dependencias) {
      let tentativas = 0;
      const maxTentativas = 50; // 5 segundos máximo
      
      while (!dep && tentativas < maxTentativas) {
        await new Promise(resolve => setTimeout(resolve, 100));
        tentativas++;
      }
      
      if (tentativas >= maxTentativas) {
        console.warn(`⚠️ Dependência não carregada após ${maxTentativas * 100}ms`);
      }
    }
  }

  /**
   * Configura monitoramento automático de inatividade
   * Faz logout automático após período de inatividade configurado
   * 
   * @private
   */
  inicializarMonitoramentoInatividade() {
    // Verificar inatividade a cada minuto
    this.timerInatividade = setInterval(() => {
      const tempoInativo = Date.now() - this.ultimaAtividade;
      
      if (tempoInativo > this.intervaloInatividade) {
        console.log('🕒 Sessão expirada por inatividade');
        this.logout();
      }
    }, 60 * 1000); // Verificar a cada minuto
  }

  /**
   * Inicializa usuários padrão se não existirem
   * Usado para demonstração - deve ser removido em produção
   * 
   * @private
   */
  inicializarUsuariosPadrao() {
    if (!localStorage.getItem(this.userKey)) {
      localStorage.setItem(this.userKey, JSON.stringify(this.usuariosPadrao));
    }
  }

  /**
   * Processa tentativa de login do usuário
   * Inclui validação, controle de tentativas e segurança
   * 
   * @param {string} email - Email do usuário
   * @param {string} senha - Senha do usuário
   * @param {boolean} lembrar - Se deve manter sessão persistente
   * @returns {Promise<Object>} Resultado do login
   * 
   * @throws {Error} Em caso de credenciais inválidas ou conta bloqueada
   */
  async processarLogin(email, senha, lembrar = false) {
    try {
      // Verificar se a conta está temporariamente bloqueada
      if (this.tentativasLogin >= this.maxTentativas) {
        const mensagem = 'Conta temporariamente bloqueada por excesso de tentativas';
        Toast.error(mensagem);
        throw new Error('Conta bloqueada');
      }

      // Validar formato do email antes de processar
      if (!Validation.validate(email, 'email')) {
        Toast.error('Formato de email inválido');
        throw new Error('Email inválido');
      }

      // Validar credenciais contra base de dados
      const usuario = await this.validarCredenciais(email, senha);
      if (!usuario) {
        this.tentativasLogin++;
        const tentativasRestantes = this.maxTentativas - this.tentativasLogin;
        
        if (tentativasRestantes > 0) {
          Toast.error(`Email ou senha incorretos. ${tentativasRestantes} tentativa(s) restante(s)`);
        } else {
          Toast.error('Conta bloqueada por excesso de tentativas');
        }
        
        throw new Error('Credenciais inválidas');
      }

      // Login bem-sucedido - resetar contador e efetivar login
      this.tentativasLogin = 0;
      await this.realizarLogin(usuario, lembrar);
      
      Toast.success('Login realizado com sucesso!');
      return { 
        success: true, 
        usuario, 
        message: 'Login realizado com sucesso!' 
      };
      
    } catch (error) {
      console.error('❌ Erro no processamento de login:', error);
      throw error;
    }
  }

  /**
   * Valida credenciais do usuário contra a base de dados
   * Em produção, deve ser substituído por chamada à API
   * 
   * @private
   * @param {string} email - Email para validação
   * @param {string} senha - Senha para validação
   * @returns {Promise<Object|null>} Dados do usuário ou null se inválido
   */
  async validarCredenciais(email, senha) {
    try {
      const usuarios = JSON.parse(localStorage.getItem(this.userKey) || '[]');
      return usuarios.find(u => u.email === email && u.senha === senha);
    } catch (error) {
      console.error('Erro ao validar credenciais:', error);
      return null;
    }
  }

  /**
   * Realizar login e salvar sessão
   */
  async realizarLogin(usuario, lembrar) {
    try {
      const sessionData = {
        ...usuario,
        loginTime: Date.now(),
        sessionId: this.gerarSessionId()
      };

      // Salvar na sessão
      sessionStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
      
      // Salvar permanentemente se solicitado
      if (lembrar) {
        localStorage.setItem(this.sessionKey + '_remember', JSON.stringify(sessionData));
      }

      // Disparar evento de mudança de auth
      this.dispatchAuthEvent(true, sessionData);
      
    } catch (error) {
      console.error('Erro ao realizar login:', error);
      throw error;
    }
  }

  /**
   * Verificar se usuário está logado
   */
  verificarLogin() {
    try {
      const sessionData = this.getCurrentUser();
      return !!sessionData;
    } catch (error) {
      console.error('Erro ao verificar login:', error);
      return false;
    }
  }

  /**
   * Obter usuário atual
   */
  getCurrentUser() {
    try {
      // Verificar sessão atual
      let userData = sessionStorage.getItem(this.sessionKey);
      
      // Se não encontrou, verificar se há login lembrado
      if (!userData) {
        userData = localStorage.getItem(this.sessionKey + '_remember');
        if (userData) {
          // Restaurar para sessão atual
          sessionStorage.setItem(this.sessionKey, userData);
        }
      }

      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      return null;
    }
  }

  /**
   * Verificar se usuário está autenticado
   */
  isAuthenticated() {
    return this.verificarLogin();
  }

  /**
   * Fazer logout
   */
  logout() {
    try {
      // Limpar dados de sessão
      sessionStorage.removeItem(this.sessionKey);
      localStorage.removeItem(this.sessionKey + '_remember');
      
      // Parar timer de inatividade
      if (this.timerInatividade) {
        clearInterval(this.timerInatividade);
      }

      // Disparar evento de logout
      this.dispatchAuthEvent(false, null);
      
      Toast.success('Logout realizado com sucesso');
      
      return { success: true, message: 'Logout realizado com sucesso' };
      
    } catch (error) {
      console.error('Erro no logout:', error);
      return { success: false, message: 'Erro ao fazer logout' };
    }
  }

  /**
   * Redirecionar para boas-vindas
   */
  redirecionarParaBoasVindas() {
    setTimeout(() => {
      window.location.href = 'boas-vindas.html';
    }, 500);
  }

  /**
   * Gerar ID de sessão único
   */
  gerarSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Disparar evento de mudança de autenticação
   */
  dispatchAuthEvent(isAuthenticated, userData) {
    const event = new CustomEvent('authStateChanged', {
      detail: {
        isAuthenticated,
        user: userData,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(event);
  }

  logout() {
    localStorage.removeItem(this.sessionKey);
    window.location.href = '/login.html';
  }

  isAuthenticated() {
    const session = this.getSession();
    return session && session.email;
  }

  getSession() {
    try {
      return JSON.parse(localStorage.getItem(this.sessionKey));
    } catch {
      return null;
    }
  }

  setSession(data) {
    localStorage.setItem(this.sessionKey, JSON.stringify(data));
  }
}

const authService = new AuthService();

// Disponibilizar globalmente (apenas uma instância)
window.AuthService = authService;

// Inicializar automaticamente
authService.iniciar();

export default authService;
