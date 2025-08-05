
// AuthService.js - Serviço de autenticação consolidado e profissional
// Unifica lógica de auth.js, auth.class.js e auth-simple.js
// Utiliza dependências de toast, crypto, validation via ES6 modules

import { Toast } from '../core/toast.js';
import { CryptoUtils } from '../core/crypto.utils.js';
import { Validation } from '../core/validation.js';

class AuthService {
  constructor() {
    this.sessionKey = 'ferramenta_protech_session';
    this.userKey = 'usuariosRegistrados';
    this.maxTentativas = 3;
    this.tentativasLogin = 0;
    this.ultimaAtividade = Date.now();
    this.intervaloInatividade = 30 * 60 * 1000; // 30 minutos
    this.timerInatividade = null;
    this.carregado = false;
    this.processandoLogin = false;
    this.usuariosPadrao = [
      { id: 1, email: 'admin@promptpro.com', senha: 'admin123' },
      { id: 2, email: 'demo@promptpro.com', senha: 'demo123' }
    ];
    this.inicializarMonitoramentoInatividade();
    this.inicializarUsuariosPadrao();
  }

  async iniciar() {
    await this.aguardarDependencias();
    if (this.verificarLogin()) {
      this.redirecionarParaBoasVindas();
      return;
    }
    this.carregado = true;
  }

  async aguardarDependencias() {
    // Aguarda Toast, CryptoUtils, Validation
    const dependencias = [Toast, CryptoUtils, Validation];
    for (const dep of dependencias) {
      let tentativas = 0;
      while (!dep && tentativas < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        tentativas++;
      }
    }
  }

  inicializarMonitoramentoInatividade() {
    this.timerInatividade = setInterval(() => {
      if (Date.now() - this.ultimaAtividade > this.intervaloInatividade) {
        this.logout();
      }
    }, 60 * 1000);
  }

  inicializarUsuariosPadrao() {
    if (!localStorage.getItem(this.userKey)) {
      localStorage.setItem(this.userKey, JSON.stringify(this.usuariosPadrao));
    }
  }

  /**
   * Processar login do usuário
   */
  async processarLogin(email, senha, lembrar = false) {
    try {
      // Verificar se está bloqueado
      if (this.tentativasLogin >= this.maxTentativas) {
        Toast.error('Conta temporariamente bloqueada por excesso de tentativas');
        throw new Error('Conta bloqueada');
      }

      // Validar credenciais
      const usuario = await this.validarCredenciais(email, senha);
      if (!usuario) {
        this.tentativasLogin++;
        Toast.error('Email ou senha incorretos');
        throw new Error('Credenciais inválidas');
      }

      // Reset tentativas e fazer login
      this.tentativasLogin = 0;
      await this.realizarLogin(usuario, lembrar);
      
      Toast.success('Login realizado com sucesso!');
      return { 
        success: true, 
        usuario, 
        message: 'Login realizado com sucesso!' 
      };
      
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  /**
   * Validar credenciais do usuário
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
