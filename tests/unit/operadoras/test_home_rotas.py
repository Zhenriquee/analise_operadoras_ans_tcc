from unittest.mock import patch

def test_rota_index_retorna_200(client):
    # Ação: Faz um GET na rota principal
    response = client.get('/')
    
    # Verificação: O servidor deve responder com sucesso (200) 
    assert response.status_code == 200
    
    # Decodificamos os bytes da resposta para uma string Python normal
    # Assim podemos pesquisar palavras com acento de forma natural!
    html_retornado = response.data.decode('utf-8')
    
    # Verificamos se os novos textos da nossa interface estão lá
    assert "Inteligência em" in html_retornado
    assert "Saúde Suplementar" in html_retornado
    assert "Base de Dados ANS" in html_retornado

# O patch substitui o service real por um falso apenas durante este teste
@patch('app.rotas.home_bp.operadora_service.listar_operadoras')
def test_rota_buscar_operadoras_retorna_html(mock_listar, client):
    # 1. Preparação (Arrange)
    mock_listar.return_value = [
        {
            "codigo_registro_operadora": 9999, 
            "razao_social": "Saude Plus", 
            "cnpj": "00.000.000/0001-00", 
            "modalidade": "Cooperativa", 
            "uf": "RJ"
        }
    ]

    # 2. Ação (Act): Simulamos a requisição do HTMX
    response = client.get('/buscar-operadoras?q=Saude')

    # 3. Verificação (Assert)
    assert response.status_code == 200
    mock_listar.assert_called_once_with("Saude")
    
    html_retornado = response.data.decode('utf-8')
    assert "Saude Plus" in html_retornado
    assert "9999" in html_retornado
    assert "RJ" in html_retornado