import duckdb
import pandas as pd
from app.repositories.queries.operadora_queries import (
    BUSCAR_TODAS_OPERADORAS, 
    BUSCAR_OPERADORAS_POR_TERMO
)

class OperadoraRepository:
    def __init__(self, parquet_path: str):
        # 1. Pré-carregamento: Lê o arquivo do disco para a RAM UMA ÚNICA VEZ!
        # Isso ocorre quando o servidor (Flask) é iniciado.
        self.df_operadoras = pd.read_parquet(parquet_path)

    def buscar_operadoras(self, termo_busca: str = ""):
        with duckdb.connect(':memory:') as con:
            
            # 2. Registra o DataFrame que está na RAM como uma tabela virtual no DuckDB
            con.register('tb_operadoras', self.df_operadoras)
            
            if termo_busca:
                termo = termo_busca.upper()
                parametros = [f"%{termo}%", f"{termo}%"]
                df_resultado = con.execute(BUSCAR_OPERADORAS_POR_TERMO, parametros).fetchdf()
            else:
                df_resultado = con.execute(BUSCAR_TODAS_OPERADORAS).fetchdf()
                
        return df_resultado.to_dict('records')