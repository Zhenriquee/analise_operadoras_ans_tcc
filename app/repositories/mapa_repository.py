import duckdb
from app.repositories.queries.mapa_queries import (
    LISTAR_ESTADOS_OPERADORA, 
    build_query_mapa, 
    LISTAR_MODALIDADES_MAPA, 
    build_query_ranking
)

class MapaRepository:
    def __init__(self, fato_path: str, municipio_path: str, operadora_path: str):
        self.fato_parquet_path = fato_path
        self.municipio_parquet_path = municipio_path
        self.operadora_parquet_path = operadora_path

    def obter_lista_estados(self, registro_ans: int):
        with duckdb.connect(':memory:') as con:
            parametros = [self.fato_parquet_path, self.municipio_parquet_path, registro_ans]
            resultado = con.execute(LISTAR_ESTADOS_OPERADORA, parametros).fetchdf()
        return resultado['sg_uf'].tolist()

    def obter_dados_mapa(self, registro_ans: int, sg_uf: str = None):
        with duckdb.connect(':memory:') as con:
            con.execute("INSTALL spatial;")
            con.execute("LOAD spatial;")
            
            tem_estado = bool(sg_uf)
            query = build_query_mapa(tem_estado)
            
            parametros = [self.fato_parquet_path, self.municipio_parquet_path, registro_ans]
            if tem_estado:
                parametros.append(sg_uf)
                
            resultado = con.execute(query, parametros).fetchdf()
            
        return resultado.to_dict('records')

    def obter_lista_modalidades(self):
        with duckdb.connect(':memory:') as con:
            resultado = con.execute(LISTAR_MODALIDADES_MAPA, [self.operadora_parquet_path]).fetchdf()
        return resultado['modalidade'].tolist()

    def obter_ranking_municipio(self, codigo_municipio: int, modalidades: list = None):
        tem_mod = bool(modalidades)
        placeholders = ", ".join(["?"] * len(modalidades)) if tem_mod else ""
        
        # Pega a string SQL montada do arquivo de queries
        query = build_query_ranking(tem_modalidades=tem_mod)
        if tem_mod: 
            query = query.format(placeholders)
            
        params = [self.fato_parquet_path, self.operadora_parquet_path, codigo_municipio]
        if tem_mod: 
            params.extend(modalidades)
            
        with duckdb.connect(':memory:') as con:
            resultado = con.execute(query, params).fetchdf()
            
        return resultado.to_dict('records')