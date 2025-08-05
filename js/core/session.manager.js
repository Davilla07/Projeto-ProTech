/**
 * UserSessionManager - Gerenciador centralizado de sessões de usuário
 * 
 * @description Classe responsável por centralizar toda a lógica de 
 * manipulação de localStorage e sessionStorage, garantindo consistência
 * e segurança no armazenamento de dados de sessão.
 * 
 * @author Desenvolvedor Full Stack Sênior
 * @version 2.0.0
 * @since 2025-08-02
 */

class UserSessionManager {
  
  /**
   * Configurações do gerenciador de sessão
   * @static
   * @readonly
   */
  static CONFIG = {
    STORAGE_KEYS: {
      USER_DATA: 'utilidadepro_user_data',
      SESSION_TOKEN: 'utilidadepro_session_token',
      REMEMBER_ME: 'utilidadepro_remember_me',
      LAST_LOGIN: 'utilidadepro_last_login'
    },
    ENCRYPTION: {
      ENABLED: true,
      ALGORITHM: 'base64' // Simulação de criptografia com btoa/atob
    },
    SESSION: {
      TIMEOUT: 24 * 60 * 60 * 1000, // 24 horas em ms
      REFRESH_INTERVAL: 30 * 60 * 1000 // 30 minutos em ms
    }
  };

  constructor() {
    /** @type {Object|null} Dados do usuário atual */
    this.currentUser = null;
    
    /** @type {string|null} Token de sessão atual */
    this.sessionToken = null;
    
    /** @type {boolean} Status de inicialização */
    this.initialized = false;
    
    console.group('🔐 UserSessionManager');
    console.log('Inicializando gerenciador de sessão...');
    console.groupEnd();
  }

  /**
   * Inicializa o gerenciador de sessão
   * @returns {Promise<boolean>} Status da inicialização
   */
  async initialize() {
    try {
      console.group('🚀 Inicializando UserSessionManager');
      
      // Verificar suporte ao Storage
      this._checkStorageSupport();
      
      // Carregar dados existentes
      await this._loadExistingSession();
      
      // Configurar auto-limpeza
      this._setupAutoCleanup();
      
      this.initialized = true;
      console.log('✅ UserSessionManager inicializado com sucesso');
      console.groupEnd();
      
      return true;
      
    } catch (error) {
      console.error('💥 Erro na inicialização do UserSessionManager:', error);
      console.groupEnd();
      return false;
    }
  }

  /**
   * Salva dados do usuário na sessão
   * @param {Object} userData - Dados do usuário
   * @param {boolean} rememberMe - Se deve persistir no localStorage
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async saveUserSession(userData, rememberMe = false) {
    try {
      console.group('💾 Salvando sessão do usuário');
      console.table(userData);
      
      // Validar dados obrigatórios
      if (!this._validateUserData(userData)) {
        throw new Error('Dados de usuário inválidos');
      }

      // Gerar token de sessão
      const sessionToken = this._generateSessionToken();
      
      // Preparar dados para armazenamento
      const sessionData = {
        ...userData,
        sessionToken,
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        rememberMe
      };

      // Criptografar dados (simulação)
      const encryptedData = this._encryptData(sessionData);
      
      // Salvar em sessionStorage (sempre)
      sessionStorage.setItem(
        UserSessionManager.CONFIG.STORAGE_KEYS.USER_DATA, 
        encryptedData
      );
      
      // Salvar em localStorage (se lembrar)
      if (rememberMe) {
        localStorage.setItem(
          UserSessionManager.CONFIG.STORAGE_KEYS.USER_DATA, 
          encryptedData
        );
        localStorage.setItem(
          UserSessionManager.CONFIG.STORAGE_KEYS.REMEMBER_ME, 
          'true'
        );
      }

      // Atualizar estado interno
      this.currentUser = sessionData;
      this.sessionToken = sessionToken;
      
      console.log('✅ Sessão salva com sucesso');
      console.log(`🔒 Token gerado: ${sessionToken.substring(0, 10)}...`);
      console.groupEnd();
      
      return true;
      
    } catch (error) {
      console.error('💥 Erro ao salvar sessão:', error);
      console.groupEnd();
      return false;
    }
  }

  /**
   * Recupera dados do usuário da sessão
   * @returns {Object|null} Dados do usuário ou null
   */
  getUserSession() {
    try {
      if (this.currentUser) {
        // Verificar se a sessão ainda é válida
        if (this._isSessionValid(this.currentUser)) {
          return { ...this.currentUser };
        } else {
          console.warn('⚠️ Sessão expirada, limpando dados');
          this.clearSession();
          return null;
        }
      }

      // Tentar carregar do storage
      const userData = this._loadFromStorage();
      if (userData && this._isSessionValid(userData)) {
        this.currentUser = userData;
        return { ...userData };
      }

      return null;
      
    } catch (error) {
      console.error('💥 Erro ao recuperar sessão:', error);
      return null;
    }
  }

