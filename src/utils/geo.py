"""
Utilitários para conversão de geometrias WKT para GeoJSON.

Utiliza Shapely para parsing confiável de polígonos WKT,
convertendo-os para o formato GeoJSON necessário pelo Plotly.js.
"""
from shapely import wkt
from shapely.geometry import mapping


def wkt_to_geojson(wkt_string: str) -> dict:
    """
    Converte uma string WKT (POLYGON/MULTIPOLYGON) para dict GeoJSON geometry.

    Args:
        wkt_string: String no formato WKT, ex: "POLYGON ((-62.24 -13.06, ...))"

    Returns:
        Dict com a geometria GeoJSON (type + coordinates).
    """
    geom = wkt.loads(wkt_string)
    return mapping(geom)


def build_feature_collection(df_municipios) -> dict:
    """
    Constrói um GeoJSON FeatureCollection a partir de um DataFrame de municípios.

    O DataFrame deve conter as colunas:
    - codigo_municipio: código identificador
    - nome_municipio: nome do município
    - nome_uf: nome do estado
    - poligono: geometria WKT

    Opcionalmente pode conter:
    - qtd_beneficiarios: para coloração no mapa

    Args:
        df_municipios: DataFrame com dados dos municípios.

    Returns:
        Dict no formato GeoJSON FeatureCollection.
    """
    features = []
    for _, row in df_municipios.iterrows():
        try:
            geometry = wkt_to_geojson(row["poligono"])
        except Exception:
            continue

        properties = {
            "codigo_municipio": int(row["codigo_municipio"]),
            "nome_municipio": row.get("nome_municipio", ""),
            "nome_uf": row.get("nome_uf", ""),
        }

        # Adicionar dados de beneficiários se disponíveis
        if "qtd_beneficiarios" in row.index:
            properties["qtd_beneficiarios"] = int(row["qtd_beneficiarios"])

        features.append(
            {
                "type": "Feature",
                "id": int(row["codigo_municipio"]),
                "geometry": geometry,
                "properties": properties,
            }
        )

    return {"type": "FeatureCollection", "features": features}
