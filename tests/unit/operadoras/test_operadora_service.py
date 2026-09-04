from unittest.mock import Mock
from app.services.operadora_service import OperadoraService

def test_listar_operadoras_com_sucesso():
    # 1. Preparação (Arrange)
    # Criamos um "Repository Falso" que retorna dados controlados
    mock_repository = Mock()
    mock_repository.buscar_operadoras.return_value = [
        {"codigo_registro_operadora": 1234, "razao_social": "Unimed Teste", "uf": "SP"}
    ]
    
    # Injetamos o repositório falso no serviço real
    service = OperadoraService(mock_repository)

    # 2. Ação (Act)
    resultado = service.listar_operadoras("Unimed")

    # 3. Verificação (Assert)
    # Verifica se o repositório foi chamado com o parâmetro correto
    mock_repository.buscar_operadoras.assert_called_once_with("Unimed")
    
    # Verifica se o retorno é o esperado
    assert len(resultado) == 1
    assert resultado[0]["razao_social"] == "Unimed Teste"