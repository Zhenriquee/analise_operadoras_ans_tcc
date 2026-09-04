from app.repositories.operadora_repository import OperadoraRepository
from app.services.operadora_service import OperadoraService
from app.repositories.dashboard_repository import DashboardRepository
from app.services.dashboard_service import DashboardService

# Configuração dos caminhos
CAMINHO_DIM = 'data/entidade_dim_operadora.parquet'
CAMINHO_FATO = 'data/entidade_fato_beneficiario_por_municipio.parquet'

# 1. Instanciamos o Repositório de Operadoras UMA ÚNICA VEZ. 
# O Pandas vai ler o arquivo para a RAM apenas neste exato momento.
operadora_repo = OperadoraRepository(CAMINHO_DIM)
operadora_service = OperadoraService(operadora_repo)

# 2. Instanciamos o Repositório do Dashboard
# Como ele não usa Pandas (apenas DuckDB direto no disco), ele não consome RAM extra,
# mas mantemos aqui pela organização da arquitetura.
dashboard_repo = DashboardRepository(CAMINHO_FATO)
dashboard_service = DashboardService(dashboard_repo)