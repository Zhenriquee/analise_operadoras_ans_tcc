import duckdb
from app.repositories.queries.dashboard_queries import RESUMO_CARTEIRA_OPERADORA, PERFIL_DEMOGRAFICO_OPERADORA, get_query_top_municipios

class DashboardRepository:
    def __init__(self, fato_parquet_path: str, municipio_parquet_path: str = None):
        self.fato_parquet_path = fato_parquet_path
        self.municipio_parquet_path = municipio_parquet_path

    def obter_resumo_carteira(self, registro_ans: int):
        with duckdb.connect(':memory:') as con:
            # Agora passamos os dois caminhos de parquet, igual fazemos nos top municípios
            parametros = [self.fato_parquet_path, self.municipio_parquet_path, registro_ans]
            resultado = con.execute(RESUMO_CARTEIRA_OPERADORA, parametros).fetchdf()
            
        if not resultado.empty and resultado['ultima_competencia'][0] is not None:
            return resultado.iloc[0].to_dict()
        return None

    def obter_perfil_demografico(self, registro_ans: int, codigo_municipio: int = None):
        with duckdb.connect(':memory:') as con:
            parametros = [self.fato_parquet_path, registro_ans, codigo_municipio, codigo_municipio]
            resultado = con.execute(PERFIL_DEMOGRAFICO_OPERADORA, parametros).fetchdf()
        return resultado.to_dict('records')[0] if not resultado.empty else None

    def obter_top_municipios(self, registro_ans: int, coluna_filtro: str = None):
        # Proteção rigorosa contra SQL Injection (whitelist de colunas permitidas)
        colunas_validas = [
            'masculino_0_18', 'feminino_0_18', 'masculino_19_23', 'feminino_19_23',
            'masculino_24_28', 'feminino_24_28', 'masculino_29_33', 'feminino_29_33',
            'masculino_34_38', 'feminino_34_38', 'masculino_39_43', 'feminino_39_43',
            'masculino_44_48', 'feminino_44_48', 'masculino_49_53', 'feminino_49_53',
            'masculino_54_58', 'feminino_54_58', 'masculino_59_mais', 'feminino_59_mais'
        ]
        
        coluna = coluna_filtro if coluna_filtro in colunas_validas else "qtd_beneficiarios"
        query = get_query_top_municipios(coluna)

        with duckdb.connect(':memory:') as con:
            if self.municipio_parquet_path:
                parametros = [self.fato_parquet_path, self.municipio_parquet_path, registro_ans]
            else:
                parametros = [self.fato_parquet_path, registro_ans]
            resultado = con.execute(query, parametros).fetchdf()
            
        return resultado.to_dict('records')