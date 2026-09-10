window.SidebarFiltrosMapa = {
    isCollapsed: false,

    init: function() {
        const btnToggle = document.getElementById('btn-toggle-sidebar');
        if (btnToggle) {
            btnToggle.addEventListener('click', () => this.toggle());
        }
    },

    toggle: function() {
        const sidebar = document.getElementById('sidebar-filtros');
        const content = document.getElementById('sidebar-content');
        const icon = document.getElementById('btn-toggle-icon');
        const title = document.getElementById('sidebar-title');
        
        const isDesktop = window.innerWidth >= 1280; // Breakpoint XL
        this.isCollapsed = !this.isCollapsed;

        if (this.isCollapsed) {
            // ENCOLHER
            if (isDesktop) {
                sidebar.classList.remove('xl:w-64');
                sidebar.classList.add('xl:w-[4.2rem]');
                icon.classList.add('rotate-180');
            } else {
                icon.classList.add('-rotate-90');
            }
            
            content.classList.remove('opacity-100');
            content.classList.add('opacity-0');
            title.classList.remove('opacity-100');
            title.classList.add('opacity-0');
            
            setTimeout(() => { 
                content.classList.add('hidden'); 
                title.classList.add('hidden'); 
            }, 300); 
            
        } else {
            // EXPANDIR
            content.classList.remove('hidden');
            title.classList.remove('hidden');
            void content.offsetWidth;

            if (isDesktop) {
                sidebar.classList.remove('xl:w-[4.2rem]');
                sidebar.classList.add('xl:w-64');
                icon.classList.remove('rotate-180', '-rotate-90'); 
            } else {
                icon.classList.remove('rotate-180', '-rotate-90');
            }
            
            content.classList.remove('opacity-0');
            content.classList.add('opacity-100');
            title.classList.remove('opacity-0');
            title.classList.add('opacity-100');
        }
        
        // TRUQUE DO LEAFLET: O mapa precisa saber que a div pai mudou de tamanho
        setTimeout(() => { 
            if (window.ModuloMapa && window.ModuloMapa.map) {
                window.ModuloMapa.map.invalidateSize();
            }
        }, 320);
    }
};

document.addEventListener('DOMContentLoaded', () => window.SidebarFiltrosMapa.init());