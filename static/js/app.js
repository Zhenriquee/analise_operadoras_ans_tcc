/**
 * app.js — Orquestrador principal.
 * Gerencia visões, listeners, fetch de dados e atualização de componentes.
 */

document.addEventListener('DOMContentLoaded', () => {
    let currentView = 'municipio';
    let isInitialLoad = true;

    const btnVisaoMunicipio = document.getElementById('btn-visao-municipio');
    const btnVisaoOperadora = document.getElementById('btn-visao-operadora');
    const sectionVisaoMunicipio = document.getElementById('view-municipio');
    const sectionVisaoOperadora = document.getElementById('view-operadora');
    const welcomeState = document.getElementById('welcome-state');
    const filterMunicipioSection = document.getElementById('filter-municipio-section');
    const filterOperadoraSection = document.getElementById('filter-operadora-section');
    const btnAplicar = document.getElementById('btn-aplicar');
    const loadingOverlay = document.getElementById('loading-overlay');

    async function init() {
        await Filters.init();
        setupListeners();
        setView(currentView);
    }

    function setupListeners() {
        btnVisaoMunicipio.addEventListener('click', () => setView('municipio'));
        btnVisaoOperadora.addEventListener('click', () => setView('operadora'));
        btnAplicar.addEventListener('click', onAnalyze);
    }

    function setView(view) {
        currentView = view;
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
        if (!isInitialLoad) onAnalyze();
    }

    function setLoading(v) {
        loadingOverlay.classList.toggle('active', v);
    }

    async function onAnalyze() {
        const filters = Filters.getValues();

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
            console.error('[App] Erro:', err);
            alert('Erro ao carregar dados. Verifique o console.');
        } finally {
            setLoading(false);
        }
    }

    // ============================================================
    // VISÃO MUNICÍPIO
    // ============================================================
    async function loadVisaoMunicipio() {
        const qs = Filters.buildQuery();

        const [kpisRes, rankingRes, modalidadeRes, termoRes] = await Promise.all([
            fetch(`/api/municipio/kpis?${qs}`),
            fetch(`/api/municipio/ranking?${qs}`),
            fetch(`/api/municipio/modalidade?${qs}`),
            fetch(`/api/municipio/termometro_b2b?${qs}`),
        ]);

        const [kpis, ranking, modalidade, termo] = await Promise.all([
            kpisRes.json(), rankingRes.json(), modalidadeRes.json(), termoRes.json(),
        ]);

        // KPIs
        document.getElementById('val-populacao').textContent = Charts.fmtNum(kpis.populacao_2022);
        document.getElementById('val-populacao-est').textContent = Charts.fmtNum(kpis.populacao_estimada_2025);
        document.getElementById('val-clt').textContent = Charts.fmtNum(kpis.vinculos_clt);
        document.getElementById('val-vidas').textContent = Charts.fmtNum(kpis.total_vidas);
        document.getElementById('val-cobertura').textContent = `${kpis.taxa_cobertura}%`;

        const badgeCresc = document.getElementById('badge-crescimento');
        badgeCresc.textContent = `${kpis.crescimento_percentual > 0 ? '+' : ''}${kpis.crescimento_percentual}%`;
        badgeCresc.classList.toggle('negative', kpis.crescimento_percentual < 0);

        // Gráficos
        Charts.renderGauge('chart-termometro', termo);
        Charts.renderRankingBars('chart-ranking', ranking);
        Charts.renderModalidadePie('chart-modalidade', modalidade);
    }

    // ============================================================
    // VISÃO OPERADORA
    // ============================================================
    async function loadVisaoOperadora() {
        const qs = Filters.buildQuery();

        const [kpisRes, paretoRes, donutRes, mapaRes, infoRes] = await Promise.all([
            fetch(`/api/operadora/kpis?${qs}`),
            fetch(`/api/operadora/pareto?${qs}`),
            fetch(`/api/operadora/market_share_principal?${qs}`),
            fetch(`/api/operadora/mapa?${qs}`),
            fetch(`/api/operadora/info?${qs}`),
        ]);

        const [kpis, pareto, donut, geojson, info] = await Promise.all([
            kpisRes.json(), paretoRes.json(), donutRes.json(), mapaRes.json(), infoRes.json(),
        ]);

        // Info Card da Operadora
        const infoCard = document.getElementById('operadora-info-card');
        if (info && info.razao_social) {
            infoCard.style.display = 'block';
            document.getElementById('info-razao-social').textContent = info.razao_social;
            document.getElementById('info-cnpj').textContent = info.cnpj;
            document.getElementById('info-modalidade').textContent = info.modalidade;
            document.getElementById('info-endereco').textContent =
                `${info.logradouro}, ${info.bairro} — ${info.cidade}/${info.uf}`;
            document.getElementById('info-representante').textContent = info.representante;
        } else {
            infoCard.style.display = 'none';
        }

        // KPIs
        document.getElementById('val-total-benef').textContent = Charts.fmtNum(kpis.total_beneficiarios);
        document.getElementById('val-presenca').textContent = `${kpis.num_municipios} Municípios`;
        document.getElementById('badge-presenca').textContent = `${kpis.num_estados} UFs`;
        document.getElementById('val-dependencia').textContent = `${kpis.indice_dependencia}%`;
        document.getElementById('detail-dependencia').textContent = `Concentrado em ${kpis.cidade_principal}`;

        // Gráficos
        Charts.renderParetoChart('chart-pareto', pareto);
        Charts.renderMarketShareDonut('chart-donut', donut, 'donut-subtitle');
        MapChart.render('chart-mapa', geojson);
    }

    init();
});
