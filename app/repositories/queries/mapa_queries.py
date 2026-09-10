LISTAR_ESTADOS_OPERADORA = """
    SELECT m.sg_uf, SUM(f.qtd_beneficiarios) as total_vidas
    FROM read_parquet(?) f
    JOIN read_parquet(?) m ON f.codigo_municipio = m.codigo_municipio
    WHERE f.codigo_registro_operadora = ?
    GROUP BY m.sg_uf
    ORDER BY total_vidas DESC
"""

LISTAR_MODALIDADES_MAPA = """
    SELECT DISTINCT modalidade 
    FROM read_parquet(?) 
    WHERE modalidade IS NOT NULL 
    ORDER BY modalidade
"""

def build_query_mapa(tem_estado=False):
    where_estado = "AND m.sg_uf = ?" if tem_estado else ""
    return f"""
        SELECT 
            f.codigo_municipio,
            m.municipio || ' - ' || m.sg_uf as nome_municipio,
            f.qtd_beneficiarios as vidas,
            m.nome_perfil_mercado,
            m.justificativa_estrategica,
            ST_AsGeoJSON(ST_GeomFromText(m.poligono)) as geometria
        FROM read_parquet(?) f
        JOIN read_parquet(?) m ON f.codigo_municipio = m.codigo_municipio
        WHERE f.codigo_registro_operadora = ?
          AND m.poligono IS NOT NULL
          {where_estado}
    """

def build_query_ranking(tem_modalidades=False):
    where_mod = "AND d.modalidade IN ({})" if tem_modalidades else ""
    return f"""
        WITH totais AS (
            SELECT 
                f.codigo_registro_operadora,
                MAX(d.razao_social) as razao_social,
                MAX(d.modalidade) as modalidade,
                SUM(f.qtd_beneficiarios) as vidas
            FROM read_parquet(?) f
            JOIN read_parquet(?) d ON f.codigo_registro_operadora = d.codigo_registro_operadora
            WHERE f.codigo_municipio = ?
            {where_mod}
            GROUP BY f.codigo_registro_operadora
            HAVING SUM(f.qtd_beneficiarios) > 0
        )
        SELECT 
            codigo_registro_operadora,
            COALESCE(razao_social, 'ANS: ' || CAST(codigo_registro_operadora AS VARCHAR)) as razao_social,
            modalidade,
            vidas,
            (vidas / SUM(vidas) OVER ()) * 100 as market_share
        FROM totais
        ORDER BY vidas DESC
        LIMIT 10
    """