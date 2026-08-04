/**
 * charts.js — Funções de criação de gráficos Plotly.js.
 *
 * Todos os gráficos utilizam tema dark com cores harmônicas,
 * animações de transição e layout responsivo.
 */

const Charts = (() => {
    // Paleta de cores premium para gráficos
    const COLORS = [
        '#3b82f6', '#06b6d4', '#10b981', '#8b5cf6',
        '#f59e0b', '#f43f5e', '#6366f1', '#ec4899',
        '#14b8a6', '#a855f7', '#f97316', '#22d3ee',
    ];

    // Layout base dark theme para todos os gráficos
    const BASE_LAYOUT = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: {
            family: "'Inter', sans-serif",
            color: '#94a3b8',
            size: 12,
        },
        margin: { l: 20, r: 20, t: 10, b: 20 },
        showlegend: false,
        autosize: true,
    };

    const PLOTLY_CONFIG = {
        responsive: true,
        displayModeBar: false,
    };

    /**
     * Formata números para exibição brasileira.
     */
    function fmtNum(n) {
        if (n === null || n === undefined) return '—';
        return n.toLocaleString('pt-BR');
    }

    /**
     * Renderiza o Termômetro B2B (Gauge + Barra Empilhada).
     */
    function renderGauge(containerIdGauge, containerIdBar, data) {
        const elGauge = document.getElementById(containerIdGauge);
        const elBar = document.getElementById(containerIdBar);
        if (!elGauge || !elBar) return;

        // 1. GAUGE DE PENETRAÇÃO
        const traceGauge = {
            type: 'indicator',
            mode: 'gauge+number+delta',
            value: data.penetracao,
            number: {
                suffix: '%',
                font: { size: 36, color: '#f1f5f9', family: "'Inter', sans-serif", weight: 700 }
            },
            title: {
                text: 'Penetração B2B',
                font: { size: 13, color: '#94a3b8' }
            },
            gauge: {
                axis: {
                    range: [0, 100],
                    tickfont: { color: '#64748b', size: 10 },
                    dtick: 25,
                },
                bar: { color: '#3b82f6', thickness: 0.7 },
                bgcolor: 'rgba(30, 41, 59, 0.6)',
                borderwidth: 0,
                steps: [
                    { range: [0, 30], color: 'rgba(244, 63, 94, 0.15)' },
                    { range: [30, 70], color: 'rgba(245, 158, 11, 0.15)' },
                    { range: [70, 100], color: 'rgba(16, 185, 129, 0.15)' },
                ],
                threshold: {
                    line: { color: '#f43f5e', width: 2 },
                    thickness: 0.8,
                    value: data.penetracao,
                },
            },
        };

        const layoutGauge = {
            ...BASE_LAYOUT,
            margin: { l: 20, r: 20, t: 20, b: 20 },
        };

        Plotly.newPlot(elGauge, [traceGauge], layoutGauge, PLOTLY_CONFIG);

        // 2. BARRA EMPILHADA COMPARATIVA
        const barTraces = [
            {
                type: 'bar',
                y: [''],
                x: [data.vidas_atuais],
                orientation: 'h',
                name: 'Vidas Atuais',
                marker: { color: '#3b82f6', cornerradius: 4 },
                text: [`Vidas: ${fmtNum(data.vidas_atuais)}`],
                textposition: 'inside',
                insidetextanchor: 'middle',
                textfont: { color: 'white', size: 11, family: "'Inter', sans-serif" },
                hovertemplate: 'Vidas Atuais: %{x:,.0f}<extra></extra>',
            },
            {
                type: 'bar',
                y: [''],
                x: [data.oportunidade],
                orientation: 'h',
                name: 'Oportunidade',
                marker: { color: 'rgba(245, 158, 11, 0.4)', cornerradius: 4 },
                text: [`Oport. CLT: ${fmtNum(data.oportunidade)}`],
                textposition: 'inside',
                insidetextanchor: 'middle',
                textfont: { color: '#f59e0b', size: 11, family: "'Inter', sans-serif" },
                hovertemplate: 'Oportunidade B2B: %{x:,.0f}<extra></extra>',
            },
        ];

        const layoutBar = {
            ...BASE_LAYOUT,
            margin: { l: 10, r: 10, t: 10, b: 20 },
            barmode: 'stack',
            xaxis: {
                title: { text: 'Pessoas', font: { size: 11, color: '#64748b' } },
                tickfont: { color: '#64748b', size: 10 },
                gridcolor: 'rgba(148, 163, 184, 0.08)',
                zeroline: false,
            },
            yaxis: {
                showticklabels: false,
            },
            showlegend: true,
            legend: {
                orientation: 'h',
                x: 0.5, xanchor: 'center', y: 1.1,
                font: { size: 11, color: '#94a3b8' },
                bgcolor: 'rgba(0,0,0,0)',
            },
        };

        Plotly.newPlot(elBar, barTraces, layoutBar, PLOTLY_CONFIG);
    }

    /**
     * Renderiza o Ranking Top 10 (Barras Horizontais).
     */
    function renderRankingBars(containerId, data) {
        const el = document.getElementById(containerId);
        if (!el || !data.length) {
            if (el) el.innerHTML = '<p style="color:#64748b;text-align:center;padding:40px;">Sem dados para exibir</p>';
            return;
        }

        // Inverter para exibir do maior no topo
        const reversed = [...data].reverse();

        const traces = [{
            type: 'bar',
            y: reversed.map(d => d.razao_social.length > 35
                ? d.razao_social.substring(0, 35) + '...'
                : d.razao_social),
            x: reversed.map(d => d.qtd_beneficiarios),
            orientation: 'h',
            marker: {
                color: reversed.map((_, i) => {
                    const idx = reversed.length - 1 - i;
                    return COLORS[idx % COLORS.length];
                }),
                cornerradius: 4,
            },
            text: reversed.map(d => `${fmtNum(d.qtd_beneficiarios)} (${d.market_share}%)`),
            textposition: 'outside',
            textfont: { color: '#94a3b8', size: 10, family: "'Inter', sans-serif" },
            hovertemplate: '<b>%{y}</b><br>Beneficiários: %{x:,.0f}<br>Market Share: %{text}<extra></extra>',
        }];

        const layout = {
            ...BASE_LAYOUT,
            margin: { l: 240, r: 50, t: 10, b: 40 },
            xaxis: {
                gridcolor: 'rgba(148, 163, 184, 0.08)',
                tickfont: { color: '#64748b', size: 10 },
                zeroline: false,
                automargin: true,
            },
            yaxis: {
                tickfont: { color: '#94a3b8', size: 10 },
                automargin: false,
            },
        };

        Plotly.newPlot(el, traces, layout, PLOTLY_CONFIG);
    }

    /**
     * Renderiza a Distribuição por Modalidade (Pizza/Donut).
     */
    function renderModalidadePie(containerId, data) {
        const el = document.getElementById(containerId);
        if (!el || !data.length) {
            if (el) el.innerHTML = '<p style="color:#64748b;text-align:center;padding:40px;">Sem dados para exibir</p>';
            return;
        }

        const traces = [{
            type: 'pie',
            labels: data.map(d => d.modalidade),
            values: data.map(d => d.qtd_beneficiarios),
            hole: 0.5,
            marker: {
                colors: COLORS,
                line: { color: 'rgba(10, 14, 26, 0.8)', width: 2 },
            },
            textinfo: 'percent',
            textposition: 'inside',
            insidetextorientation: 'radial',
            textfont: { color: '#f1f5f9', size: 11, family: "'Inter', sans-serif" },
            hovertemplate: '<b>%{label}</b><br>Vidas: %{value:,.0f}<br>Participação: %{percent}<extra></extra>',
            rotation: -30,
        }];

        const layout = {
            ...BASE_LAYOUT,
            margin: { l: 10, r: 10, t: 10, b: 30 },
            showlegend: true,
            legend: {
                font: { size: 10, color: '#94a3b8' },
                bgcolor: 'rgba(0,0,0,0)',
                orientation: 'h',
                x: 0.5,
                xanchor: 'center',
                y: -0.1,
            },
        };

        Plotly.newPlot(el, traces, layout, PLOTLY_CONFIG);
    }

    /**
     * Renderiza a Curva ABC / Pareto (Barras + Linha acumulada).
     */
    function renderParetoChart(containerId, data) {
        const el = document.getElementById(containerId);
        if (!el || !data.length) {
            if (el) el.innerHTML = '<p style="color:#64748b;text-align:center;padding:40px;">Sem dados para exibir</p>';
            return;
        }

        const labels = data.map(d => {
            const name = d.nome_municipio;
            return name.length > 20 ? name.substring(0, 20) + '...' : name;
        });

        const traces = [
            // Barras
            {
                type: 'bar',
                x: labels,
                y: data.map(d => d.qtd_beneficiarios),
                marker: {
                    color: data.map((_, i) => COLORS[i % COLORS.length]),
                    cornerradius: 4,
                },
                text: data.map(d => `${d.percentual}%`),
                textposition: 'outside',
                textfont: { color: '#94a3b8', size: 10 },
                hovertemplate: '<b>%{x}</b><br>Vidas: %{y:,.0f}<extra></extra>',
                yaxis: 'y',
            },
            // Linha acumulada
            {
                type: 'scatter',
                mode: 'lines+markers+text',
                x: labels,
                y: data.map(d => d.percentual_acumulado),
                line: { color: '#f43f5e', width: 2.5, shape: 'spline' },
                marker: { size: 7, color: '#f43f5e', line: { color: '#0a0e1a', width: 2 } },
                text: data.map(d => `${d.percentual_acumulado}%`),
                textposition: 'top center',
                textfont: { color: '#f43f5e', size: 10 },
                hovertemplate: 'Acumulado: %{y:.1f}%<extra></extra>',
                yaxis: 'y2',
            },
        ];

        const layout = {
            ...BASE_LAYOUT,
            margin: { l: 55, r: 55, t: 20, b: 100 },
            xaxis: {
                tickangle: -45,
                tickfont: { color: '#94a3b8', size: 9 },
                gridcolor: 'rgba(148, 163, 184, 0.05)',
                automargin: false,
            },
            yaxis: {
                title: { text: 'Beneficiários', font: { size: 10, color: '#64748b' } },
                tickfont: { color: '#64748b', size: 10 },
                gridcolor: 'rgba(148, 163, 184, 0.08)',
                zeroline: false,
            },
            yaxis2: {
                title: { text: '% Acumulado', font: { size: 11, color: '#f43f5e' } },
                tickfont: { color: '#f43f5e', size: 10 },
                overlaying: 'y',
                side: 'right',
                range: [0, 105],
                showgrid: false,
            },
            showlegend: false,
        };

        Plotly.newPlot(el, traces, layout, PLOTLY_CONFIG);
    }

    /**
     * Renderiza o Donut Chart — Força na Praça Principal.
     */
    function renderMarketShareDonut(containerId, data, subtitleId) {
        const el = document.getElementById(containerId);
        if (!el) return;

        // Atualizar subtítulo com nome da cidade
        const subtitleEl = document.getElementById(subtitleId);
        if (subtitleEl && data.cidade) {
            subtitleEl.textContent = `Market share em ${data.cidade}`;
        }

        if (!data.cidade || data.operadora_vidas === 0) {
            el.innerHTML = '<p style="color:#64748b;text-align:center;padding:40px;">Sem dados para exibir</p>';
            return;
        }

        const traces = [{
            type: 'pie',
            labels: ['Operadora Selecionada', 'Restante do Mercado'],
            values: [data.operadora_vidas, data.mercado_vidas],
            hole: 0.6,
            marker: {
                colors: ['#3b82f6', 'rgba(100, 116, 139, 0.3)'],
                line: { color: 'rgba(10, 14, 26, 0.8)', width: 2 },
            },
            textinfo: 'percent',
            textposition: 'inside',
            textfont: { color: '#f1f5f9', size: 12, family: "'Inter', sans-serif" },
            hovertemplate: '<b>%{label}</b><br>Vidas: %{value:,.0f}<br>Share: %{percent}<extra></extra>',
            rotation: 90,
        }];

        // Anotação central
        const layout = {
            ...BASE_LAYOUT,
            margin: { l: 10, r: 10, t: 10, b: 30 },
            showlegend: true,
            legend: {
                font: { size: 10, color: '#94a3b8' },
                bgcolor: 'rgba(0,0,0,0)',
                orientation: 'h',
                x: 0.5,
                xanchor: 'center',
                y: -0.1,
            },
            annotations: [{
                text: `<b>${data.operadora_share}%</b>`,
                font: { size: 28, color: '#3b82f6', family: "'Inter', sans-serif" },
                showarrow: false,
                x: 0.5,
                y: 0.5,
            }],
        };

        Plotly.newPlot(el, traces, layout, PLOTLY_CONFIG);
    }

    return {
        renderGauge,
        renderRankingBars,
        renderModalidadePie,
        renderParetoChart,
        renderMarketShareDonut,
        fmtNum,
    };
})();
