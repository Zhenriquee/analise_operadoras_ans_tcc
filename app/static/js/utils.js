window.DashboardUtils = {
    formatarAbreviado: function(val) {
        const abs = Math.abs(val);
        if (abs >= 1000000) return (abs / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'M';
        if (abs >= 1000) return (abs / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + 'k';
        return abs.toLocaleString('pt-BR');
    },

    exibirMensagemVazia: function(idElemento) {
        const elemento = document.getElementById(idElemento);
        if (elemento) {
            elemento.innerHTML = `<div class="flex items-center justify-center h-full w-full text-slate-400 italic text-sm">
                                    Nenhum dado detalhado encontrado.
                                  </div>`;
        }
    }
};