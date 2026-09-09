LISTAR_MUNICIPIOS_OPERADORA = """
    SELECT 
        f.codigo_municipio,
        m.municipio || ' - ' || m.sg_uf AS nome_municipio
    FROM read_parquet(?) f
    JOIN read_parquet(?) m ON f.codigo_municipio = m.codigo_municipio
    WHERE f.codigo_registro_operadora = ?
    ORDER BY f.qtd_beneficiarios DESC
"""

LISTAR_MODALIDADES = """
    SELECT DISTINCT modalidade 
    FROM read_parquet(?) 
    WHERE modalidade IS NOT NULL 
    ORDER BY modalidade
"""

OBTER_EMPREGO_FORMAL_REGIAO = """
    SELECT estoque 
    FROM read_parquet(?)
    WHERE codigo_municipio = ?
    ORDER BY competencia DESC
    LIMIT 1
"""

def build_query_metricas(especifica=False, tem_modalidades=False):
    join_dim = "JOIN read_parquet(?) d ON f2.codigo_registro_operadora = d.codigo_registro_operadora" if tem_modalidades else ""
    where_mod = "AND d.modalidade IN ({})" if tem_modalidades else ""
    limit_or_filter = "WHERE f.codigo_registro_operadora = ? AND m.codigo_municipio = ?" if especifica else "WHERE f.codigo_registro_operadora = ? ORDER BY f.qtd_beneficiarios DESC LIMIT 1"

    return f"""
        SELECT 
            m.codigo_municipio, m.municipio, m.sg_uf, 
            m.qtd_populacao as populacao_total, 
            (
                SELECT SUM(f2.qtd_beneficiarios) 
                FROM read_parquet(?) f2 
                {join_dim}
                WHERE f2.codigo_municipio = m.codigo_municipio
                {where_mod}
            ) as total_vidas_mercado,
            f.qtd_beneficiarios as vidas_operadora
        FROM read_parquet(?) m
        JOIN read_parquet(?) f ON m.codigo_municipio = f.codigo_municipio 
        {limit_or_filter}
    """

def build_query_pareto(tem_modalidades=False):
    where_mod = "AND d.modalidade IN ({})" if tem_modalidades else ""
    return f"""
        WITH totais AS (
            SELECT 
                f.codigo_registro_operadora, 
                SUM(f.qtd_beneficiarios) as vidas,
                MAX(d.razao_social) as razao_social
            FROM read_parquet(?) f
            INNER JOIN read_parquet(?) d 
                ON f.codigo_registro_operadora = d.codigo_registro_operadora
            WHERE f.codigo_municipio = ?
            {where_mod}
            GROUP BY f.codigo_registro_operadora
            HAVING SUM(f.qtd_beneficiarios) > 0
        )
        SELECT 
            codigo_registro_operadora,
            COALESCE(razao_social, 'ANS: ' || CAST(codigo_registro_operadora AS VARCHAR)) as razao_social,
            vidas,
            SUM(vidas) OVER (ORDER BY vidas DESC) / SUM(vidas) OVER () * 100 as perc_acumulado
        FROM totais
        ORDER BY vidas DESC
        LIMIT 15
    """

def build_query_faixas(tem_modalidades=False):
    join_dim = "JOIN read_parquet(?) d ON f_mercado.codigo_registro_operadora = d.codigo_registro_operadora" if tem_modalidades else ""
    where_mod = "AND d.modalidade IN ({})" if tem_modalidades else ""
    
    return f"""
        WITH pop AS (
            SELECT 
                (masculino_0_18 + feminino_0_18) as p_1, (masculino_19_23 + feminino_19_23) as p_2,
                (masculino_24_28 + feminino_24_28) as p_3, (masculino_29_33 + feminino_29_33) as p_4,
                (masculino_34_38 + feminino_34_38) as p_5, (masculino_39_43 + feminino_39_43) as p_6,
                (masculino_44_48 + feminino_44_48) as p_7, (masculino_49_53 + feminino_49_53) as p_8,
                (masculino_54_58 + feminino_54_58) as p_9, (masculino_59_mais + feminino_59_mais) as p_10
            FROM read_parquet(?) WHERE codigo_municipio = ?
        ),
        mercado AS (
            SELECT 
                SUM(f_mercado.masculino_0_18 + f_mercado.feminino_0_18) as m_1, SUM(f_mercado.masculino_19_23 + f_mercado.feminino_19_23) as m_2,
                SUM(f_mercado.masculino_24_28 + f_mercado.feminino_24_28) as m_3, SUM(f_mercado.masculino_29_33 + f_mercado.feminino_29_33) as m_4,
                SUM(f_mercado.masculino_34_38 + f_mercado.feminino_34_38) as m_5, SUM(f_mercado.masculino_39_43 + f_mercado.feminino_39_43) as m_6,
                SUM(f_mercado.masculino_44_48 + f_mercado.feminino_44_48) as m_7, SUM(f_mercado.masculino_49_53 + f_mercado.feminino_49_53) as m_8,
                SUM(f_mercado.masculino_54_58 + f_mercado.feminino_54_58) as m_9, SUM(f_mercado.masculino_59_mais + f_mercado.feminino_59_mais) as m_10
            FROM read_parquet(?) f_mercado
            {join_dim}
            WHERE f_mercado.codigo_municipio = ?
            {where_mod}
        ),
        operadora AS (
            SELECT 
                SUM(masculino_0_18 + feminino_0_18) as o_1, SUM(masculino_19_23 + feminino_19_23) as o_2,
                SUM(masculino_24_28 + feminino_24_28) as o_3, SUM(masculino_29_33 + feminino_29_33) as o_4,
                SUM(masculino_34_38 + feminino_34_38) as o_5, SUM(masculino_39_43 + feminino_39_43) as o_6,
                SUM(masculino_44_48 + feminino_44_48) as o_7, SUM(masculino_49_53 + feminino_49_53) as o_8,
                SUM(masculino_54_58 + feminino_54_58) as o_9, SUM(masculino_59_mais + feminino_59_mais) as o_10
            FROM read_parquet(?) WHERE codigo_municipio = ? AND codigo_registro_operadora = ?
        )
        SELECT * FROM pop, mercado, operadora
    """