import pytest
from flask import Flask
from app.rotas.home_bp import home_bp
from app.rotas.dashboard_bp import dashboard_bp

@pytest.fixture
def app():
    # Cria uma versão leve do app apenas para os testes
    app = Flask(__name__, template_folder="../app/templates")
    app.register_blueprint(home_bp)
    app.register_blueprint(dashboard_bp)
    app.config.update({
        "TESTING": True,
    })
    return app

@pytest.fixture
def client(app):
    # O test_client simula o navegador enviando requisições HTTP
    return app.test_client()