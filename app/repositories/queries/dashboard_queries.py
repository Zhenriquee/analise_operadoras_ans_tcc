# Descobre a última competência (mês/ano) e soma o total de vidas e municípios
RESUMO_CARTEIRA_OPERADORA = """
    SELECT 
        MAX(ID_TEMPO_COMPETENCIA) as ultima_competencia,
        SUM(qtd_beneficiarios) as total_vidas,
        COUNT(DISTINCT codigo_municipio) as total_municipios
    FROM read_parquet(?)
    WHERE codigo_registro_operadora = ?
"""

# Soma todas as colunas de faixa etária para a operadora selecionada
PERFIL_DEMOGRAFICO_OPERADORA = """
    SELECT 
        SUM(masculino_0_18) as m_0_18, SUM(feminino_0_18) as f_0_18,
        SUM(masculino_19_23) as m_19_23, SUM(feminino_19_23) as f_19_23,
        SUM(masculino_24_28) as m_24_28, SUM(feminino_24_28) as f_24_28,
        SUM(masculino_29_33) as m_29_33, SUM(feminino_29_33) as f_29_33,
        SUM(masculino_34_38) as m_34_38, SUM(feminino_34_38) as f_34_38,
        SUM(masculino_39_43) as m_39_43, SUM(feminino_39_43) as f_39_43,
        SUM(masculino_44_48) as m_44_48, SUM(feminino_44_48) as f_44_48,
        SUM(masculino_49_53) as m_49_53, SUM(feminino_49_53) as f_49_53,
        SUM(masculino_54_58) as m_54_58, SUM(feminino_54_58) as f_54_58,
        SUM(masculino_59_mais) as m_59_mais, SUM(feminino_59_mais) as f_59_mais
    FROM read_parquet(?)
    WHERE codigo_registro_operadora = ?
"""