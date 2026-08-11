/**
 * app.js — Orquestrador do Dashboard Executivo.
 * Gerencia o fluxo: Onboarding -> Tabs (lazy loading das APIs).
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Elementos DOM ---
    const overlay = document.getElementById('onboarding-overlay');
    const btnEntrar = document.getElementById('btn-entrar');
    const dashboardContainer = document.getElementById('dashboard-container');
    const btnVoltar = document.getElementById('btn-voltar-onboarding');
    const lblOperadora = document.getElementById('lbl-operadora-nome');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const tabIndicator = document.getElementById('tab-indicator');

    // Estado da aplicação
    let selectedOperadoraCodigo = null;
    let selectedOperadoraNome = "";
    
    // Controle de cache das abas para evitar refetching ao trocar de tab
    const tabsLoaded = {
        'tab-aba1': false,
        'tab-aba2': false,
        'tab-aba3': false
    };

    // --- Inicialização ---
    async function init() {
        await Filters.init();
        setupListeners();
        updateTabIndicator(document.querySelector('.tab-btn.active'));
    }

    function setupListeners() {
        // Habilitar botão quando operadora for selecionada
        Filters.onChange(() => {
            const cod = Filters.getSelectedOperadora();
            btnEntrar.disabled = !cod;
        });

        // Clique para entrar no dashboard
        btnEntrar.addEventListener('click', enterDashboard);

        // Voltar ao onboarding
        btnVoltar.addEventListener('click', exitDashboard);

        // Navegação de Tabs
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.currentTarget.getAttribute('data-tab');
                switchTab(targetId, e.currentTarget);
            });
        });
        
        // Resize do window atualiza indicador
        window.addEventListener('resize', () => {
            const activeBtn = document.querySelector('.tab-btn.active');
            if (activeBtn) updateTabIndicator(activeBtn);
        });
    }
    
    function setLoading(v) {
        if (v) loadingOverlay.classList.add('active');
        else loadingOverlay.classList.remove('active');
    }

    // --- Navegação ---

    async function enterDashboard() {
        selectedOperadoraCodigo = Filters.getSelectedOperadora();
        
        if (!selectedOperadoraCodigo) return;
        
        // Pegar nome selecionado no Select2
        const selectData = $('#select-operadora').select2('data');
        if (selectData && selectData.length > 0) {
            selectedOperadoraNome = selectData[0].text;
            lblOperadora.textContent = selectedOperadoraNome;
        }

        // Transição de telas
        overlay.classList.add('hidden');
        dashboardContainer.style.display = 'flex';
        
        // Reset cache
        tabsLoaded['tab-aba1'] = false;
        tabsLoaded['tab-aba2'] = false;
        tabsLoaded['tab-aba3'] = false;
        
        // Forçar Aba 1 inicialmente
        const btnAba1 = document.querySelector('[data-tab="tab-aba1"]');
        switchTab('tab-aba1', btnAba1);
    }
    
    function exitDashboard() {
        dashboardContainer.style.display = 'none';
        overlay.classList.remove('hidden');
    }

    async function switchTab(tabId, btnElement) {
        // Atualizar UI
        tabBtns.forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
        
        tabPanes.forEach(p => p.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        
        updateTabIndicator(btnElement);
        
        // Lazy Load de dados se ainda não carregou nesta sessão
        if (!tabsLoaded[tabId]) {
            setLoading(true);
            try {
                if (tabId === 'tab-aba1') await loadAba1();
                else if (tabId === 'tab-aba2') await loadAba2();
                else if (tabId === 'tab-aba3') await loadAba3();
                
                tabsLoaded[tabId] = true;
                
                // Disparar resize interno do Plotly para corrigir bug de div oculta
                window.dispatchEvent(new Event('resize'));
            } catch (err) {
                console.error(`Erro ao carregar ${tabId}:`, err);
                alert("Ocorreu um erro ao carregar os dados desta aba.");
            } finally {
                setLoading(false);
            }
        } else {
            // Se já tava carregado, apenas força resize do plotly
            window.dispatchEvent(new Event('resize'));
        }
    }
    
    function updateTabIndicator(btn) {
        if (!btn || !tabIndicator) return;
        tabIndicator.style.width = `${btn.offsetWidth}px`;
        tabIndicator.style.left = `${btn.offsetLeft}px`;
    }

    // ============================================================
    // ABA 1: O Nosso Quintal
    // ============================================================
    async function loadAba1() {
        const qs = `?operadora=${selectedOperadoraCodigo}`;
        
        const [kpisRes, mapaRes, top10Res] = await Promise.all([
            fetch(`/api/operadora/kpis_carteira${qs}`),
            fetch(`/api/operadora/mapa_atuacao${qs}`),
            fetch(`/api/operadora/top10_municipios${qs}`)
        ]);
        
        const [kpis, mapa, top10] = await Promise.all([
            kpisRes.json(), mapaRes.json(), top10Res.json()
        ]);
        
        // Populando KPIs
        document.getElementById('val-total-benef').textContent = Charts.fmtNum(kpis.total_beneficiarios);
        document.getElementById('val-taxa-ocupacao').textContent = kpis.taxa_ocupacao;
        document.getElementById('val-razao-demo').textContent = kpis.razao_demografica.toFixed(2);
        document.getElementById('lbl-razao-demo-detail').textContent = `${kpis.pct_jovens}% Jovens vs ${kpis.pct_idosos}% Idosos`;
        
        // Gráficos
        MapChart.renderMapaAtuacao('mapa-aba1', mapa);
        Charts.renderTop10Bars('chart-aba1-top10', top10);
    }

    // ============================================================
    // ABA 2: O Mapa da Guerra
    // ============================================================
    async function loadAba2() {
        const qs = `?operadora=${selectedOperadoraCodigo}`;
        
        const [mapaClustersRes, scatterRes] = await Promise.all([
            fetch(`/api/mercado/mapa_clusters${qs}`),
            fetch(`/api/mercado/scatter_oportunidade${qs}`)
        ]);
        
        const [mapaClusters, scatter] = await Promise.all([
            mapaClustersRes.json(), scatterRes.json()
        ]);
        
        MapChart.renderMapaClusters('mapa-aba2', mapaClusters);
        Charts.renderScatterOportunidade('chart-aba2-scatter', scatter);
    }

    // ============================================================
    // ABA 3: O Plano Tático
    // ============================================================
    async function loadAba3() {
        const qs = `?operadora=${selectedOperadoraCodigo}`;
        
        const [mapaRaioRes, tendenciaRes] = await Promise.all([
            fetch(`/api/expansao/mapa_raio50km${qs}`),
            fetch(`/api/expansao/tendencia_clt${qs}`)
        ]);
        
        const [mapaRaio, tendencia] = await Promise.all([
            mapaRaioRes.json(), tendenciaRes.json()
        ]);
        
        MapChart.renderMapaExpansao('mapa-aba3', mapaRaio);
        Charts.renderTendenciaCAGED('chart-aba3-tendencia', tendencia);
    }

    // Inicializar aplicação
    init();
});
