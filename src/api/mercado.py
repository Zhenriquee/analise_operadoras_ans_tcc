"""
Blueprint da Visão Mercado — Aba 2: O Mapa da Guerra.

Fornece endpoints para o mapa de clusters estratégicos (K-Means)
e para o gráfico de dispersão (Oportunidade CLT vs HHI).
"""
from flask import Blueprint, jsonify, request
from src.data_loader import DataLoader
from src.utils.geo import build_feature_collection
import pandas as pd

mercado_bp = Blueprint("mercado", __name__, url_prefix="/api/mercado")


def _get_codigo_operadora():
    codigo = request.args.get("operadora", "")
    if not codigo:
        return None
    try:
        return int(codigo)
    except ValueError:
        return None


def _get_estados_operadora(dl, codigo):
    """Retorna lista de UFs onde a operadora atua."""
    ac = dl.area_comercializacao
    ac_op = ac[ac["codigo_registro_operadora"] == codigo]
    if ac_op.empty:
        return []
    
    mun_op = ac_op["codigo_municipio"].unique()
    dms = dl.dim_municipio_score
    ufs = dms[dms["codigo_municipio"].isin(mun_op)]["sg_uf"].unique().tolist()
    return ufs


@mercado_bp.route("/mapa_clusters", methods=["GET"])
def get_mapa_clusters():
    """
    GeoJSON dos municípios do estado coloridos por cluster.
    
    Os 4 clusters são:
    0: Oceano Azul Pagante
    1: Mercado Saturado Premium
    2: Fortaleza Monopolista
    3: Armadilha Pulverizada
    """
    dl = DataLoader()
    codigo = _get_codigo_operadora()

    if codigo is None:
        return jsonify({"type": "FeatureCollection", "features": []})

    ufs = _get_estados_operadora(dl, codigo)
    if not ufs:
        return jsonify({"type": "FeatureCollection", "features": []})

    dms = dl.dim_municipio_score
    dms_estado = dms[dms["sg_uf"].isin(ufs)].copy()

    if dms_estado.empty:
        return jsonify({"type": "FeatureCollection", "features": []})

    geojson = build_feature_collection(
        dms_estado,
        extra_properties=[
            "municipio", 
            "sg_uf", 
            "cluster_estrategico_id", 
            "nome_perfil_mercado",
            "justificativa_estrategica"
        ],
    )
    return jsonify(geojson)


@mercado_bp.route("/scatter_oportunidade", methods=["GET"])
def get_scatter_oportunidade():
    """
    Dados para o Gráfico de Dispersão (Scatter Plot).
    
    Eixo X = densidade_clt (potencial B2B)
    Eixo Y = hhi (concorrência/monopólio)
    Tamanho da bolha = pop alvo pagante (taxa_publico_pagante * populacao_estimada_2025)
    Cor da bolha = cluster
    """
    dl = DataLoader()
    codigo = _get_codigo_operadora()

    if codigo is None:
        return jsonify([])

    ufs = _get_estados_operadora(dl, codigo)
    if not ufs:
        return jsonify([])

    dms = dl.dim_municipio_score
    dms_estado = dms[dms["sg_uf"].isin(ufs)].copy()

    if dms_estado.empty:
        return jsonify([])

    # Calcular o tamanho da bolha: população alvo pagante
    dms_estado["tamanho_bolha"] = (
        dms_estado["taxa_publico_pagante"] * dms_estado["populacao_estimada_2025"]
    ).fillna(0).astype(int)

    # Filtrar outliers extremos para não quebrar a visualização, ou apenas enviar
    # Removendo linhas com NaN nos eixos principais
    dms_estado = dms_estado.dropna(subset=["densidade_clt", "hhi"])

    result = []
    for _, row in dms_estado.iterrows():
        result.append({
            "municipio": f"{row['municipio']} - {row['sg_uf']}",
            "x_densidade_clt": float(row["densidade_clt"]),
            "y_hhi": float(row["hhi"]),
            "tamanho": int(row["tamanho_bolha"]),
            "cluster": int(row["cluster_estrategico_id"]),
            "nome_perfil": str(row["nome_perfil_mercado"])
        })

    return jsonify(result)