  /**
   * Verifica se o usuário está autenticado
   * @returns {boolean} Status de autenticação
   */
  isAuthenticated() {
    const user = this.getUserSession();
    return user !== null && user.id && user.name;
  }

  /**
   * Atualiza o timestamp de última atividade
   */
  updateLastActivity() {
    if (this.currentUser) {
      this.currentUser.lastActivity = new Date().toISOString();
      
      // Salvar novamente
      const encryptedData = this._encryptData(this.currentUser);
      sessionStorage.setItem(
        UserSessionManager.CONFIG.STORAGE_KEYS.USER_DATA, 
        encryptedData
      );
      
      if (this.currentUser.rememberMe) {
        localStorage.setItem(
          UserSessionManager.CONFIG.STORAGE_KEYS.USER_DATA, 
          encryptedData
        );
      }
    }
  }

  /**
   * Limpa toda a sessão do usuário
   * @returns {boolean} Sucesso da operação
   */
  clearSession() {
    try {
      console.group('🧹 Limpando sessão do usuário');
      
      // Limpar sessionStorage
      Object.values(UserSessionManager.CONFIG.STORAGE_KEYS).forEach(key => {
        sessionStorage.removeItem(key);
      });
      
      // Limpar localStorage relacionado
      Object.values(UserSessionManager.CONFIG.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Limpar estado interno
      this.currentUser = null;
      this.sessionToken = null;
      
      console.log('✅ Sessão limpa com sucesso');
      console.groupEnd();
      
      return true;
      
    } catch (error) {
      console.error('💥 Erro ao limpar sessão:', error);
      console.groupEnd();
      return false;
    }
  }

  /**
   * Obtém estatísticas da sessão atual
   * @returns {Object} Estatísticas da sessão
   */
  getSessionStats() {
    if (!this.currentUser) {
      return null;
    }

    const loginTime = new Date(this.currentUser.loginTime);
    const lastActivity = new Date(this.currentUser.lastActivity);
    const now = new Date();

    return {
      user: {
        name: this.currentUser.name,
        email: this.currentUser.email,
        role: this.currentUser.role
      },
      session: {
        loginTime: loginTime.toLocaleString('pt-BR'),
        lastActivity: lastActivity.toLocaleString('pt-BR'),
        duration: this._formatDuration(now - loginTime),
        isValid: this._isSessionValid(this.currentUser),
        rememberMe: this.currentUser.rememberMe
      },
      storage: {
        sessionStorageUsed: this._getStorageUsage('session'),
        localStorageUsed: this._getStorageUsage('local')
      }
    };
  }

  // =================== MÉTODOS PRIVADOS ===================

  /**
   * Verifica suporte ao Web Storage
   * @private
   */
  _checkStorageSupport() {
    if (typeof Storage === 'undefined') {
      throw new Error('Web Storage não suportado neste navegador');
    }
    
    // Testar funcionalidade
    try {
      const testKey = 'test_storage_support';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
    } catch (error) {
      throw new Error('Storage bloqueado ou indisponível');
    }
  }

  /**
   * Carrega sessão existente do storage
   * @private
   */
  async _loadExistingSession() {
    const userData = this._loadFromStorage();
    if (userData && this._isSessionValid(userData)) {
      this.currentUser = userData;
      this.sessionToken = userData.sessionToken;
      console.log(`🔄 Sessão existente carregada para: ${userData.name}`);
    }
  }

  /**
   * Carrega dados do storage
   * @private
   * @returns {Object|null} Dados do usuário
   */
  _loadFromStorage() {
    try {
      // Tentar sessionStorage primeiro
      let encryptedData = sessionStorage.getItem(
        UserSessionManager.CONFIG.STORAGE_KEYS.USER_DATA
      );
      
      // Se não encontrar, tentar localStorage
      if (!encryptedData) {
        encryptedData = localStorage.getItem(
          UserSessionManager.CONFIG.STORAGE_KEYS.USER_DATA
        );
      }
      
      if (!encryptedData) {
        return null;
      }

      // Descriptografar e parsear
      const userData = this._decryptData(encryptedData);
      return userData;
      
    } catch (error) {
      console.warn('⚠️ Erro ao carregar dados do storage:', error);
      return null;
    }
  }

  /**
   * Valida dados obrigatórios do usuário
   * @private
   * @param {Object} userData - Dados a validar
   * @returns {boolean} Validade dos dados
   */
  _validateUserData(userData) {
    const requiredFields = ['id', 'name', 'email'];
    return requiredFields.every(field => 
      userData[field] && typeof userData[field] === 'string'
    );
  }

  /**
   * Gera token de sessão único
   * @private
   * @returns {string} Token de sessão
   */
  _generateSessionToken() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `session_${timestamp}_${random}`;
  }

