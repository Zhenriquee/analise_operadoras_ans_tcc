/**
 * map.js — Mapas com Plotly.js (Tema Dark).
 */

const MapChart = (() => {
    
    // Configurações comuns de base de mapa dark
    const MAPBOX_STYLE = 'carto-darkmatter';
    const BG_COLOR = 'rgba(0,0,0,0)';
    
    function getCenterZoom(geojson) {
        let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
        let found = false;

        geojson.features.forEach(f => {
            try {
                let coords = f.geometry.coordinates;
                // Busca profunda por pares de coordenadas
                const flatCoords = coords.flat(Infinity);
                for(let i=0; i<flatCoords.length; i+=2) {
                    let lon = flatCoords[i], lat = flatCoords[i+1];
                    if (lon < minLon) minLon = lon;
                    if (lon > maxLon) maxLon = lon;
                    if (lat < minLat) minLat = lat;
                    if (lat > maxLat) maxLat = lat;
                    found = true;
                }
            } catch(e) {}
        });

        if (!found) return { lon: -55, lat: -15, zoom: 3 };

        const cLon = (minLon + maxLon) / 2;
        const cLat = (minLat + maxLat) / 2;
        
        // Pseudo-calculo de zoom
        const maxDiff = Math.max(maxLon - minLon, maxLat - minLat);
        let zm = 4;
        if (maxDiff < 2) zm = 7.5;
        else if (maxDiff < 5) zm = 6;
        else if (maxDiff < 10) zm = 5.2;
        
        return { lon: cLon, lat: cLat, zoom: zm };
    }

    /**
     * Aba 1: Mapa de Atuação Coroplético
     */
    function renderMapaAtuacao(containerId, geojson) {
        const el = document.getElementById(containerId);
        if (!el) return;

        if (!geojson || !geojson.features || geojson.features.length === 0) {
            el.innerHTML = '<p style="color:#8892b0;text-align:center;padding:80px 0;">Nenhuma atuação geográfica encontrada</p>';
            return;
        }

        const locations = [];
        const z = [];
        const text = [];

        geojson.features.forEach(f => {
            locations.push(f.id);
            const vidas = f.properties.qtd_beneficiarios || 0;
            z.push(vidas);
            text.push(`${f.properties.municipio} - ${f.properties.sg_uf}<br>Beneficiários: ${Charts.fmtNum(vidas)}`);
        });

        const center = getCenterZoom(geojson);

        Plotly.newPlot(el, [{
            type: 'choroplethmapbox',
            geojson: geojson,
            locations: locations,
            z: z,
            text: text,
            hoverinfo: 'text',
            colorscale: [
                [0, 'rgba(99,91,255,0.1)'],
                [0.5, '#635bff'],
                [1, '#3b32c9']
            ],
            marker: { line: { width: 0.5, color: '#2d3342' }, opacity: 0.9 },
            colorbar: {
                title: { text: 'Beneficiários', font: { color: '#c2c9d6', size: 10 } },
                tickfont: { color: '#c2c9d6', size: 10 },
                outlinewidth: 0, thickness: 10, len: 0.6,
                bgcolor: 'rgba(23,25,35,0.7)'
            }
        }], {
            mapbox: { style: MAPBOX_STYLE, center: { lon: center.lon, lat: center.lat }, zoom: center.zoom },
            paper_bgcolor: BG_COLOR,
            margin: { l: 0, r: 0, t: 0, b: 0 }
        }, { responsive: true, displayModeBar: false, scrollZoom: true });
    }

    /**
     * Aba 2: Mapa de Clusters Estratégicos
     */
    function renderMapaClusters(containerId, geojson) {
        const el = document.getElementById(containerId);
        if (!el) return;

        if (!geojson || !geojson.features || geojson.features.length === 0) {
            el.innerHTML = '<p style="color:#8892b0;text-align:center;padding:80px 0;">Nenhum cluster de mercado encontrado</p>';
            return;
        }

        const center = getCenterZoom(geojson);
        const traces = [];
        
        // 0: Azul, 1: Saturado(Amber), 2: Fortaleza(Primary), 3: Armadilha(Red)
        const clusterConfig = {
            0: { color: '#3a86ff', name: 'Oceano Azul' },
            1: { color: '#e68a00', name: 'Saturado Premium' },
            2: { color: '#635bff', name: 'Fortaleza Monopolista' },
            3: { color: '#d9534f', name: 'Armadilha Pulverizada' }
        };

        // Agrupar por cluster
        for (let i = 0; i <= 3; i++) {
            const clusterFeats = geojson.features.filter(f => f.properties.cluster_estrategico_id === i);
            
            if (clusterFeats.length > 0) {
                const subGeojson = { type: "FeatureCollection", features: clusterFeats };
                
                traces.push({
                    type: 'choroplethmapbox',
                    geojson: subGeojson,
                    locations: clusterFeats.map(f => f.id),
                    z: clusterFeats.map(() => 1), // Dummy value just to fill color
                    text: clusterFeats.map(f => `<b>${f.properties.municipio}</b><br>${f.properties.nome_perfil_mercado}<br><i>${f.properties.justificativa_estrategica}</i>`),
                    hoverinfo: 'text',
                    colorscale: [[0, clusterConfig[i].color], [1, clusterConfig[i].color]],
                    showscale: false,
                    name: clusterConfig[i].name,
                    marker: { line: { width: 0.5, color: '#171923' }, opacity: 0.75 }
                });
            }
        }

        Plotly.newPlot(el, traces, {
            mapbox: { style: MAPBOX_STYLE, center: { lon: center.lon, lat: center.lat }, zoom: center.zoom },
            paper_bgcolor: BG_COLOR,
            margin: { l: 0, r: 0, t: 0, b: 0 }
        }, { responsive: true, displayModeBar: false, scrollZoom: true });
    }

    /**
     * Aba 3: Mapa de Expansão (Raios de 50km + Vizinhos)
     */
    function renderMapaExpansao(containerId, geojson) {
        const el = document.getElementById(containerId);
        if (!el) return;

        if (!geojson || !geojson.features || geojson.features.length === 0) {
            el.innerHTML = '<p style="color:#8892b0;text-align:center;padding:80px 0;">Sem viabilidade logística de expansão (Nenhum raio de 50km calculado)</p>';
            return;
        }

        const center = getCenterZoom(geojson);
        
        // Separar features por tipo
        const poligonosRaio = geojson.features.filter(f => f.properties.tipo === 'raio_50km');
        const vizinhosValidados = geojson.features.filter(f => f.properties.tipo === 'vizinho_expansao');

        const traces = [];

        // Camada 1: Polígonos de raio (semi-transparentes)
        if (poligonosRaio.length > 0) {
            traces.push({
                type: 'choroplethmapbox',
                geojson: { type: "FeatureCollection", features: poligonosRaio },
                locations: poligonosRaio.map(f => f.id),
                z: poligonosRaio.map(() => 1),
                text: poligonosRaio.map(f => `Área de Expansão: ${f.properties.hub_nome}`),
                hoverinfo: 'text',
                colorscale: [[0, 'rgba(12,188,139,0.2)'], [1, 'rgba(12,188,139,0.2)']],
                showscale: false,
                marker: { line: { width: 1.5, color: '#0cbc8b' } }
            });
        }

        // Camada 2: Municípios vizinhos
        if (vizinhosValidados.length > 0) {
            traces.push({
                type: 'choroplethmapbox',
                geojson: { type: "FeatureCollection", features: vizinhosValidados },
                locations: vizinhosValidados.map(f => f.id),
                z: vizinhosValidados.map(() => 1),
                text: vizinhosValidados.map(f => `<b>ALVO: ${f.properties.municipio}</b><br>Cluster: ${f.properties.nome_perfil_mercado}`),
                hoverinfo: 'text',
                colorscale: [[0, 'rgba(230,138,0,0.7)'], [1, 'rgba(230,138,0,0.7)']], // Amber
                showscale: false,
                marker: { line: { width: 1, color: '#e68a00' } }
            });
        }

        Plotly.newPlot(el, traces, {
            mapbox: { style: MAPBOX_STYLE, center: { lon: center.lon, lat: center.lat }, zoom: center.zoom },
            paper_bgcolor: BG_COLOR,
            margin: { l: 0, r: 0, t: 0, b: 0 }
        }, { responsive: true, displayModeBar: false, scrollZoom: true });
    }

    return { renderMapaAtuacao, renderMapaClusters, renderMapaExpansao };
})();
