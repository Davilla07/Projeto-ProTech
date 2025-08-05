
// toast.js - Sistema de notificações flutuantes profissional
import { CryptoUtils } from './crypto.utils.js';

export const Toast = {
  sucesso(mensagem, opcoes = {}) {
    this.mostrar(mensagem, 'sucesso', opcoes);
  },
  erro(mensagem, opcoes = {}) {
    this.mostrar(mensagem, 'erro', opcoes);
  },
  aviso(mensagem, opcoes = {}) {
    this.mostrar(mensagem, 'aviso', opcoes);
  },
  info(mensagem, opcoes = {}) {
    this.mostrar(mensagem, 'info', opcoes);
  },
  mostrar(mensagem, tipo = 'info', opcoes = {}) {
    // Implementação simplificada para exibir toast
    const id = CryptoUtils.gerarIdUnico();
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.position = 'fixed';
      container.style.top = '24px';
      container.style.right = '24px';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.innerText = mensagem;
    toast.style.background = tipo === 'erro' ? '#ef4444' : tipo === 'sucesso' ? '#22c55e' : '#2563eb';
    toast.style.color = '#fff';
    toast.style.padding = '12px 24px';
    toast.style.marginBottom = '8px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    container.appendChild(toast);
    setTimeout(() => toast.remove(), opcoes.duration || 4000);
  }
};

// Disponibilizar globalmente
window.Toast = Toast;

// Aliases para compatibilidade
Toast.success = Toast.sucesso;
Toast.error = Toast.erro;
Toast.warning = Toast.aviso;
Toast.info = Toast.info;

console.log('✅ Toast carregado e disponível globalmente');
