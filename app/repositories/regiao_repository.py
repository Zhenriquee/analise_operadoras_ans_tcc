import duckdb
from app.repositories.queries.regiao_queries import *

class RegiaoRepository:
    def __init__(self, fato_path: str, municipio_path: str, operadora_path: str, populacao_contratada_path: str):
        self.fato_parquet_path = fato_path
        self.municipio_parquet_path = municipio_path
        self.operadora_parquet_path = operadora_path
        self.populacao_contratada_path = populacao_contratada_path

    def obter_lista_municipios(self, registro_ans: int):
        with duckdb.connect(':memory:') as con:
            parametros = [self.fato_parquet_path, self.municipio_parquet_path, registro_ans]
            resultado = con.execute(LISTAR_MUNICIPIOS_OPERADORA, parametros).fetchdf()
        return resultado.to_dict('records')

    def obter_lista_modalidades(self):
        with duckdb.connect(':memory:') as con:
            resultado = con.execute(LISTAR_MODALIDADES, [self.operadora_parquet_path]).fetchdf()
        return resultado['modalidade'].tolist()

    def obter_metricas_regiao(self, registro_ans: int, codigo_municipio: int = None, modalidades: list = None):
        tem_mod = bool(modalidades)
        placeholders = ", ".join(["?"] * len(modalidades)) if tem_mod else ""
        query = build_query_metricas(especifica=bool(codigo_municipio), tem_modalidades=tem_mod)
        
        if tem_mod: query = query.format(placeholders)

        params = [self.fato_parquet_path]
        if tem_mod: params.append(self.operadora_parquet_path)
        if tem_mod: params.extend(modalidades)
        params.extend([self.municipio_parquet_path, self.fato_parquet_path, registro_ans])
        if codigo_municipio: params.append(codigo_municipio)

        with duckdb.connect(':memory:') as con:
            resultado = con.execute(query, params).fetchdf()
        return resultado.to_dict('records')[0] if not resultado.empty else None

    def obter_pareto_regiao(self, codigo_municipio: int, modalidades: list = None):
        tem_mod = bool(modalidades)
        placeholders = ", ".join(["?"] * len(modalidades)) if tem_mod else ""
        query = build_query_pareto(tem_modalidades=tem_mod)
        if tem_mod: query = query.format(placeholders)

        params = [self.fato_parquet_path, self.operadora_parquet_path, codigo_municipio]
        if tem_mod: params.extend(modalidades)

        with duckdb.connect(':memory:') as con:
            resultado = con.execute(query, params).fetchdf()
        return resultado.to_dict('records')

    def obter_faixas_etarias(self, registro_ans: int, codigo_municipio: int, modalidades: list = None):
        tem_mod = bool(modalidades)
        placeholders = ", ".join(["?"] * len(modalidades)) if tem_mod else ""
        query = build_query_faixas(tem_modalidades=tem_mod)
        if tem_mod: query = query.format(placeholders)

        params = [self.municipio_parquet_path, codigo_municipio, self.fato_parquet_path]
        if tem_mod: params.append(self.operadora_parquet_path)
        if tem_mod: params.append(codigo_municipio)
        if tem_mod: params.extend(modalidades)
        elif not tem_mod: params.append(codigo_municipio) # Se não tem join, o where pede o codigo logo de cara
        
        params.extend([self.fato_parquet_path, codigo_municipio, registro_ans])

        with duckdb.connect(':memory:') as con:
            resultado = con.execute(query, params).fetchdf()
        return resultado.to_dict('records')[0] if not resultado.empty else None

    def obter_emprego_formal(self, codigo_municipio: int):
        with duckdb.connect(':memory:') as con:
            parametros = [self.populacao_contratada_path, codigo_municipio]
            resultado = con.execute(OBTER_EMPREGO_FORMAL_REGIAO, parametros).fetchdf()
        
        return resultado.to_dict('records')[0] if not resultado.empty else None