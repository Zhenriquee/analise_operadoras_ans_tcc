window.chartMunicipios = null;

function renderizarMunicipios(dadosMunicipios, registroAns) {
    if (!dadosMunicipios || !dadosMunicipios.valores) {
        window.DashboardUtils.exibirMensagemVazia('grafico-municipios');
        return;
    }

    const options = {
        series: [{ name: 'Vidas', data: dadosMunicipios.valores }],
        chart: {
            type: 'bar', height: 400, toolbar: { show: false },
            events: {
                // Evento de clique para atualizar a Pirâmide
                dataPointSelection: function(event, chartContext, config) {
                    let cod = dadosMunicipios.codigos[config.dataPointIndex];
                    let nome = dadosMunicipios.labels[config.dataPointIndex];

                    document.querySelector("#titulo-piramide").innerHTML = 
                        `Perfil Demográfico <span class="text-slate-700 bg-slate-200 px-2 py-0.5 rounded text-[11px] font-semibold ml-2">Filtro: ${nome}</span>
                        <button onclick="resetarPiramide()" class="ml-2 text-[10px] bg-white border border-slate-300 px-2 py-0.5 rounded shadow-sm hover:bg-slate-50 transition-colors">Limpar</button>`;

                    fetch(`/dashboard/${registroAns}/piramide?municipio=${cod}`)
                        .then(res => res.json())
                        .then(data => {
                            if (window.chartPiramide && data) {
                                window.chartPiramide.updateSeries([
                                    { name: 'Masculino', data: data.homens },
                                    { name: 'Feminino', data: data.mulheres }
                                ]);
                            }
                        });
                }
            }
        },
        colors: ['#0ea5e9'],
        plotOptions: { bar: { horizontal: true, borderRadius: 3 } },
        dataLabels: { 
            enabled: true, 
            offsetX: 0, 
            formatter: val => window.DashboardUtils.formatarAbreviado(val), 
            style: { 
                fontSize: '11px', 
                colors: ['#ffffff'], // Cor branca para contraste com a barra azul
                fontWeight: 'bold'
            },
            dropShadow: {
                enabled: true,
                top: 1,
                left: 1,
                blur: 1,
                color: '#000000',
                opacity: 0.3
            }
        },
        stroke: { show: true, width: 1, colors: ['#fff'] },
        xaxis: { 
            categories: dadosMunicipios.labels, 
            labels: { formatter: val => window.DashboardUtils.formatarAbreviado(val) } 
        },
        tooltip: { y: { formatter: val => val.toLocaleString('pt-BR') + ' vidas' } }
    };

    if (window.chartMunicipios) window.chartMunicipios.destroy();
    window.chartMunicipios = new ApexCharts(document.querySelector("#grafico-municipios"), options);
    window.chartMunicipios.render();
}

function resetarMunicipios() {
    const dadosGraficos = JSON.parse(document.getElementById('dados-geral').textContent);
    document.querySelector("#titulo-municipios").innerHTML = `Presença Geográfica`;
    if (window.chartMunicipios) {
        window.chartMunicipios.updateSeries([{ name: 'Vidas', data: dadosGraficos.municipios.valores }]);
        window.chartMunicipios.updateOptions({ xaxis: { categories: dadosGraficos.municipios.labels } });
    }
}

// Auto-inicialização independente
document.addEventListener('DOMContentLoaded', () => {
    const rawData = document.getElementById('dados-geral');
    if (rawData) {
        const dados = JSON.parse(rawData.textContent);
        renderizarMunicipios(dados.municipios, dados.registro_ans);
    }
});