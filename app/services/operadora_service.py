from app.repositories.operadora_repository import OperadoraRepository

class OperadoraService:
    def __init__(self, repository: OperadoraRepository):
        self.repository = repository

    def listar_operadoras(self, termo_busca: str = ""):
        # Aqui podemos adicionar validações no futuro (ex: remover caracteres especiais)
        return self.repository.buscar_operadoras(termo_busca)