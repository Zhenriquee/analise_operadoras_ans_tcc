from app.repositories.operadora_repository import OperadoraRepository
from app.services.operadora_service import OperadoraService
from app.repositories.dashboard_repository import DashboardRepository
from app.services.dashboard_service import DashboardService
from app.repositories.regiao_repository import RegiaoRepository
from app.services.regiao_service import RegiaoService
from app.repositories.mapa_repository import MapaRepository
from app.services.mapa_service import MapaService

# Configuração dos caminhos
CAMINHO_DIM = 'data/entidade_dim_operadora.parquet'
CAMINHO_FATO = 'data/entidade_fato_beneficiario_por_municipio.parquet'
CAMINHO_MUNICIPIO = 'data/dim_municipio_score_mercado.parquet'
CAMINHO_POPLUACAO_CONTRATADA = 'data/entidade_fato_populacao_contratada.parquet'


# 1. Instanciamos o Repositório de Operadoras UMA ÚNICA VEZ. 
# O Pandas vai ler o arquivo para a RAM apenas neste exato momento.
operadora_repo = OperadoraRepository(CAMINHO_DIM)
operadora_service = OperadoraService(operadora_repo)

# 2. Instanciamos o Repositório do Dashboard
# Como ele não usa Pandas (apenas DuckDB direto no disco), ele não consome RAM extra,
# mas mantemos aqui pela organização da arquitetura.
dashboard_repo = DashboardRepository(CAMINHO_FATO, CAMINHO_MUNICIPIO)
dashboard_service = DashboardService(dashboard_repo)

regiao_repo = RegiaoRepository(CAMINHO_FATO, CAMINHO_MUNICIPIO, CAMINHO_DIM, CAMINHO_POPLUACAO_CONTRATADA)
regiao_service = RegiaoService(regiao_repo)

mapa_repository = MapaRepository(CAMINHO_FATO, CAMINHO_MUNICIPIO, CAMINHO_DIM)
mapa_service = MapaService(mapa_repository)