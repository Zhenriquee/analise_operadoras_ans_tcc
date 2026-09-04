from flask import Blueprint, render_template, request
from app.dependencies import operadora_service # Importa a instância central

home_bp = Blueprint('home', __name__)

@home_bp.route('/')
def index():
    return render_template('index.html')

@home_bp.route('/buscar-operadoras')
def buscar_operadoras():
    termo = request.args.get('q', '').strip()
    if not termo:
        return ""
        
    # Usa a instância que já está com os dados na memória RAM!
    operadoras = operadora_service.listar_operadoras(termo)
    return render_template('partials/_lista_operadoras.html', operadoras=operadoras)