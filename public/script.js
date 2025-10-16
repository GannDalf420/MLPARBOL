class SistemaArbolesUrbanos {
    constructor() {
        this.currentPage = 'dashboard';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboard();
        this.setupNavigation();
    }

    setupEventListeners() {
        // Navegación del sidebar
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.getAttribute('href').substring(1);
                this.navigateTo(page);
            });
        });

        // Botón nuevo registro
        document.getElementById('btn-nuevo').addEventListener('click', () => {
            this.showNewForm();
        });

        // Cerrar modal
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        // Cerrar modal al hacer clic fuera
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') {
                this.closeModal();
            }
        });
    }

    navigateTo(page) {
        this.currentPage = page;
        
        // Actualizar navegación activa
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${page}"]`).classList.add('active');

        // Actualizar título
        const titles = {
            dashboard: 'Dashboard',
            arboles: 'Gestión de Árboles',
            cazuelas: 'Gestión de Cazuelas',
            ubicaciones: 'Gestión de Ubicaciones',
            mantenimientos: 'Historial de Mantenimientos',
            reportes: 'Reportes y Estadísticas'
        };

        document.getElementById('page-title').textContent = titles[page] || 'Sistema de Árboles Urbanos';
        
        // Cargar contenido
        this.loadPage(page);
    }

    async loadPage(page) {
        switch(page) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'arboles':
                await this.loadArboles();
                break;
            case 'cazuelas':
                await this.loadCazuelas();
                break;
            case 'ubicaciones':
                await this.loadUbicaciones();
                break;
            case 'mantenimientos':
                await this.loadMantenimientos();
                break;
            case 'reportes':
                await this.loadReportes();
                break;
        }
    }

    async loadDashboard() {
        try {
            const [arboles, stats, mantenimientos] = await Promise.all([
                this.fetchData('/api/arboles'),
                this.fetchData('/api/arboles/estadisticas/estados'),
                this.fetchData('/api/mantenimientos?limit=5')
            ]);

            const content = `
                <div class="cards-grid">
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <div class="card-value">${arboles.length}</div>
                                <div class="card-label">Total Árboles</div>
                            </div>
                            <div class="card-icon primary">
                                <i class="fas fa-tree"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <div class="card-value">${stats.find(s => s.estado === 'Vivo')?.cantidad || 0}</div>
                                <div class="card-label">Árboles Vivos</div>
                            </div>
                            <div class="card-icon success">
                                <i class="fas fa-leaf"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <div class="card-value">${stats.find(s => s.estado === 'Muerto')?.cantidad || 0}</div>
                                <div class="card-label">Árboles Muertos</div>
                            </div>
                            <div class="card-icon danger">
                                <i class="fas fa-skull-crossbones"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <div class="card-value">${stats.find(s => s.estado === 'Extraído')?.cantidad || 0}</div>
                                <div class="card-label">Árboles Extraídos</div>
                            </div>
                            <div class="card-icon warning">
                                <i class="fas fa-trash"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-sections">
                    <div class="section">
                        <h3>Mantenimientos Recientes</h3>
                        <div class="table-container">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Árbol</th>
                                        <th>Tipo</th>
                                        <th>Responsable</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${mantenimientos.map(m => `
                                        <tr>
                                            <td>${new Date(m.fecha).toLocaleDateString()}</td>
                                            <td>${m.especie}</td>
                                            <td>${m.tipo_mantenimiento}</td>
                                            <td>${m.responsable}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('content').innerHTML = content;
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showError('Error al cargar el dashboard');
        }
    }

    async loadArboles() {
        try {
            const arboles = await this.fetchData('/api/arboles');
            
            const content = `
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Especie</th>
                                <th>Estado</th>
                                <th>Fecha Plantación</th>
                                <th>Ubicación</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${arboles.map(arbol => `
                                <tr>
                                    <td>${arbol.id}</td>
                                    <td>${arbol.especie}</td>
                                    <td><span class="badge ${this.getEstadoBadgeClass(arbol.estado)}">${arbol.estado}</span></td>
                                    <td>${arbol.fecha_plantacion ? new Date(arbol.fecha_plantacion).toLocaleDateString() : 'N/A'}</td>
                                    <td>${arbol.direccion || 'N/A'}</td>
                                    <td>
                                        <button class="btn btn-secondary btn-sm" onclick="sistema.editarArbol(${arbol.id})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-danger btn-sm" onclick="sistema.eliminarArbol(${arbol.id})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById('content').innerHTML = content;
        } catch (error) {
            console.error('Error loading trees:', error);
            this.showError('Error al cargar los árboles');
        }
    }

    getEstadoBadgeClass(estado) {
        const classes = {
            'Vivo': 'badge-success',
            'Muerto': 'badge-danger',
            'Extraído': 'badge-warning'
        };
        return classes[estado] || 'badge-info';
    }

    async showNewForm() {
        const forms = {
            arboles: this.showArbolForm.bind(this),
            cazuelas: this.showCazuelaForm.bind(this),
            ubicaciones: this.showUbicacionForm.bind(this),
            mantenimientos: this.showMantenimientoForm.bind(this)
        };

        if (forms[this.currentPage]) {
            await forms[this.currentPage]();
        }
    }

    async showArbolForm(arbol = null) {
        const cazuelas = await this.fetchData('/api/cazuelas/disponibles');
        
        const form = `
            <form id="arbol-form">
                <div class="form-group">
                    <label class="form-label">Especie *</label>
                    <input type="text" class="form-control" name="especie" value="${arbol?.especie || ''}" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Fecha de Plantación</label>
                    <input type="date" class="form-control" name="fecha_plantacion" value="${arbol?.fecha_plantacion || ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Estado *</label>
                    <select class="form-control" name="estado" required>
                        <option value="Vivo" ${arbol?.estado === 'Vivo' ? 'selected' : ''}>Vivo</option>
                        <option value="Muerto" ${arbol?.estado === 'Muerto' ? 'selected' : ''}>Muerto</option>
                        <option value="Extraído" ${arbol?.estado === 'Extraído' ? 'selected' : ''}>Extraído</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Cazuela</label>
                    <select class="form-control" name="cazuela_id">
                        <option value="">Seleccionar cazuela...</option>
                        ${cazuelas.map(c => `
                            <option value="${c.id}" ${arbol?.cazuela_id === c.id ? 'selected' : ''}>
                                ${c.material} - ${c.tamaño} (${c.direccion})
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">URL de Foto</label>
                    <input type="url" class="form-control" name="foto" value="${arbol?.foto || ''}">
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="sistema.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">
                        ${arbol ? 'Actualizar' : 'Crear'} Árbol
                    </button>
                </div>
            </form>
        `;

        this.showModal(arbol ? 'Editar Árbol' : 'Nuevo Árbol', form);
        
        document.getElementById('arbol-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.guardarArbol(arbol?.id);
        });
    }

    async guardarArbol(id = null) {
        try {
            const formData = new FormData(document.getElementById('arbol-form'));
            const data = {
                especie: formData.get('especie'),
                fecha_plantacion: formData.get('fecha_plantacion'),
                estado: formData.get('estado'),
                foto: formData.get('foto'),
                cazuela_id: formData.get('cazuela_id') || null
            };

            const url = id ? `/api/arboles/${id}` : '/api/arboles';
            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.closeModal();
                this.showSuccess(id ? 'Árbol actualizado exitosamente' : 'Árbol creado exitosamente');
                await this.loadArboles();
            } else {
                const error = await response.json();
                throw new Error(error.error);
            }
        } catch (error) {
            this.showError('Error al guardar el árbol: ' + error.message);
        }
    }

    async eliminarArbol(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este árbol?')) {
            try {
                const response = await fetch(`/api/arboles/${id}`, { method: 'DELETE' });
                
                if (response.ok) {
                    this.showSuccess('Árbol eliminado exitosamente');
                    await this.loadArboles();
                } else {
                    const error = await response.json();
                    throw new Error(error.error);
                }
            } catch (error) {
                this.showError('Error al eliminar el árbol: ' + error.message);
            }
        }
    }

    async editarArbol(id) {
        try {
            const arbol = await this.fetchData(`/api/arboles/${id}`);
            await this.showArbolForm(arbol);
        } catch (error) {
            this.showError('Error al cargar el árbol: ' + error.message);
        }
    }

    // Métodos utilitarios
    async fetchData(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }

    showModal(title, content) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = content;
        document.getElementById('modal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('modal').style.display = 'none';
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        // Implementar notificaciones toast
        alert(`${type === 'success' ? '✅' : '❌'} ${message}`);
    }
}

// Inicializar la aplicación cuando se carga la página
let sistema;
document.addEventListener('DOMContentLoaded', () => {
    sistema = new SistemaArbolesUrbanos();
});
