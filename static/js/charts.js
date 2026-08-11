/**
 * charts.js — Funções de criação de gráficos Plotly.js.
 * Tema claro profissional com foco em legibilidade.
 */

const Charts = (() => {
    const COLORS = [
        '#635bff', '#3a86ff', '#0cbc8b', '#e68a00',
        '#d9534f', '#8b5cf6', '#06b6d4', '#ec4899',
        '#14b8a6', '#f97316', '#6366f1', '#22d3ee',
    ];

    const BASE_LAYOUT = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: {
            family: "'Inter', sans-serif",
            color: '#525f7f',
            size: 12,
        },
        margin: { l: 20, r: 20, t: 10, b: 20 },
        showlegend: false,
        autosize: true,
    };

    const CFG = { responsive: true, displayModeBar: false };

    function fmtNum(n) {
        if (n === null || n === undefined) return '—';
        return n.toLocaleString('pt-BR');
    }

    /**
     * Termômetro B2B — Gauge full-width com barra comparativa abaixo.
     * Agora recebe 1 container e cria 2 sub-divs internamente.
     */
    function renderGauge(containerId, data) {
        const el = document.getElementById(containerId);
        if (!el) return;

        el.innerHTML = '';

        // Criar sub-divs
        const gaugeDiv = document.createElement('div');
        gaugeDiv.style.height = '220px';
        const barDiv = document.createElement('div');
        barDiv.style.height = '100px';
        el.appendChild(gaugeDiv);
        el.appendChild(barDiv);

        // Gauge
        Plotly.newPlot(gaugeDiv, [{
            type: 'indicator',
            mode: 'gauge+number',
            value: data.penetracao,
            number: { suffix: '%', font: { size: 40, color: '#1a1f36', weight: 700 } },
            title: { text: 'Penetração B2B (Vidas / CLT)', font: { size: 13, color: '#8898aa' } },
            gauge: {
                axis: { range: [0, 100], tickfont: { color: '#8898aa', size: 11 }, dtick: 25 },
                bar: { color: '#635bff', thickness: 0.65 },
                bgcolor: '#f0f2f5',
                borderwidth: 0,
                steps: [
                    { range: [0, 30], color: '#fdf0f0' },
                    { range: [30, 70], color: '#fff8e6' },
                    { range: [70, 100], color: '#e6f8f1' },
                ],
            },
        }], {
            ...BASE_LAYOUT,
            margin: { l: 30, r: 30, t: 40, b: 5 },
        }, CFG);

        // Barra comparativa
        Plotly.newPlot(barDiv, [
            {
                type: 'bar', y: [''], x: [data.vidas_atuais], orientation: 'h',
                name: `Vidas Atuais: ${fmtNum(data.vidas_atuais)}`,
                marker: { color: '#635bff' },
                hovertemplate: 'Vidas Atuais: %{x:,.0f}<extra></extra>',
            },
            {
                type: 'bar', y: [''], x: [data.oportunidade], orientation: 'h',
                name: `Oportunidade CLT: ${fmtNum(data.oportunidade)}`,
                marker: { color: '#e2e6ed' },
                hovertemplate: 'Oportunidade: %{x:,.0f}<extra></extra>',
            },
        ], {
            ...BASE_LAYOUT,
            margin: { l: 5, r: 5, t: 5, b: 5 },
            barmode: 'stack',
            xaxis: { showticklabels: false, zeroline: false, showgrid: false },
            yaxis: { showticklabels: false },
            showlegend: true,
            legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.6,
                font: { size: 11, color: '#525f7f' }, bgcolor: 'rgba(0,0,0,0)' },
        }, CFG);
    }

    /**
     * Top 10 Operadoras — barras horizontais legíveis.
     */
    function renderRankingBars(containerId, data) {
        const el = document.getElementById(containerId);
        if (!el || !data.length) {
            if (el) el.innerHTML = '<p style="color:#8898aa;text-align:center;padding:60px 0;">Nenhum dado encontrado</p>';
            return;
        }

        const reversed = [...data].reverse();

        Plotly.newPlot(el, [{
            type: 'bar',
            y: reversed.map(d => {
                const s = d.razao_social;
                return s.length > 30 ? s.substring(0, 30) + '…' : s;
            }),
            x: reversed.map(d => d.qtd_beneficiarios),
            orientation: 'h',
            marker: { color: '#635bff', cornerradius: 3 },
            text: reversed.map(d => `${fmtNum(d.qtd_beneficiarios)}  ·  ${d.market_share}%`),
            textposition: 'outside',
            cliponaxis: false,
            textfont: { color: '#525f7f', size: 10 },
            hovertemplate: '<b>%{y}</b><br>Beneficiários: %{x:,.0f}<extra></extra>',
        }], {
            ...BASE_LAYOUT,
            margin: { l: 10, r: 130, t: 5, b: 5 },
            xaxis: {
                gridcolor: '#edf0f4', tickfont: { color: '#8898aa', size: 10 },
                zeroline: false, automargin: true,
            },
            yaxis: {
                tickfont: { color: '#1a1f36', size: 10 }, automargin: true,
            },
        }, CFG);
    }

    /**
     * Distribuição por Modalidade — Donut limpo.
     */
    function renderModalidadePie(containerId, data) {
        const el = document.getElementById(containerId);
        if (!el || !data.length) {
            if (el) el.innerHTML = '<p style="color:#8898aa;text-align:center;padding:60px 0;">Nenhum dado encontrado</p>';
            return;
        }

        Plotly.newPlot(el, [{
            type: 'pie',
            labels: data.map(d => d.modalidade),
            values: data.map(d => d.qtd_beneficiarios),
            hole: 0.5,
            marker: { colors: COLORS, line: { color: '#ffffff', width: 2 } },
            textinfo: 'label+percent',
            textposition: 'outside',
            textfont: { size: 11, color: '#525f7f' },
            automargin: true,
            hovertemplate: '<b>%{label}</b><br>Vidas: %{value:,.0f}<br>%{percent}<extra></extra>',
        }], {
            ...BASE_LAYOUT,
            margin: { l: 40, r: 40, t: 20, b: 20 },
            showlegend: false,
        }, CFG);
    }

    /**
     * Curva ABC / Pareto — barras + linha acumulada.
     */
    function renderParetoChart(containerId, data) {
        const el = document.getElementById(containerId);
        if (!el || !data.length) {
            if (el) el.innerHTML = '<p style="color:#8898aa;text-align:center;padding:60px 0;">Nenhum dado encontrado</p>';
            return;
        }

        const labels = data.map(d => {
            const n = d.nome_municipio;
            return n.length > 16 ? n.substring(0, 16) + '…' : n;
        });

        Plotly.newPlot(el, [
            {
                type: 'bar', x: labels, y: data.map(d => d.qtd_beneficiarios),
                marker: { color: '#635bff', cornerradius: 3 },
                text: data.map(d => fmtNum(d.qtd_beneficiarios)),
                textposition: 'outside',
                cliponaxis: false,
                textfont: { color: '#525f7f', size: 9 },
                hovertemplate: '<b>%{x}</b><br>Vidas: %{y:,.0f}<extra></extra>',
                yaxis: 'y',
            },
            {
                type: 'scatter', mode: 'lines+markers+text',
                x: labels, y: data.map(d => d.percentual_acumulado),
                line: { color: '#d9534f', width: 2, shape: 'spline' },
                marker: { size: 6, color: '#d9534f', line: { color: '#fff', width: 1.5 } },
                text: data.map(d => `${d.percentual_acumulado}%`),
                textposition: 'top center',
                cliponaxis: false,
                textfont: { color: '#d9534f', size: 9 },
                hovertemplate: 'Acumulado: %{y:.1f}%<extra></extra>',
                yaxis: 'y2',
            },
        ], {
            ...BASE_LAYOUT,
            margin: { l: 50, r: 50, t: 30, b: 80 },
            xaxis: { tickangle: -45, tickfont: { color: '#525f7f', size: 10 }, gridcolor: '#edf0f4' },
            yaxis: {
                title: { text: 'Beneficiários', font: { size: 10, color: '#8898aa' } },
                tickfont: { color: '#8898aa', size: 9 }, gridcolor: '#edf0f4', zeroline: false,
            },
            yaxis2: {
                title: { text: '% Acumulado', font: { size: 10, color: '#d9534f' } },
                tickfont: { color: '#d9534f', size: 9 },
                overlaying: 'y', side: 'right', range: [0, 108], showgrid: false,
            },
        }, CFG);
    }

    /**
     * Donut — Força na Praça Principal.
     */
    function renderMarketShareDonut(containerId, data, subtitleId) {
        const el = document.getElementById(containerId);
        if (!el) return;

        const sub = document.getElementById(subtitleId);
        if (sub && data.cidade) sub.textContent = `Market share em ${data.cidade}`;

        if (!data.cidade || data.operadora_vidas === 0) {
            el.innerHTML = '<p style="color:#8898aa;text-align:center;padding:60px 0;">Nenhum dado encontrado</p>';
            return;
        }

        Plotly.newPlot(el, [{
            type: 'pie',
            labels: ['Operadora Selecionada', 'Restante do Mercado'],
            values: [data.operadora_vidas, data.mercado_vidas],
            hole: 0.6,
            marker: { colors: ['#635bff', '#e2e6ed'], line: { color: '#fff', width: 2 } },
            textinfo: 'label+percent',
            textposition: 'outside',
            textfont: { size: 11, color: '#525f7f' },
            automargin: true,
            hovertemplate: '<b>%{label}</b><br>Vidas: %{value:,.0f}<br>%{percent}<extra></extra>',
        }], {
            ...BASE_LAYOUT,
            margin: { l: 60, r: 60, t: 10, b: 10 },
            showlegend: false,
            annotations: [{
                text: `<b>${data.operadora_share}%</b>`,
                font: { size: 28, color: '#635bff' },
                showarrow: false, x: 0.5, y: 0.5,
            }],
        }, CFG);
    }

    return { renderGauge, renderRankingBars, renderModalidadePie, renderParetoChart, renderMarketShareDonut, fmtNum };
})();
