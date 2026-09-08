from flask import Flask
from app.rotas.home_bp import home_bp
from app.rotas.dashboard_bp import dashboard_bp

app = Flask(__name__, template_folder="app/templates", static_folder="app/static")
app.register_blueprint(home_bp)
app.register_blueprint(dashboard_bp)

if __name__ == '__main__':
    # Certifique-se de ter instalado: pip install flask duckdb pandas
    app.run(debug=True, port=5000)