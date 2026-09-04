from unittest.mock import Mock
from app.services.dashboard_service import DashboardService

def test_processar_resumo_operadora_com_dados():
    # 1. Preparação (Arrange)
    mock_repository = Mock()
    # Simulamos o retorno bruto do banco de dados
    mock_repository.obter_resumo_carteira.return_value = {
        "ultima_competencia": "2026-09",
        "total_vidas": 1500000,  # Sem formatação
        "total_municipios": 42
    }
    
    service = DashboardService(mock_repository)

    # 2. Ação (Act)
    resultado = service.processar_resumo_operadora(367087)

    # 3. Verificação (Assert)
    mock_repository.obter_resumo_carteira.assert_called_once_with(367087)
    assert resultado["ultima_competencia"] == "2026-09"
    assert resultado["total_vidas_formatado"] == "1.500.000" # Verifica se formatou certo!
    assert resultado["total_municipios"] == 42

def test_processar_resumo_operadora_sem_dados():
    # 1. Preparação
    mock_repository = Mock()
    mock_repository.obter_resumo_carteira.return_value = None # Nenhum dado encontrado
    service = DashboardService(mock_repository)

    # 2. Ação
    resultado = service.processar_resumo_operadora(999999)

    # 3. Verificação
    assert resultado is None