from flask import Blueprint, render_template, request, jsonify
# Note que agora importamos os 3 serviços!
from app.dependencies import operadora_service, dashboard_service, regiao_service

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/dashboard')

# ==========================================
# ROTAS DA ABA: VISÃO GERAL
# ==========================================
@dashboard_bp.route('/<int:registro_ans>')
def painel(registro_ans):
    operadoras = operadora_service.listar_operadoras(str(registro_ans))
    operadora_info = operadoras[0] if operadoras else None
    
    if not operadora_info:
        return "Operadora não encontrada", 404

    resumo_carteira = dashboard_service.processar_resumo_operadora(registro_ans)
    dados_graficos = dashboard_service.processar_graficos(registro_ans)

    return render_template(
        'visao_geral.html', 
        operadora=operadora_info, 
        resumo=resumo_carteira,
        graficos=dados_graficos,
        aba_ativa='geral'
    )

@dashboard_bp.route('/<int:registro_ans>/piramide')
def api_piramide(registro_ans):
    codigo_municipio = request.args.get('municipio', type=int)
    dados_piramide = dashboard_service.processar_piramide(registro_ans, codigo_municipio)
    return jsonify(dados_piramide)

@dashboard_bp.route('/<int:registro_ans>/municipios')
def api_municipios(registro_ans):
    coluna = request.args.get('coluna')
    dados_municipios = dashboard_service.processar_municipios(registro_ans, coluna)
    return jsonify(dados_municipios)


# ==========================================
# ROTAS DA ABA: ANÁLISE REGIONAL
# ==========================================
@dashboard_bp.route('/<int:registro_ans>/regiao')
def regiao(registro_ans):
    operadoras = operadora_service.listar_operadoras(str(registro_ans))
    operadora_info = operadoras[0] if operadoras else None
    
    if not operadora_info:
        return "Operadora não encontrada", 404

    # Usa o novo serviço regional que criamos
    lista_municipios = regiao_service.listar_municipios_atuacao(registro_ans)
    lista_modalidades = regiao_service.listar_modalidades() # Novo!
    analise_regiao = regiao_service.processar_analise_regional(registro_ans)

    return render_template(
        'dashboard_regiao.html', 
        operadora=operadora_info, 
        municipios=lista_municipios,
        modalidades=lista_modalidades,
        analise=analise_regiao,
        aba_ativa='regiao'
    )

@dashboard_bp.route('/<int:registro_ans>/regiao/conteudo')
def regiao_conteudo(registro_ans):
    cod_municipio = request.args.get('municipio', type=int)
    modalidades_selecionadas = request.args.getlist('modalidade') # Recebendo a lista de checkboxes!
    
    # Remove strings vazias caso venha sujeira
    modalidades_selecionadas = [m for m in modalidades_selecionadas if m] 

    analise_regiao = regiao_service.processar_analise_regional(
        registro_ans, cod_municipio, modalidades_selecionadas
    )
    
    return render_template('partials/_storytelling_regiao.html', analise=analise_regiao)