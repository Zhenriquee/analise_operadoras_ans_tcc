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