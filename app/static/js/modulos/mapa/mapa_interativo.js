window.ModuloMapa = {
    map: null,
    geoJsonLayer: null,

    // Define as cores com base na sua classificação de mercado
    getColor: function(cluster) {
        switch (cluster) {
            case 'Oceano Azul Pagante': return '#3b82f6'; // Azul
            case 'Armadilha Pulverizada': return '#ef4444'; // Vermelho
            case 'Fortaleza Monopolista': return '#8b5cf6'; // Roxo
            case 'Mercado Saturado Premium': return '#f59e0b'; // Amarelo
            default: return '#cbd5e1'; // Cinza 
        }
    },

    renderizarMapa: function(geojsonData) {
        // Prevenção de vazamento de memória: destroi o mapa se já existir
        if (this.map) {
            this.map.off();
            this.map.remove();
            this.map = null;
        }

        // Inicia o mapa
        this.map = L.map('mapa-clusters').setView([-14.235, -51.925], 4);

        // Adiciona a camada base (tiles)
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
            maxZoom: 16
        }).addTo(this.map);

        const self = this; // Guarda a referência do objeto para o escopo interno do Leaflet

        // Renderiza os polígonos dos municípios
        this.geoJsonLayer = L.geoJSON(geojsonData, {
            style: function(feature) {
                return {
                    fillColor: self.getColor(feature.properties.cluster),
                    weight: 1,
                    opacity: 1,
                    color: 'white',
                    fillOpacity: 0.7
                };
            },
            onEachFeature: function(feature, layer) {
                const props = feature.properties;
                const vidasFormatadas = props.vidas ? props.vidas.toLocaleString('pt-BR') : '0';
                
                // Tooltip Customizado
                const popupContent = `
                    <div class="p-1 max-w-xs font-sans">
                        <h4 class="font-bold text-sm text-slate-800 border-b pb-1 mb-1">${props.nome}</h4>
                        <p class="text-xs mb-1"><span class="font-semibold">Beneficiários:</span> ${vidasFormatadas}</p>
                        <p class="text-xs mb-1"><span class="font-semibold">Perfil:</span> <span style="color:${self.getColor(props.cluster)}">${props.cluster}</span></p>
                        <p class="text-[10px] text-slate-500 italic mt-2">${props.justificativa}</p>
                    </div>
                `;
                layer.bindTooltip(popupContent, { sticky: true, className: 'bg-white border-0 shadow-lg rounded-lg' });
                
                // Eventos de Hover
                layer.on({
                    mouseover: function(e) {
                        const l = e.target;
                        l.setStyle({ weight: 3, color: '#1e293b', fillOpacity: 0.9 });
                        l.bringToFront();
                    },
                    mouseout: function(e) { 
                        self.geoJsonLayer.resetStyle(e.target); 
                    }
                });
            }
        }).addTo(this.map);

        // Zoom automático para englobar todas as cidades da operadora
        if (geojsonData.features && geojsonData.features.length > 0) {
            this.map.fitBounds(this.geoJsonLayer.getBounds());
        }
    },

    init: function() {
        const rawData = document.getElementById('dados-mapa');
        if (!rawData) return;

        try {
            const dados = JSON.parse(rawData.textContent);
            this.renderizarMapa(dados);
        } catch (error) {
            console.error("Erro ao inicializar o Mapa:", error);
        }
    }
};

// Auto-init quando o HTML carregar
document.addEventListener('DOMContentLoaded', () => window.ModuloMapa.init());