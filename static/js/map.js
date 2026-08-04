/**
 * map.js — Renderização do Mapa Coroplético via Plotly.js.
 */

const MapChart = (() => {
    /**
     * Renderiza o mapa coroplético da operadora.
     */
    function render(containerId, geojson) {
        const el = document.getElementById(containerId);
        if (!el) return;

        if (!geojson || !geojson.features || geojson.features.length === 0) {
            el.innerHTML = '<p style="color:#64748b;text-align:center;padding:100px 0;">Sem dados geográficos para exibir</p>';
            return;
        }

        // Extrair dados do GeoJSON para as arrays do Plotly
        const locations = [];
        const z = [];
        const text = [];

        // Calcular bounds para o zoom automático
        let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;

        geojson.features.forEach(f => {
            locations.push(f.id);
            z.push(f.properties.qtd_beneficiarios || 0);
            text.push(`${f.properties.nome_municipio} - ${f.properties.nome_uf}<br>Vidas: ${Charts.fmtNum(f.properties.qtd_beneficiarios)}`);

            // Simplificação para bounds (pegando apenas o primeiro ponto do polígono principal)
            try {
                let coords = f.geometry.coordinates;
                if (f.geometry.type === 'MultiPolygon') {
                    coords = coords[0][0];
                } else if (f.geometry.type === 'Polygon') {
                    coords = coords[0];
                }
                
                coords.forEach(pt => {
                    const lon = pt[0];
                    const lat = pt[1];
                    if (lon < minLon) minLon = lon;
                    if (lon > maxLon) maxLon = lon;
                    if (lat < minLat) minLat = lat;
                    if (lat > maxLat) maxLat = lat;
                });
            } catch(e) {}
        });

        // Centro e zoom aproximados
        const centerLon = (minLon + maxLon) / 2;
        const centerLat = (minLat + maxLat) / 2;
        
        // Evitar Infinity se o bounds falhar
        const safeCenterLon = isFinite(centerLon) ? centerLon : -55;
        const safeCenterLat = isFinite(centerLat) ? centerLat : -15;
        const safeZoom = isFinite(minLon) ? 4.5 : 3;

        const trace = {
            type: 'choroplethmapbox',
            geojson: geojson,
            locations: locations,
            z: z,
            text: text,
            hoverinfo: 'text',
            colorscale: [
                [0, 'rgba(59, 130, 246, 0.2)'],
                [0.5, 'rgba(59, 130, 246, 0.6)'],
                [1, '#3b82f6']
            ],
            marker: {
                line: { width: 0.5, color: '#1e293b' },
                opacity: 0.8
            },
            colorbar: {
                title: { text: 'Beneficiários', font: { color: '#94a3b8', size: 10 } },
                tickfont: { color: '#94a3b8', size: 10 },
                outlinewidth: 0,
                thickness: 10,
                len: 0.7,
                bgcolor: 'rgba(15, 20, 35, 0.5)'
            }
        };

        const layout = {
            mapbox: {
                style: 'carto-darkmatter', // Estilo dark
                center: { lon: safeCenterLon, lat: safeCenterLat },
                zoom: safeZoom
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            margin: { l: 0, r: 0, t: 0, b: 0 },
        };

        const config = {
            responsive: true,
            displayModeBar: false,
            scrollZoom: true
        };

        Plotly.newPlot(el, [trace], layout, config);
    }

    return { render };
})();
