class MapaArboles {
    constructor() {
        this.map = null;
        this.markers = [];
    }

    init(containerId = 'map') {
        this.loadMap(containerId);
        this.loadArboles();
    }

    loadMap(containerId) {
        if (this.map) {
            this.map.remove();
        }

        this.map = L.map(containerId).setView([-34.6037, -58.3816], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        console.log('✅ Mapa cargado correctamente');
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
                try {
                    const [lat, lng] = arbol.coordenadas.split(',').map(coord => parseFloat(coord.trim()));
                    
                    const marker = L.marker([lat, lng])
                        .addTo(this.map)
                        .bindPopup(this.createPopupContent(arbol));
                    
                    this.markers.push(marker);
                } catch (error) {
                    console.error('Error procesando coordenadas:', arbol.coordenadas);
                }
            }
        });
    }

    createPopupContent(arbol) {
        return `
            <div class="popup-content" style="min-width: 200px;">
                <h4 style="margin: 0 0 10px 0; color: #2e7d32;">${arbol.especie}</h4>
                <p style="margin: 5px 0;"><strong>Estado:</strong> <span class="badge ${this.getEstadoClass(arbol.estado)}">${arbol.estado}</span></p>
                <p style="margin: 5px 0;"><strong>Ubicación:</strong> ${arbol.direccion || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Barrio:</strong> ${arbol.barrio || 'N/A'}</p>
                ${arbol.foto ? `<img src="${arbol.foto}" alt="${arbol.especie}" style="max-width: 100%; margin-top: 10px; border-radius: 5px;">` : ''}
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
}
