from flask import Blueprint, render_template
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

    return render_template(
        'dashboard.html', 
        operadora=operadora_info, 
        resumo=resumo_carteira
    )