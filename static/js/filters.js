/**
 * filters.js — Gerenciamento dos filtros globais em cascata.
 *
 * Responsável por popular os dropdowns via API e coordenar
 * as dependências entre filtros (UF → Município/Operadora).
 */

const Filters = (() => {
    // Elementos DOM
    const elUf = document.getElementById('filter-uf');
    const elMunicipio = document.getElementById('filter-municipio');
    const elOperadora = document.getElementById('filter-operadora');
    const elModalidade = document.getElementById('filter-modalidade');

    /**
     * Inicializa todos os filtros — carrega opções da API.
     */
    async function init() {
        await Promise.all([
            loadUfs(),
            loadModalidades(),
        ]);

        // Inicializar Select2
        $(elUf).select2({ placeholder: "Todos os estados", allowClear: true });
        $(elMunicipio).select2({ placeholder: "Selecione um município", allowClear: true });
        $(elOperadora).select2({ placeholder: "Selecione uma operadora", allowClear: true });

        // Listeners de cascata usando evento do Select2
        $(elUf).on('change', onUfChange);
    }

    /**
     * Carrega a lista de UFs no dropdown.
     */
    async function loadUfs() {
        try {
            const res = await fetch('/api/filters/ufs');
            const ufs = await res.json();
            
            // Limpar e popular UF com jQuery/Select2
            $(elUf).empty().append('<option value="">Todos os estados</option>');
            ufs.forEach(uf => {
                $(elUf).append(new Option(uf, uf, false, false));
            });
            $(elUf).trigger('change.select2');
        } catch (err) {
            console.error('[Filters] Erro ao carregar UFs:', err);
        }
    }

    /**
     * Carrega municípios filtrados pela UF selecionada.
     */
    async function loadMunicipios(uf) {
        try {
            const params = uf ? `?uf=${encodeURIComponent(uf)}` : '';
            const res = await fetch(`/api/filters/municipios${params}`);
            const municipios = await res.json();
            
            $(elMunicipio).empty().append('<option value="">Selecione um município</option>');
            municipios.forEach(m => {
                $(elMunicipio).append(new Option(m, m, false, false));
            });
            $(elMunicipio).trigger('change.select2');
        } catch (err) {
            console.error('[Filters] Erro ao carregar municípios:', err);
        }
    }

    /**
     * Carrega operadoras filtradas pela UF selecionada.
     */
    async function loadOperadoras(uf) {
        try {
            const params = uf ? `?uf=${encodeURIComponent(uf)}` : '';
            const res = await fetch(`/api/filters/operadoras${params}`);
            const operadoras = await res.json();
            
            $(elOperadora).empty().append('<option value="">Selecione uma operadora</option>');
            operadoras.forEach(op => {
                $(elOperadora).append(new Option(op.nome, op.codigo, false, false));
            });
            $(elOperadora).trigger('change.select2');
        } catch (err) {
            console.error('[Filters] Erro ao carregar operadoras:', err);
        }
    }

    /**
     * Carrega as checkboxes de modalidade.
     */
    async function loadModalidades() {
        try {
            const res = await fetch('/api/filters/modalidades');
            const modalidades = await res.json();
            elModalidade.innerHTML = '';
            modalidades.forEach((mod, i) => {
                const item = document.createElement('div');
                item.className = 'checkbox-item';

                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.id = `mod-${i}`;
                cb.value = mod;
                cb.checked = true;

                const lbl = document.createElement('label');
                lbl.htmlFor = `mod-${i}`;
                lbl.textContent = mod;

                item.appendChild(cb);
                item.appendChild(lbl);
                elModalidade.appendChild(item);
            });
        } catch (err) {
            console.error('[Filters] Erro ao carregar modalidades:', err);
        }
    }

    /**
     * Handler de mudança de UF — recarrega municípios e operadoras.
     */
    function onUfChange() {
        const uf = elUf.value;
        loadMunicipios(uf);
        loadOperadoras(uf);
    }

    /**
     * Retorna os valores atuais de todos os filtros.
     */
    function getValues() {
        const modalidades = [];
        elModalidade.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
            modalidades.push(cb.value);
        });

        return {
            uf: $(elUf).val() || "",
            municipio: $(elMunicipio).val() || "",
            operadora: $(elOperadora).val() || "",
            modalidades: modalidades,
        };
    }

    /**
     * Constrói query string a partir dos filtros para chamadas à API.
     */
    function buildQuery(extraParams = {}) {
        const vals = getValues();
        const params = new URLSearchParams();

        if (vals.uf) params.set('uf', vals.uf);
        if (vals.municipio) params.set('municipio', vals.municipio);
        if (vals.operadora) params.set('operadora', vals.operadora);
        if (vals.modalidades.length > 0) {
            params.set('modalidade', vals.modalidades.join(','));
        }

        Object.entries(extraParams).forEach(([k, v]) => {
            params.set(k, v);
        });

        return params.toString();
    }

    return { init, getValues, buildQuery, loadMunicipios, loadOperadoras };
})();
