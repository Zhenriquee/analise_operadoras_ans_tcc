import duckdb
from app.repositories.queries.dashboard_queries import RESUMO_CARTEIRA_OPERADORA

class DashboardRepository:
    def __init__(self, fato_parquet_path: str):
        self.fato_parquet_path = fato_parquet_path

    def obter_resumo_carteira(self, registro_ans: int):
        with duckdb.connect(':memory:') as con:
            parametros = [self.fato_parquet_path, registro_ans]
            resultado = con.execute(RESUMO_CARTEIRA_OPERADORA, parametros).fetchdf()
            
        # Retorna o primeiro registro (como dicionário) ou None se estiver vazio
        if not resultado.empty and resultado['ultima_competencia'][0] is not None:
            return resultado.iloc[0].to_dict()
        return None