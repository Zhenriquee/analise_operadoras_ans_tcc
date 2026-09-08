let chartPiramide = null;
let chartMunicipios = null;

function formatarAbreviado(val) {
    const abs = Math.abs(val);
    if (abs >= 1000000) return (abs / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'M';
    if (abs >= 1000) return (abs / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + 'k';
    return abs.toLocaleString('pt-BR');
}

function exibirMensagemVazia(idElemento) {
    const elemento = document.getElementById(idElemento);
    if (elemento) {
        elemento.innerHTML = `<div class="flex items-center justify-center h-full w-full text-slate-400 italic text-sm">
                                Nenhum dado detalhado encontrado.
                              </div>`;
    }
}

// ----------------------------------------------------
// 1. PIRÂMIDE (AGORA COM EVENTO DE CLIQUE)
// ----------------------------------------------------
function renderizarPiramide(dadosPiramide, registroAns) {
    if (!dadosPiramide || !dadosPiramide.homens) {
        exibirMensagemVazia('grafico-piramide'); return;
    }

    const options = {
        series: [
            { name: 'Masculino', data: dadosPiramide.homens },
            { name: 'Feminino', data: dadosPiramide.mulheres }
        ],
        chart: {
            type: 'bar',
            height: 380,
            stacked: true,
            toolbar: { show: false },
            events: {
                // MÁGICA 2: CLICOU NA IDADE, FILTRA OS MUNICÍPIOS!
                dataPointSelection: function(event, chartContext, config) {
                    let seriesIndex = config.seriesIndex; // 0 = Masculino, 1 = Feminino
                    let dataPointIndex = config.dataPointIndex; // 0 a 9 (Qual faixa de idade)
                    
                    let prefixo = seriesIndex === 0 ? 'masculino' : 'feminino';
                    let sufixos = ['0_18', '19_23', '24_28', '29_33', '34_38', '39_43', '44_48', '49_53', '54_58', '59_mais'];
                    
                    // Monta o nome exato da coluna do seu Parquet
                    let colunaSelecionada = prefixo + '_' + sufixos[dataPointIndex];
                    
                    let nomeSexo = seriesIndex === 0 ? 'Masculino' : 'Feminino';
                    let nomeFaixa = dadosPiramide.faixas[dataPointIndex];
                    
                    // Feedback visual na tela
                    document.querySelector("#grafico-municipios").previousElementSibling.innerHTML = 
                        `Presença Geográfica <span class="text-slate-700 bg-slate-200 px-2 py-1 rounded text-sm font-semibold ml-2">Filtro: ${nomeSexo} - ${nomeFaixa}</span>
                        <button onclick="resetarFiltroMunicipios()" class="ml-2 text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-2 py-1 rounded cursor-pointer transition-colors shadow-sm">Remover Filtro</button>`;
                    
                    // Chama a API do Flask que nós criamos
                    fetch(`/dashboard/${registroAns}/municipios?coluna=${colunaSelecionada}`)
                        .then(response => response.json())
                        .then(novosMuni => {
                            if (novosMuni && chartMunicipios) {
                                // Atualiza o gráfico do lado suavemente!
                                chartMunicipios.updateSeries([{ name: 'Vidas', data: novosMuni.valores }]);
                                chartMunicipios.updateOptions({ xaxis: { categories: novosMuni.labels } });
                            }
                        })
                        .catch(err => console.error("Erro ao filtrar:", err));
                }
            }
        },
        colors: ['#3b82f6', '#ec4899'],
        plotOptions: { bar: { horizontal: true, barHeight: '80%' } },
        dataLabels: { 
            enabled: true,
            formatter: function (val) { return formatarAbreviado(Math.abs(val)); },
            style: { fontSize: '11px', colors: ['#fff'] }
        }, 
        stroke: { width: 1, colors: ["#fff"] },
        grid: { xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
        yaxis: { title: { text: undefined } },
        xaxis: {
            categories: dadosPiramide.faixas,
            labels: { formatter: function (val) { return formatarAbreviado(Math.abs(val)); } }
        },
        tooltip: {
            shared: false,
            y: { formatter: function (val) { return Math.abs(val).toLocaleString('pt-BR') + " vidas"; } }
        }
    };

    if (chartPiramide) chartPiramide.destroy();
    chartPiramide = new ApexCharts(document.querySelector("#grafico-piramide"), options);
    chartPiramide.render();
}

// ----------------------------------------------------
// 2. MUNICÍPIOS
// ----------------------------------------------------
function renderizarMunicipios(dadosMunicipios, registroAns) {
    if (!dadosMunicipios || !dadosMunicipios.valores) {
        exibirMensagemVazia('grafico-municipios'); return;
    }

    const options = {
        series: [{ name: 'Vidas', data: dadosMunicipios.valores }],
        chart: {
            type: 'bar',
            height: 380,
            toolbar: { show: false },
            events: {
                dataPointSelection: function(event, chartContext, config) {
                    let index = config.dataPointIndex;
                    let codMunicipio = dadosMunicipios.codigos[index];
                    let nomeMuni = dadosMunicipios.labels[index];

                    document.querySelector("#grafico-piramide").previousElementSibling.innerHTML = 
                        `Perfil Demográfico <span class="text-slate-700 bg-slate-200 px-2 py-1 rounded text-sm font-semibold ml-2">Filtro: ${nomeMuni}</span>
                        <button onclick="resetarFiltroPiramide()" class="ml-2 text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-2 py-1 rounded cursor-pointer transition-colors shadow-sm">Remover Filtro</button>`;

                    fetch(`/dashboard/${registroAns}/piramide?municipio=${codMunicipio}`)
                        .then(response => response.json())
                        .then(novaPiramide => {
                            if (novaPiramide && chartPiramide) {
                                chartPiramide.updateSeries([
                                    { name: 'Masculino', data: novaPiramide.homens },
                                    { name: 'Feminino', data: novaPiramide.mulheres }
                                ]);
                            }
                        });
                }
            }
        },
        colors: ['#0ea5e9'],
        plotOptions: { bar: { horizontal: true, borderRadius: 4, dataLabels: { position: 'top' } } },
        dataLabels: {
            enabled: true, offsetX: 25,
            style: { fontSize: '11px', colors: ['#64748b'] },
            formatter: function(val) { return formatarAbreviado(val); }
        },
        stroke: { show: true, width: 1, colors: ['#fff'] },
        xaxis: { categories: dadosMunicipios.labels, labels: { formatter: function(val) { return formatarAbreviado(val); } } },
        tooltip: { y: { formatter: function (val) { return val.toLocaleString('pt-BR') + ' vidas'; } } }
    };

    if (chartMunicipios) chartMunicipios.destroy();
    chartMunicipios = new ApexCharts(document.querySelector("#grafico-municipios"), options);
    chartMunicipios.render();
}

// ----------------------------------------------------
// FUNÇÕES DE RESET
// ----------------------------------------------------
function resetarFiltroPiramide() {
    const dadosGraficos = JSON.parse(document.getElementById('dados-dashboard').textContent);
    document.querySelector("#grafico-piramide").previousElementSibling.innerHTML = 
        `<span class="text-base font-bold text-slate-800">Perfil Demográfico</span>
         <p class="text-xs text-slate-500 mt-1">Distribuição de beneficiários por idade e gênero.</p>`;
    
    if (chartPiramide) {
        chartPiramide.updateSeries([
            { name: 'Masculino', data: dadosGraficos.piramide.homens },
            { name: 'Feminino', data: dadosGraficos.piramide.mulheres }
        ]);
    }
}

function resetarFiltroMunicipios() {
    const dadosGraficos = JSON.parse(document.getElementById('dados-dashboard').textContent);
    document.querySelector("#grafico-municipios").previousElementSibling.innerHTML = 
        `<span class="text-base font-bold text-slate-800">Presença Geográfica</span>
         <p class="text-xs text-slate-500 mt-1">Top 10 municípios com mais beneficiários ativos.</p>`;
         
    if (chartMunicipios) {
        chartMunicipios.updateSeries([{ name: 'Vidas', data: dadosGraficos.municipios.valores }]);
        chartMunicipios.updateOptions({ xaxis: { categories: dadosGraficos.municipios.labels } });
    }
}

// ----------------------------------------------------
// BOOTSTRAP
// ----------------------------------------------------
function iniciar() {
    const scriptDados = document.getElementById('dados-dashboard');
    if (!scriptDados) return;

    let dadosGraficos;
    try {
        dadosGraficos = JSON.parse(scriptDados.textContent);
    } catch (e) { return; }

    // Agora passamos o registro_ans para as DUAS funções de renderização
    renderizarPiramide(dadosGraficos.piramide, dadosGraficos.registro_ans);
    renderizarMunicipios(dadosGraficos.municipios, dadosGraficos.registro_ans);
}

document.addEventListener('DOMContentLoaded', iniciar);