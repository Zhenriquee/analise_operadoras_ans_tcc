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
                    </div>
                `;
                layer.bindTooltip(popupContent, { 
                    sticky: true, 
                    interactive: false, // ISSO RESOLVE O BUG! O mouse não "tropeça" mais na caixa
                    className: 'bg-white border-0 shadow-lg rounded-lg' 
                });
                
                // Eventos de Hover
                layer.on({
                    mouseover: function(e) {
                        const l = e.target;
                        l.setStyle({ weight: 3, color: '#1e293b', fillOpacity: 0.9 });
                        l.bringToFront();
                    },
                    mouseout: function(e) { 
                        self.geoJsonLayer.resetStyle(e.target); 
                    },
                    click: function(e) {
                        // 1. Atualiza o input escondido com o município clicado
                        document.getElementById('municipio-hidden').value = feature.properties.codigo;
                        
                        // 2. Atualiza o painel de Panorama Geral com a Justificativa Estratégica
                        const panoramaDiv = document.getElementById('panorama-dinamico');
                        if (panoramaDiv) {
                            const corCluster = self.getColor(feature.properties.cluster);
                            panoramaDiv.className = "flex-1 bg-white rounded-lg p-4 flex items-center border-l-4 shadow-sm transition-all duration-300";
                            panoramaDiv.style.borderLeftColor = corCluster;
                            
                            panoramaDiv.innerHTML = `
                                <div>
                                    <h4 class="font-bold text-slate-800 text-base mb-1">${feature.properties.nome}</h4>
                                    <p class="text-sm text-slate-600 leading-relaxed">${feature.properties.justificativa}</p>
                                </div>
                            `;
                        }
                        
                        // 3. Dispara a requisição HTMX para atualizar o Ranking via JS
                        htmx.ajax('GET', `/dashboard/${window.ANS_ALVO}/mapa/ranking`, {
                            target: '#ranking-container',
                            source: '#form-filtros-mapa'
                        });
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