class SistemaAuth {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.init();
    }

    init() {
        this.updateUI();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    async login() {
        const formData = new FormData(document.getElementById('login-form'));
        const credentials = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                
                localStorage.setItem('authToken', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                
                this.updateUI();
                this.closeLoginModal();
                this.showNotification('¡Bienvenido ' + this.user.nombre + '!', 'success');
                
                // Recargar la página actual
                if (window.sistema && window.sistema.currentPage) {
                    window.sistema.loadPage(window.sistema.currentPage);
                }
            } else {
                this.showNotification('Error: ' + data.error, 'error');
            }
        } catch (error) {
            this.showNotification('Error de conexión', 'error');
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        this.updateUI();
        this.showNotification('Sesión cerrada', 'success');
        
        // Recargar la página
        if (window.sistema && window.sistema.currentPage) {
            window.sistema.loadPage(window.sistema.currentPage);
        }
    }

    updateUI() {
        const userInfo = document.getElementById('user-info');
        const loginItem = document.getElementById('login-item');
        const logoutItem = document.getElementById('logout-item');

        if (this.user) {
            // Usuario logueado
            if (userInfo) {
                userInfo.style.display = 'block';
                document.getElementById('user-name').textContent = this.user.nombre;
                document.getElementById('user-role').textContent = this.user.rol;
            }
            if (loginItem) loginItem.style.display = 'none';
            if (logoutItem) logoutItem.style.display = 'block';
        } else {
            // Usuario no logueado
            if (userInfo) userInfo.style.display = 'none';
            if (loginItem) loginItem.style.display = 'block';
            if (logoutItem) logoutItem.style.display = 'none';
        }
    }

    isAuthenticated() {
        return !!this.token;
    }

    isAdmin() {
        return this.user && this.user.rol === 'admin';
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    showLoginModal() {
        document.getElementById('login-modal').style.display = 'block';
    }

    closeLoginModal() {
        document.getElementById('login-modal').style.display = 'none';
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }
}
