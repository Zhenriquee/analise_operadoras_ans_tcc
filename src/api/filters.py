"""
Blueprint de filtros globais do dashboard.

Fornece endpoints para popular os dropdowns de filtros em cascata:
UF → Município, Operadora, Modalidade.
"""
from flask import Blueprint, jsonify, request
from src.data_loader import DataLoader

filters_bp = Blueprint("filters", __name__, url_prefix="/api/filters")


@filters_bp.route("/ufs", methods=["GET"])
def get_ufs():
    """Retorna lista de todas as UFs disponíveis, ordenadas."""
    dl = DataLoader()
    ufs = sorted(dl.op_mun["nome_uf"].dropna().unique().tolist())
    return jsonify(ufs)


@filters_bp.route("/municipios", methods=["GET"])
def get_municipios():
    """
    Retorna municípios filtrados por UF.

    Query params:
        uf (str, opcional): Nome da UF para filtrar. Aceita múltiplos via vírgula.
    """
    dl = DataLoader()
    df = dl.op_mun

    uf_param = request.args.get("uf", "")
    if uf_param:
        ufs = [u.strip() for u in uf_param.split(",")]
        df = df[df["nome_uf"].isin(ufs)]

    municipios = sorted(df["nome_municipio"].dropna().unique().tolist())
    return jsonify(municipios)


@filters_bp.route("/operadoras", methods=["GET"])
def get_operadoras():
    """
    Retorna operadoras filtradas por UF e/ou município.

    Query params:
        uf (str, opcional): Nome da UF para filtrar.
        municipio (str, opcional): Nome do município para filtrar.
    """
    dl = DataLoader()
    df = dl.op_mun

    uf_param = request.args.get("uf", "")
    if uf_param:
        ufs = [u.strip() for u in uf_param.split(",")]
        df = df[df["nome_uf"].isin(ufs)]

    municipio = request.args.get("municipio", "")
    if municipio:
        df = df[df["nome_municipio"] == municipio]

    # Retorna lista de dicts com código e razão social
    operadoras = (
        df[["codigo_registro_operadora", "razao_social"]]
        .drop_duplicates()
        .sort_values("razao_social")
    )
    result = [
        {"codigo": int(row["codigo_registro_operadora"]), "nome": row["razao_social"]}
        for _, row in operadoras.iterrows()
    ]
    return jsonify(result)


@filters_bp.route("/modalidades", methods=["GET"])
def get_modalidades():
    """Retorna lista de todas as modalidades disponíveis, ordenadas."""
    dl = DataLoader()
    modalidades = sorted(dl.op_mun["modalidade"].dropna().unique().tolist())
    return jsonify(modalidades)
