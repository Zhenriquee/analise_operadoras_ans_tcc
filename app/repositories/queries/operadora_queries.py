BUSCAR_TODAS_OPERADORAS = """
    SELECT 
        codigo_registro_operadora, 
        razao_social, 
        cnpj, 
        modalidade, 
        uf
    FROM tb_operadoras
    LIMIT 50
"""

BUSCAR_OPERADORAS_POR_TERMO = """
    SELECT 
        codigo_registro_operadora, 
        razao_social, 
        cnpj, 
        modalidade, 
        uf
    FROM tb_operadoras
    WHERE UPPER(razao_social) LIKE ? 
       OR CAST(codigo_registro_operadora AS VARCHAR) LIKE ?
    LIMIT 50
"""