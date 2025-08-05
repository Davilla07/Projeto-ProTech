// crypto.utils.js - Utilitários de criptografia e segurança
export class CryptoUtils {
  static #chaveBase = 'UtilityPro2025';
  static criptografar(dados) {
    try {
      const dadosString = typeof dados === 'string' ? dados : JSON.stringify(dados);
      const timestamp = Date.now().toString();
      const payload = `${timestamp}:${dadosString}`;
      let resultado = btoa(payload);
      resultado = btoa(resultado + this.#chaveBase);
      resultado = this.#embaralhar(resultado);
      return resultado;
    } catch (error) {
      console.error('Erro ao criptografar:', error);
      return null;
    }
  }
  static descriptografar(dadosCriptografados) {
    try {
      let resultado = this.#desembaralhar(dadosCriptografados);
      resultado = atob(resultado);
      if (!resultado.endsWith(this.#chaveBase)) throw new Error('Chave inválida');
      resultado = resultado.slice(0, -this.#chaveBase.length);
      resultado = atob(resultado);
      const [timestamp, dados] = resultado.split(':');
      const agora = Date.now();
      const timestampNum = parseInt(timestamp);
      const trintaDias = 30 * 24 * 60 * 60 * 1000;
      if (agora - timestampNum > trintaDias) throw new Error('Token expirado');
      return dados;
    } catch (error) {
      console.error('Erro ao descriptografar:', error);
      return null;
    }
  }
  static #embaralhar(str) {
    return str.split('').reverse().join('');
  }
  static #desembaralhar(str) {
    return str.split('').reverse().join('');
  }
  static gerarIdUnico() {
    return 'id-' + Math.random().toString(36).substr(2, 9);
  }
}

// Disponibilizar globalmente
window.CryptoUtils = CryptoUtils;

console.log('✅ CryptoUtils carregado e disponível globalmente');
