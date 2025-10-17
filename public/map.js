class MapaArboles {
    constructor() {
        this.map = null;
        this.markers = [];
        this.init();
    }

    init() {
        this.loadMap();
        this.loadArboles();
    }

    loadMap() {
        // Inicializar mapa centrado en una ubicación por defecto
        this.map = L.map('map').setView([-34.6037, -58.3816], 13);

        // Capa de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Capa de satélite (opcional)
        L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
            attribution: '© Google'
        }).addTo(this.map);
    }

    async loadArboles() {
        try {
            const response = await fetch('/api/arboles');
            const arboles = await response.json();

            this.clearMarkers();
            this.addArbolesToMap(arboles);
        } catch (error) {
            console.error('Error cargando árboles para el mapa:', error);
        }
    }

    addArbolesToMap(arboles) {
        arboles.forEach(arbol => {
            if (arbol.coordenadas) {
                const [lat, lng] = arbol.coordenadas.split(',').map(coord => parseFloat(coord.trim()));
                
                const marker = L.marker([lat, lng])
                    .addTo(this.map)
                    .bindPopup(this.createPopupContent(arbol));
                
                this.markers.push(marker);
            }
        });
    }

    createPopupContent(arbol) {
        return `
            <div class="popup-content">
                <h4>${arbol.especie}</h4>
                <p><strong>Estado:</strong> <span class="badge ${this.getEstadoClass(arbol.estado)}">${arbol.estado}</span></p>
                <p><strong>Ubicación:</strong> ${arbol.direccion || 'N/A'}</p>
                <p><strong>Barrio:</strong> ${arbol.barrio || 'N/A'}</p>
                ${arbol.foto ? `<img src="${arbol.foto}" alt="${arbol.especie}" style="max-width: 200px; margin-top: 10px;">` : ''}
                <div style="margin-top: 10px;">
                    <button onclick="sistema.verDetalleArbol(${arbol.id})" class="btn btn-primary btn-sm">Ver Detalles</button>
                </div>
            </div>
        `;
    }

    getEstadoClass(estado) {
        const classes = {
            'Vivo': 'badge-success',
            'Muerto': 'badge-danger',
            'Extraído': 'badge-warning'
        };
        return classes[estado] || 'badge-info';
    }

    clearMarkers() {
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];
    }

    // Filtrar árboles en el mapa
    filtrarPorEstado(estado) {
        // Implementar filtrado por estado
    }

    // Buscar ubicación
    buscarUbicacion(direccion) {
        // Implementar geocodificación
    }
}
