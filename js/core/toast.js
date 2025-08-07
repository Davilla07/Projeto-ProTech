
/**
 * Toast.js - Sistema de notificações flutuantes profissional
 * 
 * @description Sistema de notificações toast com suporte a acessibilidade
 * e múltiplos tipos de mensagem. Utiliza injeção dinâmica de estilos inline
 * para evitar dependências de CSS externo.
 * 
 * @author ProTech Development Team
 * @version 1.0.0
 * @since 2025-08-06
 */
import { CryptoUtils } from './crypto.utils.js';

/**
 * Sistema de Toast - Notificações não intrusivas
 * Exportado como objeto singleton para uso global
 * 
 * @namespace Toast
 */
export const Toast = {
  /**
   * Exibe notificação de sucesso
   * @param {string} mensagem - Texto da notificação
   * @param {Object} opcoes - Opções de configuração
   * @param {number} opcoes.duration - Duração em ms (padrão: 4000)
   */
  sucesso(mensagem, opcoes = {}) {
    this.mostrar(mensagem, 'sucesso', opcoes);
  },

  /**
   * Exibe notificação de erro
   * @param {string} mensagem - Texto da notificação
   * @param {Object} opcoes - Opções de configuração
   */
  erro(mensagem, opcoes = {}) {
    this.mostrar(mensagem, 'erro', opcoes);
  },

  /**
   * Exibe notificação de aviso
   * @param {string} mensagem - Texto da notificação
   * @param {Object} opcoes - Opções de configuração
   */
  aviso(mensagem, opcoes = {}) {
    this.mostrar(mensagem, 'aviso', opcoes);
  },

  /**
   * Exibe notificação informativa
   * @param {string} mensagem - Texto da notificação
   * @param {Object} opcoes - Opções de configuração
   */
  info(mensagem, opcoes = {}) {
    this.mostrar(mensagem, 'info', opcoes);
  },

  /**
   * Método principal para exibição de toasts
   * Cria dinamicamente o container e aplica estilos inline para independência de CSS
   * 
   * @param {string} mensagem - Conteúdo da notificação
   * @param {string} tipo - Tipo da notificação (sucesso|erro|aviso|info)
   * @param {Object} opcoes - Configurações adicionais
   * @param {number} opcoes.duration - Tempo de exibição em milissegundos
   */
  mostrar(mensagem, tipo = 'info', opcoes = {}) {
    // Gerar ID único para tracking e debug
    const id = CryptoUtils.gerarIdUnico();
    
    // Garantir existência do container global de toasts
    let container = document.getElementById('toast-container');
    if (!container) {
      container = this._criarContainer();
    }

    // Criar elemento toast com estilos inline
    const toast = this._criarElementoToast(mensagem, tipo, id);
    
    // Adicionar ao DOM e configurar auto-remoção
    container.appendChild(toast);
    
    // Auto-remoção após duração especificada
    const duracao = opcoes.duration || 4000;
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, duracao);
  },

  /**
   * Cria o container principal de toasts
   * Posicionamento fixo no canto superior direito
   * 
   * @private
   * @returns {HTMLElement} Container criado
   */
  _criarContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999;
      max-width: 400px;
    `;
    document.body.appendChild(container);
    return container;
  },

  /**
   * Cria elemento individual de toast
   * Aplica cores baseadas no tipo e configurações de acessibilidade
   * 
   * @private
   * @param {string} mensagem - Texto da notificação
   * @param {string} tipo - Tipo da notificação
   * @param {string} id - ID único do toast
   * @returns {HTMLElement} Elemento toast criado
   */
  _criarElementoToast(mensagem, tipo, id) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.id = `toast-${id}`;
    toast.innerText = mensagem;
    
    // Definir cores baseadas no tipo
    const cores = {
      erro: '#ef4444',      // Vermelho
      sucesso: '#22c55e',   // Verde
      aviso: '#f59e0b',     // Amarelo
      info: '#2563eb'       // Azul
    };

    // Aplicar estilos inline para independência de CSS
    toast.style.cssText = `
      background: ${cores[tipo] || cores.info};
      color: #fff;
      padding: 12px 24px;
      margin-bottom: 8px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      word-wrap: break-word;
      animation: slideInRight 0.3s ease-out;
    `;
    
    // Configurações de acessibilidade ARIA
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    return toast;
  }
};

// Disponibilizar globalmente para compatibilidade com código legado
// TODO: Migrar para sistema de módulos ES6 em toda a aplicação
window.Toast = Toast;

// Aliases em inglês para compatibilidade internacional
// Mantém retrocompatibilidade com código existente
Toast.success = Toast.sucesso;
Toast.error = Toast.erro;
Toast.warning = Toast.aviso;
Toast.info = Toast.info;

console.log('✅ Toast carregado e disponível globalmente');
