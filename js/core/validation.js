
/**
 * Validation.js - Sistema de validação avançado
 * 
 * @description Sistema robusto de validação de dados com regras predefinidas
 * para campos comuns em aplicações brasileiras. Inclui validação de CPF,
 * telefone, email e outras validações customizáveis.
 * 
 * @author ProTech Development Team
 * @version 1.0.0
 * @since 2025-08-06
 */
export class Validation {
  /**
   * Conjunto de regras de validação predefinidas
   * Cada regra contém uma função de teste e uma mensagem de erro
   * 
   * @static
   * @readonly
   * @type {Object}
   */
  static RULES = {
    /**
     * Validação de campo obrigatório
     * Verifica se o valor não é nulo, undefined ou string vazia
     */
    required: {
      test: (value) => value !== null && value !== undefined && value.toString().trim() !== '',
      message: 'Este campo é obrigatório'
    },

    /**
     * Validação de email usando regex RFC-compliant simplificado
     * Aceita formatos básicos de email válidos
     */
    email: {
      test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Email inválido'
    },

    /**
     * Validação de senha forte
     * Exige: mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número
     */
    password: {
      test: (value) => value && value.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value),
      message: 'Senha deve ter pelo menos 8 caracteres, uma maiúscula, uma minúscula e um número'
    },

    /**
     * Validação de senha simples para contextos menos críticos
     * Exige apenas mínimo de 6 caracteres
     */
    passwordSimple: {
      test: (value) => value && value.length >= 6,
      message: 'Senha deve ter pelo menos 6 caracteres'
    },

    /**
     * Validação de comprimento mínimo dinâmico
     * @param {string} value - Valor a ser validado
     * @param {number} min - Comprimento mínimo exigido
     */
    minLength: {
      test: (value, min) => value && value.length >= min,
      message: (min) => `Deve ter pelo menos ${min} caracteres`
    },

    /**
     * Validação de comprimento máximo dinâmico
     * @param {string} value - Valor a ser validado
     * @param {number} max - Comprimento máximo permitido
     */
    maxLength: {
      test: (value, max) => !value || value.length <= max,
      message: (max) => `Deve ter no máximo ${max} caracteres`
    },

    /**
     * Validação numérica - apenas dígitos
     * Útil para códigos, IDs, etc.
     */
    numeric: {
      test: (value) => /^\d+$/.test(value),
      message: 'Deve conter apenas números'
    },

    /**
     * Validação de telefone brasileiro
     * Aceita formatos: (11) 99999-9999, 11999999999, +55 11 99999-9999
     */
    phone: {
      test: (value) => /^(\+55\s?)?(\(\d{2}\)\s?|\d{2}\s?)?\d{4,5}-?\d{4}$/.test(value),
      message: 'Telefone inválido (ex: (11) 99999-9999)'
    },

    /**
     * Validação de CPF brasileiro com algoritmo oficial
     * Implementa verificação completa dos dígitos verificadores
     * Remove formatação automaticamente para validação
     */
    cpf: {
      test: (value) => {
        if (!value) return false;
        
        // Remover formatação (pontos e hífens)
        const cpf = value.replace(/\D/g, '');
        
        // Verificar se tem 11 dígitos e não é sequência repetida
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
        
        // Calcular primeiro dígito verificador
        let sum = 0;
        for (let i = 0; i < 9; i++) {
          sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let check1 = (sum * 10) % 11;
        if (check1 === 10) check1 = 0;
        if (check1 !== parseInt(cpf.charAt(9))) return false;
        
        // Calcular segundo dígito verificador
        sum = 0;
        for (let i = 0; i < 10; i++) {
          sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        let check2 = (sum * 10) % 11;
        if (check2 === 10) check2 = 0;
        
        return check2 === parseInt(cpf.charAt(10));
      },
      message: 'CPF inválido'
    }
  };

  /**
   * Executa validação de um valor contra uma regra específica
   * 
   * @param {any} value - Valor a ser validado
   * @param {string} rule - Nome da regra de validação
   * @param {...any} args - Argumentos adicionais para regras dinâmicas
   * @returns {boolean} True se válido, false se inválido
   * 
   * @example
   * const isValid = Validation.validate('test@email.com', 'email');
   * const hasMinLength = Validation.validate('password123', 'minLength', 8);
   */
  static validate(value, rule, ...args) {
    const ruleObj = this.RULES[rule];
    if (!ruleObj) {
      console.warn(`⚠️ Regra de validação '${rule}' não encontrada`);
      return true; // Assumir válido se regra não existe
    }
    return ruleObj.test(value, ...args);
  }

  /**
   * Obtém mensagem de erro para uma regra específica
   * 
   * @param {string} rule - Nome da regra de validação
   * @param {...any} args - Argumentos para mensagens dinâmicas
   * @returns {string} Mensagem de erro localizada
   * 
   * @example
   * const errorMsg = Validation.getMessage('minLength', 8);
   * // Retorna: "Deve ter pelo menos 8 caracteres"
   */
  static getMessage(rule, ...args) {
    const ruleObj = this.RULES[rule];
    if (!ruleObj) return '';
    
    return typeof ruleObj.message === 'function' 
      ? ruleObj.message(...args) 
      : ruleObj.message;
  }

  /**
   * Valida múltiplas regras em um único valor
   * Útil para campos com múltiplas validações
   * 
   * @param {any} value - Valor a ser validado
   * @param {Array<string|Object>} rules - Array de regras ou objetos de regra
   * @returns {Object} Resultado da validação com status e erros
   * 
   * @example
   * const result = Validation.validateMultiple('test@email.com', [
   *   'required',
   *   'email',
   *   {rule: 'maxLength', args: [50]}
   * ]);
   */
  static validateMultiple(value, rules) {
    const errors = [];
    let isValid = true;

    for (const rule of rules) {
      let ruleName, args = [];
      
      if (typeof rule === 'string') {
        ruleName = rule;
      } else if (typeof rule === 'object') {
        ruleName = rule.rule;
        args = rule.args || [];
      }

      if (!this.validate(value, ruleName, ...args)) {
        isValid = false;
        errors.push(this.getMessage(ruleName, ...args));
      }
    }

    return {
      isValid,
      errors,
      firstError: errors[0] || null
    };
  }
}

// Disponibilizar globalmente para compatibilidade com código legado
// TODO: Migrar para sistema de módulos ES6 em toda a aplicação
window.Validation = Validation;

console.log('✅ Validation carregado e disponível globalmente');