  /**
   * Criptografa dados usando btoa (simulação)
   * @private
   * @param {Object} data - Dados a criptografar
   * @returns {string} Dados criptografados
   */
  _encryptData(data) {
    try {
      const jsonString = JSON.stringify(data);
      return btoa(jsonString);
    } catch (error) {
      console.warn('⚠️ Falha na criptografia, salvando sem criptografar');
      return JSON.stringify(data);
    }
  }

  /**
   * Descriptografa dados usando atob (simulação)
   * @private
   * @param {string} encryptedData - Dados criptografados
   * @returns {Object} Dados descriptografados
   */
  _decryptData(encryptedData) {
    try {
      // Tentar descriptografar com atob
      const jsonString = atob(encryptedData);
      return JSON.parse(jsonString);
    } catch (error) {
      // Se falhar, tentar como JSON direto (fallback)
      try {
        return JSON.parse(encryptedData);
      } catch (parseError) {
        throw new Error('Dados corrompidos ou inválidos');
      }
    }
  }

  /**
   * Verifica se a sessão ainda é válida
   * @private
   * @param {Object} userData - Dados do usuário
   * @returns {boolean} Validade da sessão
   */
  _isSessionValid(userData) {
    if (!userData || !userData.loginTime) {
      return false;
    }

    const loginTime = new Date(userData.loginTime);
    const now = new Date();
    const sessionAge = now - loginTime;
    
    return sessionAge < UserSessionManager.CONFIG.SESSION.TIMEOUT;
  }

  /**
   * Configura limpeza automática de sessões expiradas
   * @private
   */
  _setupAutoCleanup() {
    // Verificar a cada 30 minutos
    setInterval(() => {
      if (this.currentUser && !this._isSessionValid(this.currentUser)) {
        console.log('🕐 Sessão expirada automaticamente, limpando...');
        this.clearSession();
      }
    }, UserSessionManager.CONFIG.SESSION.REFRESH_INTERVAL);
  }

  /**
   * Formata duração em formato legível
   * @private
   * @param {number} ms - Milissegundos
   * @returns {string} Duração formatada
   */
  _formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Calcula uso do storage
   * @private
   * @param {string} type - Tipo do storage (session/local)
   * @returns {string} Uso formatado
   */
  _getStorageUsage(type) {
    try {
      const storage = type === 'session' ? sessionStorage : localStorage;
      let totalSize = 0;
      
      for (let key in storage) {
        if (storage.hasOwnProperty(key)) {
          totalSize += storage[key].length;
        }
      }
      
      return `${(totalSize / 1024).toFixed(2)} KB`;
    } catch (error) {
      return 'N/A';
    }
  }
}

// =================== EXPORTS GLOBAIS ===================

// Instância global para facilitar o uso
window.UserSessionManager = UserSessionManager;

// Para debug no console
window.debugSession = function() {
  const manager = window.sessionManager;
  if (manager) {
    console.group('🔍 Debug da Sessão');
    console.table(manager.getSessionStats());
    console.groupEnd();
  } else {
    console.warn('⚠️ SessionManager não inicializado');
  }
};

console.log('📦 UserSessionManager carregado e disponível globalmente');
