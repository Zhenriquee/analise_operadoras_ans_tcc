import pandas as pd
from app.repositories.dashboard_repository import DashboardRepository

class DashboardService:
    def __init__(self, repository: DashboardRepository):
        self.repository = repository

    def processar_resumo_operadora(self, registro_ans: int):
        dados = self.repository.obter_resumo_carteira(registro_ans)
        
        if not dados or pd.isna(dados.get("ultima_competencia")):
            return None
            
        comp_str = str(int(dados["ultima_competencia"]))
        if len(comp_str) == 6:
            competencia_formatada = f"{comp_str[4:6]}/{comp_str[0:4]}"
        else:
            competencia_formatada = comp_str

        return {
            "ultima_competencia": competencia_formatada,
            "total_vidas_formatado": f"{int(dados['total_vidas'] or 0):,}".replace(",", "."),
            "total_municipios": int(dados['total_municipios'] or 0),
            "total_estados": int(dados['total_estados'] or 0)
        }

    def processar_piramide(self, registro_ans: int, codigo_municipio: int = None):
        demografia = self.repository.obter_perfil_demografico(registro_ans, codigo_municipio)
        
        if not demografia:
            return None
            
        def seguro_int(valor):
            if pd.isna(valor):
                return 0
            return int(valor)

        if pd.isna(demografia.get('m_0_18')) and pd.isna(demografia.get('f_0_18')):
            return None
            
        faixas = [
            '0 a 18', '19 a 23', '24 a 28', '29 a 33', '34 a 38', 
            '39 a 43', '44 a 48', '49 a 53', '54 a 58', '59+'
        ]
        
        homens = [
            -seguro_int(demografia.get('m_0_18')), -seguro_int(demografia.get('m_19_23')),
            -seguro_int(demografia.get('m_24_28')), -seguro_int(demografia.get('m_29_33')),
            -seguro_int(demografia.get('m_34_38')), -seguro_int(demografia.get('m_39_43')),
            -seguro_int(demografia.get('m_44_48')), -seguro_int(demografia.get('m_49_53')),
            -seguro_int(demografia.get('m_54_58')), -seguro_int(demografia.get('m_59_mais'))
        ]
        
        mulheres = [
            seguro_int(demografia.get('f_0_18')), seguro_int(demografia.get('f_19_23')),
            seguro_int(demografia.get('f_24_28')), seguro_int(demografia.get('f_29_33')),
            seguro_int(demografia.get('f_34_38')), seguro_int(demografia.get('f_39_43')),
            seguro_int(demografia.get('f_44_48')), seguro_int(demografia.get('f_49_53')),
            seguro_int(demografia.get('f_54_58')), seguro_int(demografia.get('f_59_mais'))
        ]
        
        return {"faixas": faixas, "homens": homens, "mulheres": mulheres}

    def processar_municipios(self, registro_ans: int, coluna_filtro: str = None):
        municipios = self.repository.obter_top_municipios(registro_ans, coluna_filtro)
        
        if not municipios:
            return None
            
        labels = [m.get('nome_municipio') or f"IBGE {m['codigo_municipio']}" for m in municipios]
        valores = [int(m['total_vidas']) for m in municipios]
        codigos = [m['codigo_municipio'] for m in municipios]
        
        return {
            "labels": labels, 
            "valores": valores,
            "codigos": codigos
        }

    def processar_graficos(self, registro_ans: int):
        dados_piramide = self.processar_piramide(registro_ans)
        dados_municipios = self.processar_municipios(registro_ans) 

        return {
            "piramide": dados_piramide, 
            "municipios": dados_municipios, 
            "registro_ans": registro_ans
        }