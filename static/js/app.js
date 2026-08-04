/**
 * app.js — Orquestrador principal da aplicação.
 *
 * Gerencia o estado (Visão atual), os listeners de UI, e coordena
 * a busca de dados na API para atualizar os componentes.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ---- Estado da Aplicação ----
    let currentView = 'municipio'; // 'municipio' ou 'operadora'
    let isInitialLoad = true;

    // ---- Elementos DOM ----
    const btnVisaoMunicipio = document.getElementById('btn-visao-municipio');
    const btnVisaoOperadora = document.getElementById('btn-visao-operadora');
    const sectionVisaoMunicipio = document.getElementById('view-municipio');
    const sectionVisaoOperadora = document.getElementById('view-operadora');
    const welcomeState = document.getElementById('welcome-state');
    
    const filterMunicipioSection = document.getElementById('filter-municipio-section');
    const filterOperadoraSection = document.getElementById('filter-operadora-section');
    const btnAplicar = document.getElementById('btn-aplicar');
    const loadingOverlay = document.getElementById('loading-overlay');

    // ---- Inicialização ----
    async function init() {
        // Inicializa os filtros (carrega UFs e Modalidades)
        await Filters.init();
        
        // Configura os listeners
        setupListeners();
        
        // Define a visão inicial
        setView(currentView);
    }

    function setupListeners() {
        // Toggle de Visão
        btnVisaoMunicipio.addEventListener('click', () => setView('municipio'));
        btnVisaoOperadora.addEventListener('click', () => setView('operadora'));

        // Botão Analisar
        btnAplicar.addEventListener('click', onAnalyze);
    }

    /**
     * Alterna entre as visões e ajusta a interface.
     */
    function setView(view) {
        currentView = view;
        
        // Atualiza botões
        if (view === 'municipio') {
            btnVisaoMunicipio.classList.add('active');
            btnVisaoOperadora.classList.remove('active');
            filterMunicipioSection.style.display = 'block';
            filterOperadoraSection.style.display = 'none';
        } else {
            btnVisaoOperadora.classList.add('active');
            btnVisaoMunicipio.classList.remove('active');
            filterOperadoraSection.style.display = 'block';
            filterMunicipioSection.style.display = 'none';
        }

        // Se já analisou alguma vez, dispara a análise novamente na nova visão
        if (!isInitialLoad) {
            onAnalyze();
        }
    }

    /**
     * Mostra/esconde o overlay de loading.
     */
    function setLoading(isLoading) {
        if (isLoading) {
            loadingOverlay.classList.add('active');
        } else {
            loadingOverlay.classList.remove('active');
        }
    }

    /**
     * Disparado quando o botão "Analisar" é clicado.
     */
    async function onAnalyze() {
        const filters = Filters.getValues();
        
        // Validação básica
        if (currentView === 'municipio' && !filters.municipio) {
            alert('Por favor, selecione um município.');
            return;
        }
        
        if (currentView === 'operadora' && !filters.operadora) {
            alert('Por favor, selecione uma operadora.');
            return;
        }

        isInitialLoad = false;
        welcomeState.style.display = 'none';
        setLoading(true);

        try {
            if (currentView === 'municipio') {
                sectionVisaoMunicipio.style.display = 'block';
                sectionVisaoOperadora.style.display = 'none';
                await loadVisaoMunicipio();
            } else {
                sectionVisaoOperadora.style.display = 'block';
                sectionVisaoMunicipio.style.display = 'none';
                await loadVisaoOperadora();
            }
        } catch (err) {
            console.error('[App] Erro na análise:', err);
            alert('Ocorreu um erro ao carregar os dados. Verifique o console.');
        } finally {
            setLoading(false);
        }
    }

    // ============================================================
    // CARREGAMENTO DA VISÃO MUNICÍPIO
    // ============================================================
    async function loadVisaoMunicipio() {
        const qs = Filters.buildQuery();
        
        const [kpisRes, rankingRes, modalidadeRes, termoRes] = await Promise.all([
            fetch(`/api/municipio/kpis?${qs}`),
            fetch(`/api/municipio/ranking?${qs}`),
            fetch(`/api/municipio/modalidade?${qs}`),
            fetch(`/api/municipio/termometro_b2b?${qs}`)
        ]);

        const [kpis, ranking, modalidade, termo] = await Promise.all([
            kpisRes.json(),
            rankingRes.json(),
            modalidadeRes.json(),
            termoRes.json()
        ]);

        // Atualizar KPIs
        document.getElementById('val-populacao').textContent = Charts.fmtNum(kpis.populacao_2022);
        document.getElementById('val-populacao-est').textContent = Charts.fmtNum(kpis.populacao_estimada_2025);
        document.getElementById('val-clt').textContent = Charts.fmtNum(kpis.vinculos_clt);
        document.getElementById('val-vidas').textContent = Charts.fmtNum(kpis.total_vidas);
        document.getElementById('val-cobertura').textContent = `${kpis.taxa_cobertura}%`;
        
        const badgeCresc = document.getElementById('badge-crescimento');
        badgeCresc.textContent = `${kpis.crescimento_percentual > 0 ? '+' : ''}${kpis.crescimento_percentual}%`;
        if (kpis.crescimento_percentual < 0) {
            badgeCresc.classList.add('negative');
        } else {
            badgeCresc.classList.remove('negative');
        }

        // Renderizar Gráficos
        Charts.renderGauge('chart-termometro', termo);
        Charts.renderRankingBars('chart-ranking', ranking);
        Charts.renderModalidadePie('chart-modalidade', modalidade);
    }

    // ============================================================
    // CARREGAMENTO DA VISÃO OPERADORA
    // ============================================================
    async function loadVisaoOperadora() {
        const qs = Filters.buildQuery();
        
        const [kpisRes, paretoRes, donutRes, mapaRes] = await Promise.all([
            fetch(`/api/operadora/kpis?${qs}`),
            fetch(`/api/operadora/pareto?${qs}`),
            fetch(`/api/operadora/market_share_principal?${qs}`),
            fetch(`/api/operadora/mapa?${qs}`)
        ]);

        const [kpis, pareto, donut, geojson] = await Promise.all([
            kpisRes.json(),
            paretoRes.json(),
            donutRes.json(),
            mapaRes.json()
        ]);

        // Atualizar KPIs
        document.getElementById('val-total-benef').textContent = Charts.fmtNum(kpis.total_beneficiarios);
        document.getElementById('val-presenca').textContent = `${kpis.num_municipios} Mun.`;
        document.getElementById('badge-presenca').textContent = `${kpis.num_estados} UFs`;
        
        document.getElementById('val-dependencia').textContent = `${kpis.indice_dependencia}%`;
        document.getElementById('detail-dependencia').textContent = `em ${kpis.cidade_principal}`;

        // Renderizar Gráficos
        Charts.renderParetoChart('chart-pareto', pareto);
        Charts.renderMarketShareDonut('chart-donut', donut, 'donut-subtitle');
        MapChart.render('chart-mapa', geojson);
    }

    // Iniciar
    init();
});
