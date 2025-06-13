/**
 * Módulo para gerenciamento de autenticação
 */
export class AuthManager {
    constructor() {
        this.user = null;
        this.authRequired = false;
        this.authenticated = false;
        this.sessionId = this.generateSessionId();
    }

    generateSessionId() {
        // Gerar ID único para esta sessão/usuário
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return `user_${timestamp}_${random}`;
    }

    async init() {
        try {
            await this.checkAuthStatus();
            this.setupEventListeners();
            this.updateUI();
        } catch (error) {
            console.error('Erro ao inicializar autenticação:', error);
        }
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/auth/status');
            const data = await response.json();
            
            this.authRequired = data.authRequired;
            this.authenticated = data.authenticated;
            this.user = data.user;

            // Se autenticação é obrigatória mas não está autenticado
            if (this.authRequired && !this.authenticated) {
                window.location.href = '/login';
                return;
            }

            return data;
        } catch (error) {
            console.error('Erro ao verificar status de autenticação:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Botão de logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Interceptar requisições para verificar autenticação
        this.interceptFetchRequests();
    }

    updateUI() {
        const userInfo = document.getElementById('userInfo');
        
        if (!this.authRequired || !this.authenticated || !this.user) {
            // Mostrar modo developer quando autenticação está desabilitada
            if (userInfo) {
                userInfo.style.display = 'flex';
                userInfo.classList.add('developer-mode');
                
                const avatar = document.getElementById('userAvatar');
                const name = document.getElementById('userName');
                const email = document.getElementById('userEmail');
                const logoutBtn = document.getElementById('logoutBtn');
                
                if (avatar) {
                    avatar.src = '/assets/manati_logo_v2.png';
                    avatar.alt = 'Modo Developer';
                }
                
                if (name) {
                    name.textContent = 'Modo Developer';
                    name.title = 'Autenticação desabilitada para desenvolvimento';
                }
                
                if (email) {
                    email.textContent = 'AUTH_ENABLED=false';
                    email.title = 'Configuração no arquivo .env';
                }
                
                // Ocultar botão de logout no modo developer
                if (logoutBtn) {
                    logoutBtn.style.display = 'none';
                }
            }
            return;
        }

        // Mostrar informações do usuário autenticado
        if (userInfo) {
            userInfo.style.display = 'flex';
            userInfo.classList.remove('developer-mode');
            
            const avatar = document.getElementById('userAvatar');
            const name = document.getElementById('userName');
            const email = document.getElementById('userEmail');
            const logoutBtn = document.getElementById('logoutBtn');
            
            if (avatar) {
                avatar.src = this.user.avatar || '/assets/manati_logo_v2.png';
                avatar.alt = `Avatar de ${this.user.displayName}`;
            }
            
            if (name) {
                name.textContent = this.user.displayName || this.user.username;
                name.title = this.user.displayName || this.user.username;
            }
            
            if (email) {
                email.textContent = this.user.email;
                email.title = this.user.email;
            }
            
            // Mostrar botão de logout quando autenticado
            if (logoutBtn) {
                logoutBtn.style.display = 'flex';
            }
        }
    }

    async logout() {
        try {
            const confirmed = await window.manatiEditor?.ui?.showConfirm(
                'Confirmar Logout',
                'Tem certeza que deseja sair do sistema?',
                'Sair',
                'Cancelar'
            );

            if (!confirmed) return;

            // Mostrar loading
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div>';
                logoutBtn.disabled = true;
            }

            const response = await fetch('/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Redirecionar para login
                window.location.href = '/login';
            } else {
                throw new Error('Erro no logout');
            }
        } catch (error) {
            console.error('Erro no logout:', error);
            
            // Restaurar botão
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.innerHTML = '<i class="bi bi-box-arrow-right"></i>';
                logoutBtn.disabled = false;
            }

            if (window.manatiEditor?.ui?.showToast) {
                window.manatiEditor.ui.showToast('Erro ao fazer logout', 'error');
            } else {
                alert('Erro ao fazer logout');
            }
        }
    }

    interceptFetchRequests() {
        // Salvar fetch original
        const originalFetch = window.fetch;
        
        // Substituir fetch para interceptar respostas 401
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                
                // Se receber 401 e autenticação é obrigatória, redirecionar
                if (response.status === 401 && this.authRequired) {
                    const data = await response.json().catch(() => ({}));
                    if (data.redirectTo) {
                        window.location.href = data.redirectTo;
                    } else {
                        window.location.href = '/login';
                    }
                    return response;
                }
                
                return response;
            } catch (error) {
                throw error;
            }
        };
    }

    getUser() {
        return this.user;
    }

    isAuthenticated() {
        return this.authenticated;
    }

    isAuthRequired() {
        return this.authRequired;
    }

    getUserId() {
        // Retorna ID do usuário autenticado ou ID da sessão
        if (this.authenticated && this.user && this.user.id) {
            return this.user.id;
        }
        return this.sessionId;
    }

    getUserName() {
        // Retorna nome do usuário autenticado ou nome da sessão
        if (this.authenticated && this.user) {
            return this.user.displayName || this.user.username || 'Usuário';
        }
        return 'Developer Mode';
    }

    getUserInfo() {
        return {
            id: this.getUserId(),
            name: this.getUserName(),
            authenticated: this.authenticated,
            sessionId: this.sessionId
        };
    }
}
