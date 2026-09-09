window.ModuloRegional = {
    init: function() {
        const rawData = document.getElementById('dados-regiao');
        if (!rawData) return;
        
        try {
            const dados = JSON.parse(rawData.textContent);
            window.ChartsRegional.renderizarPareto(dados.grafico_pareto);
            window.ChartsRegional.renderizarCobertura(dados.grafico_cobertura);
            window.ChartsRegional.renderizarFaixas(dados.grafico_faixas);
        } catch (error) {
            console.error("Erro ao renderizar gráficos da região:", error);
        }
    }
};

// Tenta iniciar no primeiro load da página (se não vier via HTMX)
document.addEventListener('DOMContentLoaded', () => window.ModuloRegional.init());