/**
 * filters.js — Gerenciamento do onboarding (Seleção de Operadora).
 */

const Filters = (() => {
    let elSelectOperadora;

    async function init() {
        elSelectOperadora = document.getElementById('select-operadora');
        
        try {
            const res = await fetch('/api/filters/operadoras');
            const operadoras = await res.json();
            
            $(elSelectOperadora).empty().append('<option value="">Selecione a Operadora</option>');
            
            operadoras.forEach(op => {
                // Código ANS + Nome para busca por ambos
                const text = `${op.codigo} - ${op.nome}`;
                $(elSelectOperadora).append(new Option(text, op.codigo, false, false));
            });

            // Renderizar dropdown DENTRO do card do onboarding
            // para evitar que fique atrás do overlay (z-index)
            $(elSelectOperadora).select2({ 
                placeholder: "Digite o nome ou código ANS da Operadora", 
                allowClear: true,
                width: '100%',
                dropdownParent: $('.onboarding-card'),
                language: {
                    noResults: function() {
                        return "Operadora não encontrada";
                    }
                }
            });

        } catch (err) {
            console.error('[Filters] Erro ao carregar operadoras:', err);
        }
    }

    function getSelectedOperadora() {
        return $(elSelectOperadora).val();
    }
    
    function onChange(callback) {
        $(elSelectOperadora).on('change', callback);
    }

    return { init, getSelectedOperadora, onChange };
})();
