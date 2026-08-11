"""
Blueprint de filtros globais do dashboard.

Fornece endpoint para popular o seletor de operadoras no onboarding.
"""
from flask import Blueprint, jsonify
from src.data_loader import DataLoader

filters_bp = Blueprint("filters", __name__, url_prefix="/api/filters")


@filters_bp.route("/operadoras", methods=["GET"])
def get_operadoras():
    """
    Retorna lista de todas as operadoras para o onboarding.

    Returns:
        JSON array de dicts com codigo e nome (razão social),
        ordenados alfabeticamente.
    """
    dl = DataLoader()
    df = dl.dim_operadora[["codigo_registro_operadora", "razao_social"]].copy()
    df = df.drop_duplicates().sort_values("razao_social")

    result = [
        {"codigo": int(row["codigo_registro_operadora"]), "nome": row["razao_social"]}
        for _, row in df.iterrows()
    ]
    return jsonify(result)
