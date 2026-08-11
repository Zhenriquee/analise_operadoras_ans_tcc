"""
Utilitários para conversão de geometrias WKT/WKB para GeoJSON.

Utiliza Shapely para parsing confiável de polígonos WKT e WKB,
convertendo-os para o formato GeoJSON necessário pelo Plotly.js.
"""
from shapely import wkt, wkb
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


def wkb_to_geojson(wkb_data: bytes) -> dict:
    """
    Converte bytes WKB (POLYGON/MULTIPOLYGON) para dict GeoJSON geometry.

    Args:
        wkb_data: Bytes no formato WKB.

    Returns:
        Dict com a geometria GeoJSON (type + coordinates).
    """
    geom = wkb.loads(wkb_data)
    return mapping(geom)


def build_feature_collection(df_municipios, extra_properties=None) -> dict:
    """
    Constrói um GeoJSON FeatureCollection a partir de um DataFrame de municípios.

    O DataFrame deve conter as colunas:
    - codigo_municipio: código identificador
    - poligono: geometria WKT

    Opcionalmente pode conter qualquer coluna extra indicada em extra_properties.

    Args:
        df_municipios: DataFrame com dados dos municípios.
        extra_properties: Lista de nomes de colunas adicionais para incluir
                          como properties no GeoJSON. Se None, inclui todas
                          as colunas exceto 'poligono'.

    Returns:
        Dict no formato GeoJSON FeatureCollection.
    """
    features = []

    # Determinar colunas a incluir como propriedades
    if extra_properties is None:
        prop_cols = [c for c in df_municipios.columns if c != "poligono"]
    else:
        prop_cols = ["codigo_municipio"] + list(extra_properties)

    for _, row in df_municipios.iterrows():
        try:
            geometry = wkt_to_geojson(row["poligono"])
        except Exception:
            continue

        properties = {}
        for col in prop_cols:
            if col in row.index:
                val = row[col]
                # Converter tipos numpy para nativos Python
                if hasattr(val, "item"):
                    val = val.item()
                properties[col] = val

        features.append(
            {
                "type": "Feature",
                "id": int(row["codigo_municipio"]),
                "geometry": geometry,
                "properties": properties,
            }
        )

    return {"type": "FeatureCollection", "features": features}
