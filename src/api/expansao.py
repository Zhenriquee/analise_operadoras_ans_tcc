"""
Blueprint da Visão Expansão — Aba 3: O Plano Tático.

Fornece endpoints para logística de expansão (raio de 50km)
e análise de tendência de contratações CLT (CAGED).
"""
from flask import Blueprint, jsonify, request
from src.data_loader import DataLoader
import pandas as pd

expansao_bp = Blueprint("expansao", __name__, url_prefix="/api/expansao")


def _get_codigo_operadora():
    codigo = request.args.get("operadora", "")
    if not codigo:
        return None
    try:
        return int(codigo)
    except ValueError:
        return None


@expansao_bp.route("/mapa_raio50km", methods=["GET"])
def get_mapa_raio50km():
    """
    Mapa logístico de expansão em um raio de 50km.
    
    Identifica os municípios onde a operadora atua (hubs), 
    busca os polígonos de 50km ao redor deles, e identifica 
    os vizinhos válidos.
    """
    dl = DataLoader()
    codigo = _get_codigo_operadora()

    if codigo is None:
        return jsonify({"type": "FeatureCollection", "features": []})

    # 1. Identificar onde a operadora já atua (usando fato_beneficiario)
    fb = dl.fato_beneficiario
    fb_op = fb[fb["codigo_registro_operadora"] == codigo]
    if fb_op.empty:
        return jsonify({"type": "FeatureCollection", "features": []})
        
    comp_max = fb_op["ID_TEMPO_COMPETENCIA"].max()
    fb_latest = fb_op[fb_op["ID_TEMPO_COMPETENCIA"] == comp_max]
    
    # Pegar apenas cidades onde tem > 0 clientes
    mun_atuais = fb_latest[fb_latest["qtd_beneficiarios"] > 0]["codigo_municipio"].unique()
    
    if len(mun_atuais) == 0:
        return jsonify({"type": "FeatureCollection", "features": []})

    # 2. Filtrar a tabela de raio_50km para esses municípios "hub"
    raio_df = dl.raio_50km
    hubs_df = raio_df[raio_df["codigo_municipio_analisado"].isin(mun_atuais)]
    
    if hubs_df.empty:
        return jsonify({"type": "FeatureCollection", "features": []})

    dms = dl.dim_municipio_score

    features = []
    vizinhos_validados_totais = set()
    
    # 3. Construir as features GeoJSON
    for _, hub in hubs_df.iterrows():
        cod_hub = int(hub["codigo_municipio_analisado"])
        
        # Obter nome do hub
        hub_info = dms[dms["codigo_municipio"] == cod_hub]
        nome_hub = hub["municipio_nome"]
        if not hub_info.empty:
            nome_hub = f"{hub_info.iloc[0]['municipio']} - {hub_info.iloc[0]['sg_uf']}"
            
        # Adicionar o polígono de 50km
        poly_geom = hub["poligono_raio_50km_geojson"]
        if poly_geom:
            features.append({
                "type": "Feature",
                "id": f"raio_{cod_hub}",
                "geometry": poly_geom,
                "properties": {
                    "tipo": "raio_50km",
                    "hub_id": cod_hub,
                    "hub_nome": nome_hub
                }
            })
            
        # Coletar os vizinhos
        vizinhos = hub["vizinhos_list"]
        for v in vizinhos:
            vizinhos_validados_totais.add(v)
            
    # 4. Adicionar os municípios vizinhos validados (pontos centróides ou polígonos)
    # Aqui, usaremos a geometria completa deles, mas classificaremos como "vizinho"
    vizinhos_df = dms[dms["codigo_municipio"].isin(vizinhos_validados_totais)]
    
    for _, viz in vizinhos_df.iterrows():
        cod_viz = int(viz["codigo_municipio"])
        # Se o vizinho já for um hub, ignorar para não sobrepor visualmente como "expansão"
        if cod_viz in mun_atuais:
            continue
            
        # Tentar pegar o WKT para converter (import inline para evitar dependencia circular)
        from src.utils.geo import wkt_to_geojson
        try:
            geom = wkt_to_geojson(viz["poligono"])
            features.append({
                "type": "Feature",
                "id": f"vizinho_{cod_viz}",
                "geometry": geom,
                "properties": {
                    "tipo": "vizinho_expansao",
                    "codigo_municipio": cod_viz,
                    "municipio": viz["municipio"],
                    "sg_uf": viz["sg_uf"],
                    "cluster_estrategico_id": int(viz["cluster_estrategico_id"]),
                    "nome_perfil_mercado": viz["nome_perfil_mercado"]
                }
            })
        except Exception:
            continue

    return jsonify({"type": "FeatureCollection", "features": features})


@expansao_bp.route("/tendencia_clt", methods=["GET"])
def get_tendencia_clt():
    """
    Série temporal (CAGED) de Admissões vs Desligamentos e Saldo.
    
    Avalia a saúde econômica (potencial B2B) dos municípios alvo
    de expansão ao longo dos últimos meses disponíveis.
    """
    dl = DataLoader()
    codigo = _get_codigo_operadora()

    if codigo is None:
        return jsonify([])

    # 1. Identificar vizinhos válidos (alvos de expansão)
    fb = dl.fato_beneficiario
    fb_op = fb[fb["codigo_registro_operadora"] == codigo]
    if fb_op.empty:
        return jsonify([])
        
    comp_max = fb_op["ID_TEMPO_COMPETENCIA"].max()
    mun_atuais = fb_op[(fb_op["ID_TEMPO_COMPETENCIA"] == comp_max) & (fb_op["qtd_beneficiarios"] > 0)]["codigo_municipio"].unique()
    
    raio_df = dl.raio_50km
    hubs_df = raio_df[raio_df["codigo_municipio_analisado"].isin(mun_atuais)]
    
    alvos_expansao = set()
    for _, hub in hubs_df.iterrows():
        for v in hub["vizinhos_list"]:
            if v not in mun_atuais:
                alvos_expansao.add(v)
                
    if not alvos_expansao:
        return jsonify([])

    # 2. Filtrar dados do CAGED (fato_populacao)
    caged = dl.fato_populacao
    caged_alvos = caged[caged["codigo_municipio"].isin(alvos_expansao)]
    
    if caged_alvos.empty:
        return jsonify([])
        
    # 3. Agregar por competência
    tendencia = (
        caged_alvos.groupby("competencia", as_index=False)
        .agg({
            "admissoes": "sum",
            "desligamentos": "sum",
            "saldos": "sum"
        })
        .sort_values("competencia")
    )
    
    # Pegar apenas os últimos 12 meses para o gráfico não ficar ilegível
    tendencia = tendencia.tail(12)

    result = []
    for _, row in tendencia.iterrows():
        # Formatar competência (YYYYMM -> MM/YYYY)
        comp = str(row["competencia"])
        comp_fmt = f"{comp[4:6]}/{comp[0:4]}" if len(comp) == 6 else comp
        
        result.append({
            "competencia": comp_fmt,
            "admissoes": int(row["admissoes"]),
            "desligamentos": int(row["desligamentos"]),
            "saldo": int(row["saldos"])
        })

    return jsonify(result)
