LISTAR_ESTADOS_OPERADORA = """
    SELECT m.sg_uf, SUM(f.qtd_beneficiarios) as total_vidas
    FROM read_parquet(?) f
    JOIN read_parquet(?) m ON f.codigo_municipio = m.codigo_municipio
    WHERE f.codigo_registro_operadora = ?
    GROUP BY m.sg_uf
    ORDER BY total_vidas DESC
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