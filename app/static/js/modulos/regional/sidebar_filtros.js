window.SidebarFiltros = {
    isCollapsed: false,

    init: function() {
        const btnToggle = document.getElementById('btn-toggle-sidebar');
        if (btnToggle) {
            // Removemos o onclick do HTML e adicionamos o ouvinte de evento aqui!
            btnToggle.addEventListener('click', () => this.toggle());
        }
    },

    toggle: function() {
        const sidebar = document.getElementById('sidebar-filtros');
        const content = document.getElementById('sidebar-content');
        const icon = document.getElementById('btn-toggle-icon'); // A setinha
        const title = document.getElementById('sidebar-title');
        
        const isDesktop = window.innerWidth >= 1280; // Breakpoint XL
        this.isCollapsed = !this.isCollapsed;

        if (this.isCollapsed) {
            // === AÇÃO: ENCOLHER ===
            if (isDesktop) {
                sidebar.classList.remove('xl:w-72');
                sidebar.classList.add('xl:w-[4.2rem]');
            }
            
            // Inicia o fade-out do conteúdo, título e setinha
            content.classList.remove('opacity-100');
            content.classList.add('opacity-0');
            title.classList.remove('opacity-100');
            title.classList.add('opacity-0');
            icon.classList.remove('opacity-100');
            icon.classList.add('opacity-0');
            
            // Oculta completamente do layout após a animação
            setTimeout(() => { 
                content.classList.add('hidden'); 
                title.classList.add('hidden'); 
                icon.classList.add('hidden'); // Esconde a setinha para não sobrepor
            }, 300); 
            
        } else {
            // === AÇÃO: EXPANDIR ===
            content.classList.remove('hidden');
            title.classList.remove('hidden');
            icon.classList.remove('hidden'); // Traz a setinha de volta
            
            // Força o navegador a processar a remoção do hidden antes do fade-in
            void content.offsetWidth;

            if (isDesktop) {
                sidebar.classList.remove('xl:w-[4.2rem]');
                sidebar.classList.add('xl:w-72');
            }
            
            // Inicia o fade-in
            content.classList.remove('opacity-0');
            content.classList.add('opacity-100');
            title.classList.remove('opacity-0');
            title.classList.add('opacity-100');
            icon.classList.remove('opacity-0');
            icon.classList.add('opacity-100');
        }
        
        // Dispara o resize para os gráficos acompanharem o movimento
        let startTime = Date.now();
        const resizeInterval = setInterval(() => {
            window.dispatchEvent(new Event('resize'));
            if (Date.now() - startTime > 320) {
                clearInterval(resizeInterval);
            }
        }, 20);
    }
};

// Auto-inicialização quando o documento carregar
document.addEventListener('DOMContentLoaded', () => window.SidebarFiltros.init());