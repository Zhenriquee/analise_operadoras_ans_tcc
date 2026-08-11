"""
Dashboard Interativo — Análise de Operadoras ANS.

Entry point da aplicação Flask. Registra Blueprints,
inicializa o DataLoader e serve o template principal.
"""
from flask import Flask, render_template
from config import Config
from src.data_loader import DataLoader
from src.api.filters import filters_bp
from src.api.operadora import operadora_bp
from src.api.mercado import mercado_bp
from src.api.expansao import expansao_bp


def create_app():
    """Factory para criação da aplicação Flask."""
    app = Flask(__name__)
    app.config.from_object(Config)

    # Inicializar DataLoader (singleton — carrega dados uma vez)
    with app.app_context():
        DataLoader()

    # Registrar Blueprints da API
    app.register_blueprint(filters_bp)
    app.register_blueprint(operadora_bp)
    app.register_blueprint(mercado_bp)
    app.register_blueprint(expansao_bp)

    # Rota principal — serve o dashboard
    @app.route("/")
    def index():
        return render_template("index.html")

    return app


# Entry point
if __name__ == "__main__":
    app = create_app()
    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG,
    )