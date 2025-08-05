
// validation.js - Sistema de validação avançado
export class Validation {
  static RULES = {
    required: {
      test: (value) => value !== null && value !== undefined && value.toString().trim() !== '',
      message: 'Este campo é obrigatório'
    },
    email: {
      test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Email inválido'
    },
    password: {
      test: (value) => value && value.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value),
      message: 'Senha deve ter pelo menos 8 caracteres, uma maiúscula, uma minúscula e um número'
    },
    passwordSimple: {
      test: (value) => value && value.length >= 6,
      message: 'Senha deve ter pelo menos 6 caracteres'
    },
    minLength: {
      test: (value, min) => value && value.length >= min,
      message: (min) => `Deve ter pelo menos ${min} caracteres`
    },
    maxLength: {
      test: (value, max) => !value || value.length <= max,
      message: (max) => `Deve ter no máximo ${max} caracteres`
    },
    numeric: {
      test: (value) => /^\d+$/.test(value),
      message: 'Deve conter apenas números'
    },
    phone: {
      test: (value) => /^(\+55\s?)?(\(\d{2}\)\s?|\d{2}\s?)?\d{4,5}-?\d{4}$/.test(value),
      message: 'Telefone inválido (ex: (11) 99999-9999)'
    },
    cpf: {
      test: (value) => {
        if (!value) return false;
        const cpf = value.replace(/\D/g, '');
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
        let sum = 0;
        for (let i = 0; i < 9; i++) {
          sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let check1 = (sum * 10) % 11;
        if (check1 === 10) check1 = 0;
        if (check1 !== parseInt(cpf.charAt(9))) return false;
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
  static validate(value, rule, ...args) {
    const r = this.RULES[rule];
    if (!r) return true;
    return r.test(value, ...args);
  }
  static getMessage(rule, ...args) {
    const r = this.RULES[rule];
    if (!r) return '';
    return typeof r.message === 'function' ? r.message(...args) : r.message;
  }
}

// Disponibilizar globalmente
window.Validation = Validation;

console.log('✅ Validation carregado e disponível globalmente');
