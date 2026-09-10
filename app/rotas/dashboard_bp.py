from flask import Blueprint, render_template, request, jsonify
# Note que agora importamos os 3 serviços!
from app.dependencies import operadora_service, dashboard_service, regiao_service, mapa_service

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

@dashboard_bp.route('/<int:registro_ans>/mapa')
def mapa_geografico(registro_ans):
    operadoras = operadora_service.listar_operadoras(str(registro_ans))
    operadora_info = operadoras[0] if operadoras else None
    if not operadora_info: return "Operadora não encontrada", 404

    lista_estados = mapa_service.listar_estados_atuacao(registro_ans)
    lista_modalidades = mapa_service.listar_modalidades() # NOVO
    estado_default = lista_estados[0] if lista_estados else None
    dados_geojson = mapa_service.processar_dados_mapa(registro_ans, estado_default)
    
    return render_template(
        'dashboard_mapa.html', 
        operadora=operadora_info,
        estados=lista_estados,
        modalidades=lista_modalidades, # NOVO
        estado_selecionado=estado_default,
        geojson=dados_geojson,
        aba_ativa='mapa'
    )

@dashboard_bp.route('/<int:registro_ans>/mapa/conteudo')
def mapa_geografico_conteudo(registro_ans):
    estado_selecionado = request.args.get('estado')
    
    # 2. Se o usuário escolheu "TODOS" (Brasil Inteiro), passamos None para o back-end anular o filtro
    estado_filtro = estado_selecionado if estado_selecionado != "TODOS" else None
    
    dados_geojson = mapa_service.processar_dados_mapa(registro_ans, estado_filtro)
    return render_template('partials/_conteudo_mapa.html', geojson=dados_geojson)

@dashboard_bp.route('/<int:registro_ans>/mapa/ranking')
def mapa_ranking(registro_ans):
    cod_municipio = request.args.get('municipio_selecionado', type=int)
    modalidades = request.args.getlist('modalidade')
    modalidades = [m for m in modalidades if m]
    
    if not cod_municipio:
        return "<div class='p-6 bg-slate-50 text-center text-slate-500 rounded-xl border border-slate-200'>Selecione um município no mapa para visualizar o ranking.</div>"
        
    ranking = mapa_service.obter_ranking_municipio(cod_municipio, modalidades)
    return render_template('partials/_ranking_mapa.html', ranking=ranking, ans_alvo=registro_ans)