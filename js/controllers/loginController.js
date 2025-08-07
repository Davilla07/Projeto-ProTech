
// loginController.js - Controller para autenticação e interface de login
import { AuthService } from '../services/index.js';
import { Toast } from '../core/index.js';

class LoginController {
  constructor() {
    document.addEventListener('DOMContentLoaded', () => {
      this.initLoginForm();
    });
  }

  initLoginForm() {
    // Suporta formLogin ou loginForm
    const form = document.getElementById('formLogin') || document.getElementById('loginForm');
    const btnEntrar = document.getElementById('btnEntrar');
    if (!form) return;

    // Suporte submit e botão
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin(form);
    });
    if (btnEntrar) {
      btnEntrar.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.handleLogin(form);
      });
    }
  }

  async handleLogin(form) {
    const email = form.email?.value?.trim() || document.getElementById('email')?.value?.trim();
    const senha = form.senha?.value || document.getElementById('password')?.value;
    const lembrar = form.lembrar?.checked || false;
    try {
      await AuthService.processarLogin(email, senha, lembrar);
      Toast.success('Login realizado!');
      AuthService.redirecionarParaBoasVindas();
    } catch (err) {
      Toast.error(err.message || 'Erro ao autenticar');
    }
  }
}

const loginController = new LoginController();
export default loginController;
