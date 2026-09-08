from flask import Blueprint, render_template, jsonify, request
from app.dependencies import operadora_service, dashboard_service # Importa daqui!

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/dashboard')

@dashboard_bp.route('/<int:registro_ans>')
def painel(registro_ans):
    # Usa o serviço da RAM
    operadoras = operadora_service.listar_operadoras(str(registro_ans))
    operadora_info = operadoras[0] if operadoras else None
    
    if not operadora_info:
        return "Operadora não encontrada", 404

    resumo_carteira = dashboard_service.processar_resumo_operadora(registro_ans)
    dados_graficos = dashboard_service.processar_graficos(registro_ans)

    return render_template(
        'dashboard.html', 
        operadora=operadora_info, 
        resumo=resumo_carteira,
        graficos=dados_graficos,
        aba_ativa='geral'
    )

@dashboard_bp.route('/<int:registro_ans>/piramide')
def api_piramide(registro_ans):
    # Pega o município da URL, ex: /dashboard/1234/piramide?municipio=355030
    codigo_municipio = request.args.get('municipio', type=int)
    
    # Chama o serviço passando o município
    # O serviço retorna aquele dicionário {"faixas": [...], "homens": [...], "mulheres": [...]}
    dados_piramide = dashboard_service.processar_piramide(registro_ans, codigo_municipio)
    
    return jsonify(dados_piramide)

@dashboard_bp.route('/<int:registro_ans>/municipios')
def api_municipios(registro_ans):
    coluna = request.args.get('coluna') # Pega a coluna que veio do clique no JS
    dados_municipios = dashboard_service.processar_municipios(registro_ans, coluna)
    return jsonify(dados_municipios)