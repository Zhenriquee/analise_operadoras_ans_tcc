function formatarAbreviado(val) {
    const abs = Math.abs(val);
    if (abs >= 1000000) return (abs / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'M';
    if (abs >= 1000) return (abs / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + 'k';
    return abs.toLocaleString('pt-BR');
}

function inicializarGraficos() {
    const scriptDados = document.getElementById('dados-dashboard');
    if (!scriptDados) {
        console.error("Elemento de dados não encontrado no HTML.");
        return; 
    }

    let dadosGraficos;
    try {
        dadosGraficos = JSON.parse(scriptDados.textContent);
        console.log("📊 Dados recebidos do Python: ", dadosGraficos);
    } catch (erro) {
        console.error("Erro ao ler os dados do Python:", erro);
        return;
    }

    // Função auxiliar para mostrar mensagem amigável quando não houver dados
    function exibirMensagemVazia(idElemento) {
        const elemento = document.getElementById(idElemento);
        if (elemento) {
            elemento.innerHTML = `<div class="flex items-center justify-center h-full w-full text-slate-400 italic text-sm">
                                    Nenhum dado detalhado encontrado para esta operadora no período.
                                  </div>`;
        }
    }

    // ==========================================
    // 1. Renderiza a Pirâmide Etária
    // ==========================================
    if (dadosGraficos.piramide && dadosGraficos.piramide.homens && dadosGraficos.piramide.mulheres) {
        const traceHomens = {
            x: dadosGraficos.piramide.homens,
            y: dadosGraficos.piramide.faixas,
            name: 'Masculino',
            orientation: 'h',
            type: 'bar',
            marker: { color: '#3b82f6' },
            hoverinfo: 'y+text',
            text: dadosGraficos.piramide.homens.map(v => Math.abs(v).toLocaleString('pt-BR'))
        };

        const traceMulheres = {
            x: dadosGraficos.piramide.mulheres,
            y: dadosGraficos.piramide.faixas,
            name: 'Feminino',
            orientation: 'h',
            type: 'bar',
            marker: { color: '#ec4899' },
            hoverinfo: 'y+text',
            text: dadosGraficos.piramide.mulheres.map(v => v.toLocaleString('pt-BR'))
        };

        // Calcula escala simétrica dinâmica baseada no valor máximo
        const maxH = Math.max(...dadosGraficos.piramide.homens.map(Math.abs), 0);
        const maxM = Math.max(...dadosGraficos.piramide.mulheres.map(Math.abs), 0);
        const maxVal = Math.max(maxH, maxM) || 100;
        
        const magnitude = Math.pow(10, Math.max(0, Math.floor(Math.log10(maxVal))));
        const stepUnit = magnitude >= 10 ? magnitude / 2 : 1;
        const step = Math.ceil((maxVal / 2) / stepUnit) * stepUnit;
        const tickvals = [-step * 2, -step, 0, step, step * 2];
        const ticktext = tickvals.map(v => formatarAbreviado(v));

        const layoutPiramide = {
            barmode: 'relative',
            margin: { l: 70, r: 20, t: 20, b: 40 },
            xaxis: {
                tickvals: tickvals,
                ticktext: ticktext,
                range: [-step * 2.1, step * 2.1],
                zeroline: true,
                zerolinecolor: '#cbd5e1'
            },
            yaxis: { title: 'Faixa Etária' },
            legend: { orientation: "h", y: -0.2 }
        };

        Plotly.newPlot('grafico-piramide', [traceHomens, traceMulheres], layoutPiramide, {responsive: true});
    } else {
        exibirMensagemVazia('grafico-piramide');
    }

    // ==========================================
    // 2. Renderiza os Top 10 Municípios
    // ==========================================
    if (dadosGraficos.municipios && dadosGraficos.municipios.valores && dadosGraficos.municipios.valores.length > 0) {
        const traceMunicipios = {
            x: dadosGraficos.municipios.valores,
            y: dadosGraficos.municipios.labels,
            type: 'bar',
            orientation: 'h',
            marker: { color: '#0ea5e9' },
            hoverinfo: 'y+x',
            text: dadosGraficos.municipios.valores.map(v => v.toLocaleString('pt-BR')),
            textposition: 'auto'
        };

        const layoutMunicipios = {
            margin: { l: 140, r: 30, t: 20, b: 40 },
            xaxis: { title: 'Qtd. Vidas' }
        };

        Plotly.newPlot('grafico-municipios', [traceMunicipios], layoutMunicipios, {responsive: true});
    } else {
        exibirMensagemVazia('grafico-municipios');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarGraficos);
} else {
    inicializarGraficos();
}