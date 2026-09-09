// Variável global atrelada à janela (window) para permitir o Cross-Filtering entre arquivos
window.chartPiramide = null;

function renderizarPiramide(dadosPiramide, registroAns) {
    if (!dadosPiramide || !dadosPiramide.homens) {
        window.DashboardUtils.exibirMensagemVazia('grafico-piramide');
        return;
    }

    const options = {
        series: [
            { name: 'Masculino', data: dadosPiramide.homens },
            { name: 'Feminino', data: dadosPiramide.mulheres }
        ],
        chart: {
            type: 'bar', height: 400, stacked: true, toolbar: { show: false },
            events: {
                // Evento de clique para atualizar os Municípios
                dataPointSelection: function(event, chartContext, config) {
                    let prefixo = config.seriesIndex === 0 ? 'masculino' : 'feminino';
                    let sufixos = ['0_18', '19_23', '24_28', '29_33', '34_38', '39_43', '44_48', '49_53', '54_58', '59_mais'];
                    let coluna = prefixo + '_' + sufixos[config.dataPointIndex];
                    let sexo = config.seriesIndex === 0 ? 'Masculino' : 'Feminino';
                    let faixa = dadosPiramide.faixas[config.dataPointIndex];
                    
                    document.querySelector("#titulo-municipios").innerHTML = 
                        `Presença Geográfica <span class="text-slate-700 bg-slate-200 px-2 py-0.5 rounded text-[11px] font-semibold ml-2">Filtro: ${sexo} - ${faixa}</span>
                        <button onclick="resetarMunicipios()" class="ml-2 text-[10px] bg-white border border-slate-300 px-2 py-0.5 rounded shadow-sm hover:bg-slate-50 transition-colors">Limpar</button>`;

                    fetch(`/dashboard/${registroAns}/municipios?coluna=${coluna}`)
                        .then(res => res.json())
                        .then(data => {
                            if (window.chartMunicipios && data) {
                                window.chartMunicipios.updateSeries([{ name: 'Vidas', data: data.valores }]);
                                window.chartMunicipios.updateOptions({ xaxis: { categories: data.labels } });
                            }
                        });
                }
            }
        },
        colors: ['#3b82f6', '#ec4899'],
        plotOptions: { bar: { horizontal: true, barHeight: '80%' } },
        dataLabels: { 
            enabled: true, 
            formatter: val => window.DashboardUtils.formatarAbreviado(Math.abs(val)), 
            style: { fontSize: '10px' } 
        }, 
        stroke: { width: 1, colors: ["#fff"] },
        grid: { xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
        yaxis: { title: { text: undefined } },
        xaxis: {
            categories: dadosPiramide.faixas,
            labels: { formatter: val => window.DashboardUtils.formatarAbreviado(Math.abs(val)) }
        },
        tooltip: { y: { formatter: val => Math.abs(val).toLocaleString('pt-BR') + " vidas" } }
    };

    if (window.chartPiramide) window.chartPiramide.destroy();
    window.chartPiramide = new ApexCharts(document.querySelector("#grafico-piramide"), options);
    window.chartPiramide.render();
}

function resetarPiramide() {
    const dadosGraficos = JSON.parse(document.getElementById('dados-geral').textContent);
    document.querySelector("#titulo-piramide").innerHTML = `Perfil Demográfico`;
    if (window.chartPiramide) {
        window.chartPiramide.updateSeries([
            { name: 'Masculino', data: dadosGraficos.piramide.homens },
            { name: 'Feminino', data: dadosGraficos.piramide.mulheres }
        ]);
    }
}

// Auto-inicialização independente
document.addEventListener('DOMContentLoaded', () => {
    const rawData = document.getElementById('dados-geral');
    if (rawData) {
        const dados = JSON.parse(rawData.textContent);
        renderizarPiramide(dados.piramide, dados.registro_ans);
    }
});