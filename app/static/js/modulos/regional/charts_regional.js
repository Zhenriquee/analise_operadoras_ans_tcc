window.chartPareto = null;
window.chartCobertura = null;
window.chartFaixas = null;

window.ChartsRegional = {
    renderizarPareto: function(dadosPareto) {
        if (!dadosPareto) return;
        
        const options = {
            series: [
                { name: 'Operadora Analisada', type: 'column', data: dadosPareto.alvo },
                { name: 'Outras Operadoras', type: 'column', data: dadosPareto.outros },
                { name: 'Acumulado (%)', type: 'line', data: dadosPareto.linha }
            ],
            chart: { type: 'line', height: 320, stacked: true, toolbar: { show: false } },
            stroke: { width: [0, 0, 3], curve: 'smooth' },
            colors: ['#3b82f6', '#94a3b8', '#ec4899'],
            plotOptions: { bar: { columnWidth: '60%', borderRadius: 2 } },
            xaxis: { categories: dadosPareto.labels, labels: { trim: true, style: { fontSize: '10px' } } },
            yaxis: [
                // Eixo 1: Barra Azul
                { 
                    seriesName: 'Operadora Analisada',
                    title: { text: 'Qtd Vidas', style: { fontSize: '10px' } }, 
                    labels: { formatter: val => window.DashboardUtils.formatarAbreviado(val) } 
                },
                // Eixo 2: Barra Cinza (invisível, mas apontando para o Eixo 1 para usar a mesma escala!)
                { 
                    seriesName: 'Operadora Analisada', 
                    show: false 
                }, 
                // Eixo 3: Linha de Pareto
                { 
                    seriesName: 'Acumulado (%)',
                    opposite: true, 
                    min: 0, // FORÇA O EIXO A COMEÇAR DO ZERO
                    max: 100, 
                    title: { text: 'Acumulado (%)', style: { fontSize: '10px' } } 
                }
            ],
            // ADICIONE ESTE BLOCO AQUI PARA A LINHA DE 80%
            annotations: {
                yaxis: [
                    {
                        y: 80,
                        yAxisIndex: 2, // Atrela ao terceiro eixo Y (Acumulado %)
                        borderColor: '#063ed8', // Cinza para ficar sutil
                        strokeDashArray: 5,     // Cria o efeito tracejado
                        label: {
                            borderColor: '#94a3b8',
                            style: {
                                color: '#ffffff',
                                background: '#94a3b8',
                                fontSize: '10px',
                                fontWeight: 'bold'
                            },
                            text: '80% (Pareto)',
                            position: 'left',
                            offsetX: 10
                        }
                    }
                ]
            },

            dataLabels: { enabled: false },
            legend: { show: true, position: 'bottom' }
        };

        if (window.chartPareto) window.chartPareto.destroy();
        window.chartPareto = new ApexCharts(document.querySelector("#grafico-pareto"), options);
        window.chartPareto.render();
    },

    renderizarCobertura: function(dadosCobertura) {
        if (!dadosCobertura) return;

        const options = {
            series: dadosCobertura,
            chart: { type: 'radialBar', height: 320 },
            plotOptions: {
                radialBar: {
                    hollow: { size: '60%' },
                    dataLabels: { 
                        name: { show: false }, 
                        value: { fontSize: '28px', fontWeight: 'bold', color: '#0f172a', formatter: function (val) { return val + "%" } } 
                    },
                    track: { background: '#f1f5f9' }
                }
            },
            colors: ['#10b981'],
            stroke: { lineCap: 'round' }
        };

        if (window.chartCobertura) window.chartCobertura.destroy();
        window.chartCobertura = new ApexCharts(document.querySelector("#grafico-cobertura"), options);
        window.chartCobertura.render();
    },

    renderizarFaixas: function(dadosFaixas) {
        if (!dadosFaixas) return;

        const options = {
            series: [
                { name: 'Habitantes (População)', data: dadosFaixas.populacao },
                { name: 'Possuem Plano (Mercado)', data: dadosFaixas.mercado },
                { name: 'Desta Operadora', data: dadosFaixas.operadora }
            ],
            chart: { type: 'bar', height: 350, toolbar: { show: false } },
            plotOptions: { bar: { horizontal: false, columnWidth: '65%', borderRadius: 2 } },
            dataLabels: { enabled: false },
            stroke: { show: true, width: 2, colors: ['transparent'] },
            colors: ['#cbd5e1', '#64748b', '#3b82f6'], // Cinza Claro, Cinza Escuro, Azul
            xaxis: { categories: dadosFaixas.categorias },
            yaxis: { labels: { formatter: val => window.DashboardUtils.formatarAbreviado(val) } },
            tooltip: { y: { formatter: function (val) { return val.toLocaleString('pt-BR') } } },
            legend: { position: 'top' }
        };

        if (window.chartFaixas) window.chartFaixas.destroy();
        window.chartFaixas = new ApexCharts(document.querySelector("#grafico-faixas"), options);
        window.chartFaixas.render();
    }
};