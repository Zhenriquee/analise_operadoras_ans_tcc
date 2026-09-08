import duckdb
from app.repositories.queries.dashboard_queries import RESUMO_CARTEIRA_OPERADORA, PERFIL_DEMOGRAFICO_OPERADORA, TOP_10_MUNICIPIOS_OPERADORA

class DashboardRepository:
    def __init__(self, fato_parquet_path: str, municipio_parquet_path: str = None):
        self.fato_parquet_path = fato_parquet_path
        self.municipio_parquet_path = municipio_parquet_path

    def obter_resumo_carteira(self, registro_ans: int):
        with duckdb.connect(':memory:') as con:
            parametros = [self.fato_parquet_path, registro_ans]
            resultado = con.execute(RESUMO_CARTEIRA_OPERADORA, parametros).fetchdf()
            
        if not resultado.empty and resultado['ultima_competencia'][0] is not None:
            return resultado.iloc[0].to_dict()
        return None

    def obter_perfil_demografico(self, registro_ans: int):
        with duckdb.connect(':memory:') as con:
            parametros = [self.fato_parquet_path, registro_ans]
            resultado = con.execute(PERFIL_DEMOGRAFICO_OPERADORA, parametros).fetchdf()
        return resultado.to_dict('records')[0] if not resultado.empty else None

    def obter_top_municipios(self, registro_ans: int):
        with duckdb.connect(':memory:') as con:
            if self.municipio_parquet_path:
                parametros = [self.fato_parquet_path, self.municipio_parquet_path, registro_ans]
            else:
                parametros = [self.fato_parquet_path, registro_ans]
            resultado = con.execute(TOP_10_MUNICIPIOS_OPERADORA, parametros).fetchdf()
        return resultado.to_dict('records')