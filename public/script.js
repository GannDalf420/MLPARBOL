class SistemaArbolesUrbanos {
    constructor() {
        this.currentPage = 'dashboard';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.loadDashboard();
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

    setupNavigation() {
        // Navegación ya está configurada en setupEventListeners
        console.log('Navegación configurada');
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
            default:
                await this.loadDashboard();
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
                                            <td>${m.tipo_mantenimiento || 'N/A'}</td>
                                            <td>${m.responsable}</td>
                                        </tr>
                                    `).join('')}
                                    ${mantenimientos.length === 0 ? '<tr><td colspan="4" style="text-align: center;">No hay mantenimientos registrados</td></tr>' : ''}
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
                <div class="table-header">
                    <h3>Lista de Árboles</h3>
                    <p>Gestiona todos los árboles registrados en el sistema</p>
                </div>
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
                                            <i class="fas fa-edit"></i> Editar
                                        </button>
                                        <button class="btn btn-danger btn-sm" onclick="sistema.eliminarArbol(${arbol.id})">
                                            <i class="fas fa-trash"></i> Eliminar
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                            ${arboles.length === 0 ? '<tr><td colspan="6" style="text-align: center;">No hay árboles registrados</td></tr>' : ''}
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

    async loadCazuelas() {
        try {
            const cazuelas = await this.fetchData('/api/cazuelas');
            
            const content = `
                <div class="table-header">
                    <h3>Lista de Cazuelas</h3>
                    <p>Gestiona todas las cazuelas/macetas registradas</p>
                </div>
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Material</th>
                                <th>Tamaño</th>
                                <th>Estado</th>
                                <th>Ubicación</th>
                                <th>Árboles Asignados</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${cazuelas.map(cazuela => `
                                <tr>
                                    <td>${cazuela.id}</td>
                                    <td>${cazuela.material}</td>
                                    <td>${cazuela.tamaño}</td>
                                    <td><span class="badge ${this.getEstadoBadgeClass(cazuela.estado)}">${cazuela.estado}</span></td>
                                    <td>${cazuela.direccion || 'N/A'}</td>
                                    <td>${cazuela.arboles_asignados || 0}</td>
                                    <td>
                                        <button class="btn btn-secondary btn-sm" onclick="sistema.editarCazuela(${cazuela.id})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-danger btn-sm" onclick="sistema.eliminarCazuela(${cazuela.id})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                            ${cazuelas.length === 0 ? '<tr><td colspan="7" style="text-align: center;">No hay cazuelas registradas</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById('content').innerHTML = content;
        } catch (error) {
            console.error('Error loading cazuelas:', error);
            this.showError('Error al cargar las cazuelas');
        }
    }

    async loadUbicaciones() {
        try {
            const ubicaciones = await this.fetchData('/api/ubicaciones');
            
            const content = `
                <div class="table-header">
                    <h3>Lista de Ubicaciones</h3>
                    <p>Gestiona todas las ubicaciones registradas</p>
                </div>
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Dirección</th>
                                <th>Barrio</th>
                                <th>Coordenadas</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ubicaciones.map(ubicacion => `
                                <tr>
                                    <td>${ubicacion.id}</td>
                                    <td>${ubicacion.direccion}</td>
                                    <td>${ubicacion.barrio}</td>
                                    <td>${ubicacion.coordenadas || 'N/A'}</td>
                                    <td>
                                        <button class="btn btn-secondary btn-sm" onclick="sistema.editarUbicacion(${ubicacion.id})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-danger btn-sm" onclick="sistema.eliminarUbicacion(${ubicacion.id})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                            ${ubicaciones.length === 0 ? '<tr><td colspan="5" style="text-align: center;">No hay ubicaciones registradas</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById('content').innerHTML = content;
        } catch (error) {
            console.error('Error loading ubicaciones:', error);
            this.showError('Error al cargar las ubicaciones');
        }
    }

    async loadMantenimientos() {
        try {
            const mantenimientos = await this.fetchData('/api/mantenimientos');
            
            const content = `
                <div class="table-header">
                    <h3>Historial de Mantenimientos</h3>
                    <p>Registro completo de todos los mantenimientos realizados</p>
                </div>
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Fecha</th>
                                <th>Árbol</th>
                                <th>Tipo Mantenimiento</th>
                                <th>Responsable</th>
                                <th>Costo</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${mantenimientos.map(mantenimiento => `
                                <tr>
                                    <td>${mantenimiento.id}</td>
                                    <td>${new Date(mantenimiento.fecha).toLocaleDateString()}</td>
                                    <td>${mantenimiento.especie || 'N/A'}</td>
                                    <td>${mantenimiento.tipo_mantenimiento || 'N/A'}</td>
                                    <td>${mantenimiento.responsable}</td>
                                    <td>${mantenimiento.costo ? `$${mantenimiento.costo}` : 'N/A'}</td>
                                    <td>
                                        <button class="btn btn-secondary btn-sm" onclick="sistema.editarMantenimiento(${mantenimiento.id})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-danger btn-sm" onclick="sistema.eliminarMantenimiento(${mantenimiento.id})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                            ${mantenimientos.length === 0 ? '<tr><td colspan="7" style="text-align: center;">No hay mantenimientos registrados</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById('content').innerHTML = content;
        } catch (error) {
            console.error('Error loading mantenimientos:', error);
            this.showError('Error al cargar los mantenimientos');
        }
    }

    async loadReportes() {
        try {
            const [stats, catalogos] = await Promise.all([
                this.fetchData('/api/arboles/estadisticas/estados'),
                this.fetchData('/api/catalogos')
            ]);

            const content = `
                <div class="cards-grid">
                    <div class="card">
                        <div class="card-header">
                            <h4>Estadísticas de Árboles</h4>
                        </div>
                        <div class="card-body">
                            ${stats.map(stat => `
                                <div class="stat-item">
                                    <span class="stat-label">${stat.estado}:</span>
                                    <span class="stat-value">${stat.cantidad} (${stat.porcentaje}%)</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h4>Tipos de Mantenimiento</h4>
                        </div>
                        <div class="card-body">
                            ${catalogos.tiposMantenimiento.map(tipo => `
                                <div class="stat-item">
                                    <span class="stat-label">${tipo.nombre}:</span>
                                    <span class="stat-value">${tipo.frecuencia_recomendada_dias || 'N/A'} días</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="report-section">
                    <h3>Reportes del Sistema</h3>
                    <p>Esta sección mostrará reportes avanzados y gráficos en futuras versiones.</p>
                </div>
            `;

            document.getElementById('content').innerHTML = content;
        } catch (error) {
            console.error('Error loading reportes:', error);
            this.showError('Error al cargar los reportes');
        }
    }

    getEstadoBadgeClass(estado) {
        const classes = {
            'Vivo': 'badge-success',
            'Muerto': 'badge-danger',
            'Extraído': 'badge-warning',
            'Bueno': 'badge-success',
            'Regular': 'badge-warning',
            'Malo': 'badge-danger'
        };
        return classes[estado] || 'badge-info';
    }

    async showNewForm() {
        const forms = {
            arboles: () => this.showArbolForm(),
            cazuelas: () => this.showCazuelaForm(),
            ubicaciones: () => this.showUbicacionForm(),
            mantenimientos: () => this.showMantenimientoForm()
        };

        if (forms[this.currentPage]) {
            await forms[this.currentPage]();
        } else {
            this.showError('Función no disponible para esta página');
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
                    <input type="url" class="form-control" name="foto" value="${arbol?.foto || ''}" placeholder="https://ejemplo.com/foto.jpg">
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

    async showCazuelaForm(cazuela = null) {
        const ubicaciones = await this.fetchData('/api/ubicaciones');
        
        const form = `
            <form id="cazuela-form">
                <div class="form-group">
                    <label class="form-label">Material *</label>
                    <input type="text" class="form-control" name="material" value="${cazuela?.material || ''}" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Tamaño *</label>
                    <input type="text" class="form-control" name="tamaño" value="${cazuela?.tamaño || ''}" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Estado *</label>
                    <select class="form-control" name="estado" required>
                        <option value="Bueno" ${cazuela?.estado === 'Bueno' ? 'selected' : ''}>Bueno</option>
                        <option value="Regular" ${cazuela?.estado === 'Regular' ? 'selected' : ''}>Regular</option>
                        <option value="Malo" ${cazuela?.estado === 'Malo' ? 'selected' : ''}>Malo</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Fecha de Instalación</label>
                    <input type="date" class="form-control" name="fecha_instalacion" value="${cazuela?.fecha_instalacion || ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Ubicación</label>
                    <select class="form-control" name="ubicacion_id">
                        <option value="">Seleccionar ubicación...</option>
                        ${ubicaciones.map(u => `
                            <option value="${u.id}" ${cazuela?.ubicacion_id === u.id ? 'selected' : ''}>
                                ${u.direccion} - ${u.barrio}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="sistema.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">
                        ${cazuela ? 'Actualizar' : 'Crear'} Cazuela
                    </button>
                </div>
            </form>
        `;

        this.showModal(cazuela ? 'Editar Cazuela' : 'Nueva Cazuela', form);
        
        document.getElementById('cazuela-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.guardarCazuela(cazuela?.id);
        });
    }

    async showUbicacionForm(ubicacion = null) {
        const form = `
            <form id="ubicacion-form">
                <div class="form-group">
                    <label class="form-label">Dirección *</label>
                    <input type="text" class="form-control" name="direccion" value="${ubicacion?.direccion || ''}" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Barrio *</label>
                    <input type="text" class="form-control" name="barrio" value="${ubicacion?.barrio || ''}" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Coordenadas (opcional)</label>
                    <input type="text" class="form-control" name="coordenadas" value="${ubicacion?.coordenadas || ''}" placeholder="Ej: -34.6037, -58.3816">
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="sistema.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">
                        ${ubicacion ? 'Actualizar' : 'Crear'} Ubicación
                    </button>
                </div>
            </form>
        `;

        this.showModal(ubicacion ? 'Editar Ubicación' : 'Nueva Ubicación', form);
        
        document.getElementById('ubicacion-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.guardarUbicacion(ubicacion?.id);
        });
    }

    async showMantenimientoForm(mantenimiento = null) {
        const [arboles, catalogos] = await Promise.all([
            this.fetchData('/api/arboles'),
            this.fetchData('/api/catalogos')
        ]);
        
        const form = `
            <form id="mantenimiento-form">
                <div class="form-group">
                    <label class="form-label">Árbol *</label>
                    <select class="form-control" name="arbol_id" required>
                        <option value="">Seleccionar árbol...</option>
                        ${arboles.map(a => `
                            <option value="${a.id}" ${mantenimiento?.arbol_id === a.id ? 'selected' : ''}>
                                ${a.especie} - ${a.direccion || 'N/A'}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Tipo de Mantenimiento</label>
                    <select class="form-control" name="tipo_mantenimiento_id">
                        <option value="">Seleccionar tipo...</option>
                        ${catalogos.tiposMantenimiento.map(tipo => `
                            <option value="${tipo.id}" ${mantenimiento?.tipo_mantenimiento_id === tipo.id ? 'selected' : ''}>
                                ${tipo.nombre}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Fecha *</label>
                    <input type="date" class="form-control" name="fecha" value="${mantenimiento?.fecha || ''}" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Responsable *</label>
                    <input type="text" class="form-control" name="responsable" value="${mantenimiento?.responsable || ''}" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Costo</label>
                    <input type="number" step="0.01" class="form-control" name="costo" value="${mantenimiento?.costo || ''}" placeholder="0.00">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Observaciones</label>
                    <textarea class="form-control" name="observaciones" rows="3">${mantenimiento?.observaciones || ''}</textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="sistema.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">
                        ${mantenimiento ? 'Actualizar' : 'Registrar'} Mantenimiento
                    </button>
                </div>
            </form>
        `;

        this.showModal(mantenimiento ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento', form);
        
        document.getElementById('mantenimiento-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.guardarMantenimiento(mantenimiento?.id);
        });
    }

    // Métodos para guardar datos (simplificados)
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

    async guardarCazuela(id = null) {
        try {
            const formData = new FormData(document.getElementById('cazuela-form'));
            const data = {
                material: formData.get('material'),
                tamaño: formData.get('tamaño'),
                estado: formData.get('estado'),
                fecha_instalacion: formData.get('fecha_instalacion'),
                ubicacion_id: formData.get('ubicacion_id') || null
            };

            const url = id ? `/api/cazuelas/${id}` : '/api/cazuelas';
            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.closeModal();
                this.showSuccess(id ? 'Cazuela actualizada exitosamente' : 'Cazuela creada exitosamente');
                await this.loadCazuelas();
            } else {
                const error = await response.json();
                throw new Error(error.error);
            }
        } catch (error) {
            this.showError('Error al guardar la cazuela: ' + error.message);
        }
    }

    async guardarUbicacion(id = null) {
        try {
            const formData = new FormData(document.getElementById('ubicacion-form'));
            const data = {
                direccion: formData.get('direccion'),
                barrio: formData.get('barrio'),
                coordenadas: formData.get('coordenadas')
            };

            const url = id ? `/api/ubicaciones/${id}` : '/api/ubicaciones';
            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.closeModal();
                this.showSuccess(id ? 'Ubicación actualizada exitosamente' : 'Ubicación creada exitosamente');
                await this.loadUbicaciones();
            } else {
                const error = await response.json();
                throw new Error(error.error);
            }
        } catch (error) {
            this.showError('Error al guardar la ubicación: ' + error.message);
        }
    }

    async guardarMantenimiento(id = null) {
        try {
            const formData = new FormData(document.getElementById('mantenimiento-form'));
            const data = {
                arbol_id: formData.get('arbol_id'),
                tipo_mantenimiento_id: formData.get('tipo_mantenimiento_id') || null,
                fecha: formData.get('fecha'),
                responsable: formData.get('responsable'),
                costo: formData.get('costo') || null,
                observaciones: formData.get('observaciones')
            };

            const url = id ? `/api/mantenimientos/${id}` : '/api/mantenimientos';
            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.closeModal();
                this.showSuccess(id ? 'Mantenimiento actualizado exitosamente' : 'Mantenimiento registrado exitosamente');
                await this.loadMantenimientos();
            } else {
                const error = await response.json();
                throw new Error(error.error);
            }
        } catch (error) {
            this.showError('Error al guardar el mantenimiento: ' + error.message);
        }
    }

    // Métodos de edición (placeholder)
    async editarArbol(id) {
        try {
            const arbol = await this.fetchData(`/api/arboles/${id}`);
            await this.showArbolForm(arbol);
        } catch (error) {
            this.showError('Error al cargar el árbol: ' + error.message);
        }
    }

    async editarCazuela(id) {
        try {
            const cazuela = await this.fetchData(`/api/cazuelas/${id}`);
            await this.showCazuelaForm(cazuela);
        } catch (error) {
            this.showError('Error al cargar la cazuela: ' + error.message);
        }
    }

    async editarUbicacion(id) {
        try {
            const ubicacion = await this.fetchData(`/api/ubicaciones/${id}`);
            await this.showUbicacionForm(ubicacion);
        } catch (error) {
            this.showError('Error al cargar la ubicación: ' + error.message);
        }
    }

    async editarMantenimiento(id) {
        try {
            const mantenimiento = await this.fetchData(`/api/mantenimientos/${id}`);
            await this.showMantenimientoForm(mantenimiento);
        } catch (error) {
            this.showError('Error al cargar el mantenimiento: ' + error.message);
        }
    }

    // Métodos de eliminación (placeholder)
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

    async eliminarCazuela(id) {
        if (confirm('¿Estás seguro de que quieres eliminar esta cazuela?')) {
            try {
                const response = await fetch(`/api/cazuelas/${id}`, { method: 'DELETE' });
                
                if (response.ok) {
                    this.showSuccess('Cazuela eliminada exitosamente');
                    await this.loadCazuelas();
                } else {
                    const error = await response.json();
                    throw new Error(error.error);
                }
            } catch (error) {
                this.showError('Error al eliminar la cazuela: ' + error.message);
            }
        }
    }

    async eliminarUbicacion(id) {
        if (confirm('¿Estás seguro de que quieres eliminar esta ubicación?')) {
            try {
                const response = await fetch(`/api/ubicaciones/${id}`, { method: 'DELETE' });
                
                if (response.ok) {
                    this.showSuccess('Ubicación eliminada exitosamente');
                    await this.loadUbicaciones();
                } else {
                    const error = await response.json();
                    throw new Error(error.error);
                }
            } catch (error) {
                this.showError('Error al eliminar la ubicación: ' + error.message);
            }
        }
    }

    async eliminarMantenimiento(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este mantenimiento?')) {
            try {
                const response = await fetch(`/api/mantenimientos/${id}`, { method: 'DELETE' });
                
                if (response.ok) {
                    this.showSuccess('Mantenimiento eliminado exitosamente');
                    await this.loadMantenimientos();
                } else {
                    const error = await response.json();
                    throw new Error(error.error);
                }
            } catch (error) {
                this.showError('Error al eliminar el mantenimiento: ' + error.message);
            }
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
        // Implementación simple de notificación
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

// Inicializar la aplicación cuando se carga la página
let sistema;
document.addEventListener('DOMContentLoaded', () => {
    sistema = new SistemaArbolesUrbanos();
});
