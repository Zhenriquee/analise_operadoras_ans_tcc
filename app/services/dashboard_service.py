from app.repositories.dashboard_repository import DashboardRepository

class DashboardService:
    def __init__(self, repository: DashboardRepository):
        self.repository = repository

    def processar_resumo_operadora(self, registro_ans: int):
        dados = self.repository.obter_resumo_carteira(registro_ans)
        
        if not dados:
            return None
            
        # Regra de negócio: formatar os números para a "história" ficar legível
        return {
            "ultima_competencia": dados["ultima_competencia"],
            # Formata 1500000 para "1.500.000"
            "total_vidas_formatado": f"{int(dados['total_vidas']):,}".replace(",", "."),
            "total_municipios": int(dados['total_municipios'])
        }

    def processar_graficos(self, registro_ans: int):
        demografia = self.repository.obter_perfil_demografico(registro_ans)
        municipios = self.repository.obter_top_municipios(registro_ans)

        # 1. Preparando a Pirâmide Etária
        dados_piramide = None
        if demografia and demografia.get('m_0_18') is not None:
            faixas = [
                '0 a 18', '19 a 23', '24 a 28', '29 a 33', '34 a 38', 
                '39 a 43', '44 a 48', '49 a 53', '54 a 58', '59+'
            ]
            # Truque: Gráfico de pirâmide exige que um dos lados seja negativo
            homens = [
                -int(demografia['m_0_18'] or 0), -int(demografia['m_19_23'] or 0), -int(demografia['m_24_28'] or 0),
                -int(demografia['m_29_33'] or 0), -int(demografia['m_34_38'] or 0), -int(demografia['m_39_43'] or 0),
                -int(demografia['m_44_48'] or 0), -int(demografia['m_49_53'] or 0), -int(demografia['m_54_58'] or 0),
                -int(demografia['m_59_mais'] or 0)
            ]
            mulheres = [
                int(demografia['f_0_18'] or 0), int(demografia['f_19_23'] or 0), int(demografia['f_24_28'] or 0),
                int(demografia['f_29_33'] or 0), int(demografia['f_34_38'] or 0), int(demografia['f_39_43'] or 0),
                int(demografia['f_44_48'] or 0), int(demografia['f_49_53'] or 0), int(demografia['f_54_58'] or 0),
                int(demografia['f_59_mais'] or 0)
            ]
            dados_piramide = {"faixas": faixas, "homens": homens, "mulheres": mulheres}

        # 2. Preparando os Top Municípios
        dados_municipios = None
        if municipios:
            # Revertemos as listas ([::-1]) porque gráficos horizontais desenham de baixo para cima
            labels = [m.get('nome_municipio') or f"IBGE {m['codigo_municipio']}" for m in municipios][::-1] 
            valores = [int(m['total_vidas']) for m in municipios][::-1]
            dados_municipios = {"labels": labels, "valores": valores}

        return {"piramide": dados_piramide, "municipios": dados_municipios}