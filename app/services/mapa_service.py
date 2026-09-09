import json
import pandas as pd
from app.repositories.mapa_repository import MapaRepository

class MapaService:
    def __init__(self, repository: MapaRepository):
        self.repository = repository

    def listar_estados_atuacao(self, registro_ans: int):
        return self.repository.obter_lista_estados(registro_ans)

    def processar_dados_mapa(self, registro_ans: int, sg_uf: str = None):
        resultados = self.repository.obter_dados_mapa(registro_ans, sg_uf)
        
        features = []
        for row in resultados:
            if pd.isna(row.get('geometria')) or not row.get('geometria'):
                continue
                
            vidas = int(row['vidas']) if pd.notna(row['vidas']) else 0
            
            feature = {
                "type": "Feature",
                "geometry": json.loads(row['geometria']),
                "properties": {
                    "codigo": row['codigo_municipio'],
                    "nome": row['nome_municipio'],
                    "vidas": vidas,
                    "cluster": row.get('nome_perfil_mercado') or 'Não Classificado',
                    "justificativa": row.get('justificativa_estrategica') or 'Sem justificativa.'
                }
            }
            features.append(feature)
            
        return {"type": "FeatureCollection", "features": features}