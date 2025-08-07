/**
 * CryptoUtils.js - Utilitários de criptografia e segurança
 * 
 * @description Classe utilitária para criptografia simétrica baseada em Base64
 * com validação de timestamp e embaralhamento básico. Utilizada para proteger
 * dados sensíveis em localStorage e comunicação cliente-servidor.
 * 
 * @warning Esta implementação é adequada para proteção básica, não para dados críticos
 * @author ProTech Development Team
 * @version 1.0.0
 * @since 2025-08-06
 */
export class CryptoUtils {
  /**
   * Chave base privada para validação de integridade
   * Utilizada como sufixo para verificar se os dados foram manipulados
   * 
   * @private
   * @static
   * @type {string}
   */
  static #chaveBase = 'UtilityPro2025';

  /**
   * Criptografa dados utilizando Base64 duplo com timestamp
   * Adiciona timestamp para expiração automática e embaralhamento para ofuscação
   * 
   * @param {string|Object} dados - Dados a serem criptografados
   * @returns {string|null} Dados criptografados ou null em caso de erro
   * 
   * @example
   * const encrypted = CryptoUtils.criptografar({user: 'admin', role: 'admin'});
   */
  static criptografar(dados) {
    try {
      // Normalizar entrada para string
      const dadosString = typeof dados === 'string' ? dados : JSON.stringify(dados);
      
      // Adicionar timestamp para controle de expiração
      const timestamp = Date.now().toString();
      const payload = `${timestamp}:${dadosString}`;
      
      // Aplicar dupla codificação Base64 com chave de validação
      let resultado = btoa(payload);
      resultado = btoa(resultado + this.#chaveBase);
      
      // Embaralhar resultado para ofuscação adicional
      resultado = this.#embaralhar(resultado);
      
      return resultado;
    } catch (error) {
      console.error('❌ Erro ao criptografar dados:', error);
      return null;
    }
  }

  /**
   * Descriptografa dados e valida timestamp de expiração
   * Verifica integridade através da chave base e expira tokens antigos
   * 
   * @param {string} dadosCriptografados - String criptografada a ser decodificada
   * @returns {string|null} Dados originais ou null se inválido/expirado
   * 
   * @example
   * const decrypted = CryptoUtils.descriptografar(encryptedToken);
   */
  static descriptografar(dadosCriptografados) {
    try {
      // Reverter embaralhamento
      let resultado = this.#desembaralhar(dadosCriptografados);
      
      // Primeira decodificação Base64
      resultado = atob(resultado);
      
      // Validar chave de integridade
      if (!resultado.endsWith(this.#chaveBase)) {
        throw new Error('Chave de validação inválida - dados podem ter sido alterados');
      }
      
      // Remover chave de validação
      resultado = resultado.slice(0, -this.#chaveBase.length);
      
      // Segunda decodificação Base64
      resultado = atob(resultado);
      
      // Extrair timestamp e dados
      const [timestamp, dados] = resultado.split(':');
      
      // Validar expiração (30 dias)
      const agora = Date.now();
      const timestampNum = parseInt(timestamp);
      const trintaDias = 30 * 24 * 60 * 60 * 1000; // 30 dias em ms
      
      if (agora - timestampNum > trintaDias) {
        throw new Error('Token expirado - dados muito antigos');
      }
      
      return dados;
    } catch (error) {
      console.error('❌ Erro ao descriptografar dados:', error);
      return null;
    }
  }

  /**
   * Embaralha string invertendo caracteres
   * Método simples de ofuscação para dificultar análise visual
   * 
   * @private
   * @param {string} str - String a ser embaralhada
   * @returns {string} String embaralhada
   */
  static #embaralhar(str) {
    return str.split('').reverse().join('');
  }

  /**
   * Desembaralha string revertendo o processo de embaralhamento
   * 
   * @private
   * @param {string} str - String embaralhada
   * @returns {string} String original
   */
  static #desembaralhar(str) {
    return str.split('').reverse().join('');
  }

  /**
   * Gera identificador único alfanumérico
   * Utilizado para tracking, session IDs e elementos únicos
   * 
   * @returns {string} ID único no formato 'id-xxxxxxxxx'
   * 
   * @example
   * const uniqueId = CryptoUtils.gerarIdUnico(); // 'id-abc123def'
   */
  static gerarIdUnico() {
    const randomPart = Math.random().toString(36).substr(2, 9);
    return `id-${randomPart}`;
  }
}

// Disponibilizar globalmente para compatibilidade com código legado
// TODO: Migrar para sistema de módulos ES6 em toda a aplicação
window.CryptoUtils = CryptoUtils;

console.log('✅ CryptoUtils carregado e disponível globalmente');
