from unittest.mock import patch

# Mockamos as instâncias que importamos de dependecies.py para dentro do dashboard_bp
@patch('app.rotas.dashboard_bp.operadora_service.listar_operadoras')
@patch('app.rotas.dashboard_bp.dashboard_service.processar_resumo_operadora')
def test_rota_dashboard_retorna_html_com_dados(mock_dash_service, mock_op_service, client):
    # 1. Preparação (Arrange)
    mock_op_service.return_value = [{
        "codigo_registro_operadora": 367087, 
        "razao_social": "UNIMED TESTE", 
        "cnpj": "00.000.000/0001-00", 
        "modalidade": "Cooperativa", 
        "cidade": "SÃO PAULO",
        "uf": "SP"
    }]
    
    mock_dash_service.return_value = {
        "ultima_competencia": "2026-09",
        "total_vidas_formatado": "1.500.000",
        "total_municipios": 42
    }

    # 2. Ação (Act)
    response = client.get('/dashboard/367087')

    # 3. Verificação (Assert)
    assert response.status_code == 200
    
    html = response.data.decode('utf-8')
    assert "UNIMED TESTE" in html
    assert "1.500.000 vidas" in html
    assert "42 municípios" in html


@patch('app.rotas.dashboard_bp.operadora_service.listar_operadoras')
def test_rota_dashboard_retorna_404_quando_nao_encontra_operadora(mock_op_service, client):
    # 1. Preparação: Simula que a operadora não existe
    mock_op_service.return_value = []

    # 2. Ação
    response = client.get('/dashboard/999999')

    # 3. Verificação: Deve retornar status 404 (Not Found)
    assert response.status_code == 404