/**
 * map.js — Mapa Coroplético via Plotly.js (tema claro).
 */

const MapChart = (() => {
    function render(containerId, geojson) {
        const el = document.getElementById(containerId);
        if (!el) return;

        if (!geojson || !geojson.features || geojson.features.length === 0) {
            el.innerHTML = '<p style="color:#8898aa;text-align:center;padding:80px 0;">Nenhum dado geográfico para exibir</p>';
            return;
        }

        const locations = [];
        const z = [];
        const text = [];

        let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;

        geojson.features.forEach(f => {
            locations.push(f.id);
            z.push(f.properties.qtd_beneficiarios || 0);
            text.push(`${f.properties.nome_municipio} - ${f.properties.nome_uf}<br>Beneficiários: ${Charts.fmtNum(f.properties.qtd_beneficiarios)}`);

            try {
                let coords = f.geometry.coordinates;
                if (f.geometry.type === 'MultiPolygon') coords = coords[0][0];
                else if (f.geometry.type === 'Polygon') coords = coords[0];
                coords.forEach(pt => {
                    if (pt[0] < minLon) minLon = pt[0];
                    if (pt[0] > maxLon) maxLon = pt[0];
                    if (pt[1] < minLat) minLat = pt[1];
                    if (pt[1] > maxLat) maxLat = pt[1];
                });
            } catch(e) {}
        });

        const cLon = isFinite(minLon) ? (minLon + maxLon) / 2 : -55;
        const cLat = isFinite(minLat) ? (minLat + maxLat) / 2 : -15;
        const zm = isFinite(minLon) ? 4.2 : 3;

        Plotly.newPlot(el, [{
            type: 'choroplethmapbox',
            geojson: geojson,
            locations: locations,
            z: z,
            text: text,
            hoverinfo: 'text',
            colorscale: [
                [0, '#eef4ff'],
                [0.3, '#a5c4ff'],
                [0.6, '#635bff'],
                [1, '#3b32c9'],
            ],
            marker: { line: { width: 0.5, color: '#ffffff' }, opacity: 0.85 },
            colorbar: {
                title: { text: 'Beneficiários', font: { color: '#525f7f', size: 10 } },
                tickfont: { color: '#525f7f', size: 10 },
                outlinewidth: 0, thickness: 10, len: 0.6,
            },
        }], {
            mapbox: {
                style: 'carto-positron',
                center: { lon: cLon, lat: cLat },
                zoom: zm,
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            margin: { l: 0, r: 0, t: 0, b: 0 },
        }, {
            responsive: true,
            displayModeBar: false,
            scrollZoom: true,
        });
    }

    return { render };
})();
