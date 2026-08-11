/**
 * charts.js — Funções de criação de gráficos Plotly.js.
 * Tema dark premium executivo.
 */

const Charts = (() => {
    // Paleta Dark Premium
    const COLORS = {
        primary: '#635bff',
        accent: '#0cbc8b',
        blue: '#3a86ff',
        amber: '#e68a00',
        red: '#d9534f',
        textMain: '#f8f9fa',
        textMuted: '#8892b0',
        grid: '#212530',
        bg: 'rgba(0,0,0,0)'
    };

    const BASE_LAYOUT = {
        paper_bgcolor: COLORS.bg,
        plot_bgcolor: COLORS.bg,
        font: { family: "'Inter', sans-serif", color: COLORS.textMuted, size: 12 },
        margin: { l: 20, r: 20, t: 20, b: 20 },
        showlegend: false,
        autosize: true,
    };

    const CFG = { responsive: true, displayModeBar: false };

    function fmtNum(n) {
        if (n === null || n === undefined) return '—';
        return n.toLocaleString('pt-BR');
    }

    /**
     * Aba 1: Top 10 Municípios (Barras Horizontais com Gradiente)
     */
    function renderTop10Bars(containerId, data) {
        const el = document.getElementById(containerId);
        if (!el) return;

        if (!data || !data.length) {
            el.innerHTML = `<p style="color:${COLORS.textMuted};text-align:center;padding:60px 0;">Nenhum dado encontrado</p>`;
            return;
        }

        const reversed = [...data].reverse();

        Plotly.newPlot(el, [{
            type: 'bar',
            y: reversed.map(d => {
                const s = d.municipio;
                return s.length > 25 ? s.substring(0, 25) + '…' : s;
            }),
            x: reversed.map(d => d.qtd_beneficiarios),
            orientation: 'h',
            marker: { 
                color: COLORS.primary,
                opacity: 0.85,
                line: { color: COLORS.primary, width: 1 }
            },
            text: reversed.map(d => `${fmtNum(d.qtd_beneficiarios)} (${d.percentual}%)`),
            textposition: 'outside',
            cliponaxis: false,
            textfont: { color: COLORS.textMain, size: 11 },
            hovertemplate: '<b>%{y}</b><br>Beneficiários: %{x:,.0f}<extra></extra>',
        }], {
            ...BASE_LAYOUT,
            margin: { l: 10, r: 100, t: 10, b: 20 },
            xaxis: {
                gridcolor: COLORS.grid, 
                tickfont: { color: COLORS.textMuted, size: 10 },
                zeroline: false, automargin: true,
            },
            yaxis: {
                tickfont: { color: COLORS.textMain, size: 11 }, 
                automargin: true,
            },
        }, CFG);
    }

    /**
     * Aba 2: Gráfico de Dispersão de Oportunidade
     */
    function renderScatterOportunidade(containerId, data) {
        const el = document.getElementById(containerId);
        if (!el) return;

        if (!data || !data.length) {
            el.innerHTML = `<p style="color:${COLORS.textMuted};text-align:center;padding:60px 0;">Nenhum dado de mercado encontrado</p>`;
            return;
        }

        // Mapear cores dos clusters
        // 0: Oceano Azul (blue), 1: Saturado Premium (amber), 2: Monopólio (primary), 3: Armadilha (red)
        const clusterColors = {
            0: COLORS.blue,
            1: COLORS.amber,
            2: COLORS.primary,
            3: COLORS.red
        };

        const clusterNames = {
            0: "Oceano Azul",
            1: "Saturado Premium",
            2: "Fortaleza Monopolista",
            3: "Armadilha Pulverizada"
        };

        // Agrupar traces por cluster para gerar a legenda corretamente
        const traces = [];
        for (let i = 0; i <= 3; i++) {
            const clusterData = data.filter(d => d.cluster === i);
            if (clusterData.length > 0) {
                // Escalar o tamanho da bolha para ficar visível mas não gigante
                const sizes = clusterData.map(d => Math.max(8, Math.sqrt(d.tamanho) / 10));
                
                traces.push({
                    type: 'scatter',
                    mode: 'markers',
                    name: clusterNames[i],
                    x: clusterData.map(d => d.x_densidade_clt),
                    y: clusterData.map(d => d.y_hhi),
                    text: clusterData.map(d => d.municipio),
                    customdata: clusterData.map(d => [d.tamanho, d.nome_perfil]),
                    marker: {
                        size: sizes,
                        color: clusterColors[i],
                        opacity: 0.7,
                        line: { color: COLORS.textMain, width: 0.5 }
                    },
                    hovertemplate: 
                        '<b>%{text}</b><br>' +
                        'Cluster: %{customdata[1]}<br>' +
                        'Densidade CLT: %{x:.2f}<br>' +
                        'HHI: %{y:.2f}<br>' +
                        'Pop Alvo Pagante: %{customdata[0]:,.0f}' +
                        '<extra></extra>'
                });
            }
        }

        Plotly.newPlot(el, traces, {
            ...BASE_LAYOUT,
            showlegend: true,
            legend: { 
                orientation: 'h', y: -0.15, x: 0.5, xanchor: 'center',
                font: { color: COLORS.textMain }
            },
            xaxis: {
                title: 'Densidade CLT (Potencial B2B)',
                gridcolor: COLORS.grid, 
                zerolinecolor: COLORS.grid,
                tickfont: { color: COLORS.textMuted }
            },
            yaxis: {
                title: 'Índice HHI (Concentração/Monopólio)',
                gridcolor: COLORS.grid, 
                zerolinecolor: COLORS.grid,
                tickfont: { color: COLORS.textMuted }
            },
            hovermode: 'closest'
        }, CFG);
    }

    /**
     * Aba 3: Tendência CAGED (Termômetro Econômico)
     */
    function renderTendenciaCAGED(containerId, data) {
        const el = document.getElementById(containerId);
        if (!el) return;

        if (!data || !data.length) {
            el.innerHTML = `<p style="color:${COLORS.textMuted};text-align:center;padding:60px 0;">Nenhuma área de expansão ou dados CAGED identificados.</p>`;
            return;
        }

        const labels = data.map(d => d.competencia);
        
        const traceAdmissoes = {
            x: labels,
            y: data.map(d => d.admissoes),
            name: 'Admissões',
            type: 'bar',
            marker: { color: COLORS.accent, opacity: 0.8 },
            hovertemplate: 'Admissões: %{y:,.0f}<extra></extra>'
        };

        const traceDeslig = {
            x: labels,
            y: data.map(d => -d.desligamentos), // Negativo para espelhar para baixo
            name: 'Desligamentos',
            type: 'bar',
            marker: { color: COLORS.red, opacity: 0.8 },
            hovertemplate: 'Desligamentos: %{y:,.0f}<extra></extra>'
        };

        const traceSaldo = {
            x: labels,
            y: data.map(d => d.saldo),
            name: 'Saldo Final',
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: COLORS.primary, width: 3 },
            marker: { size: 8, color: COLORS.textMain },
            hovertemplate: '<b>Saldo: %{y:,.0f}</b><extra></extra>'
        };

        Plotly.newPlot(el, [traceAdmissoes, traceDeslig, traceSaldo], {
            ...BASE_LAYOUT,
            barmode: 'relative',
            showlegend: true,
            legend: { 
                orientation: 'h', y: 1.1, x: 0.5, xanchor: 'center',
                font: { color: COLORS.textMain }
            },
            xaxis: {
                gridcolor: COLORS.grid,
                tickfont: { color: COLORS.textMuted },
                tickangle: -45
            },
            yaxis: {
                gridcolor: COLORS.grid,
                zerolinecolor: COLORS.textMuted,
                zerolinewidth: 1,
                tickfont: { color: COLORS.textMuted }
            }
        }, CFG);
    }

    return { fmtNum, renderTop10Bars, renderScatterOportunidade, renderTendenciaCAGED };
})();
