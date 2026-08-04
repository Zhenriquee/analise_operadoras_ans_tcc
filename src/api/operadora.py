"""
Blueprint da Visão Operadora.

Fornece endpoints para KPIs de footprint, mapa coroplético,
curva ABC (Pareto) e market share na praça principal.
"""
from flask import Blueprint, jsonify, request
from src.data_loader import DataLoader
from src.utils.geo import build_feature_collection

operadora_bp = Blueprint("operadora", __name__, url_prefix="/api/operadora")


def _get_operadora_df():
    """Filtra o DataFrame pela operadora e modalidades selecionadas."""
    dl = DataLoader()
    df = dl.op_mun.copy()

    operadora = request.args.get("operadora", "")
    if operadora:
        try:
            codigo = int(operadora)
            df = df[df["codigo_registro_operadora"] == codigo]
        except ValueError:
            df = df[df["razao_social"] == operadora]

    modalidade_param = request.args.get("modalidade", "")
    if modalidade_param:
        modalidades = [m.strip() for m in modalidade_param.split(",")]
        df = df[df["modalidade"].isin(modalidades)]

    return df, dl


@operadora_bp.route("/kpis", methods=["GET"])
def get_kpis():
    """
    KPIs da Visão Operadora.

    Cards: Total Beneficiários, Presença Geográfica (municípios/estados),
    Índice de Dependência (% na principal cidade).
    """
    df, _ = _get_operadora_df()

    if df.empty:
        return jsonify({
            "total_beneficiarios": 0,
            "num_municipios": 0,
            "num_estados": 0,
            "indice_dependencia": 0,
            "cidade_principal": "",
            "vidas_cidade_principal": 0,
        })

    total = int(df["qtd_beneficiarios"].sum())
    num_mun = int(df["codigo_municipio"].nunique())
    num_uf = int(df["nome_uf"].nunique())

    # Índice de dependência: % de vidas na principal cidade
    vidas_por_cidade = df.groupby("nome_municipio")["qtd_beneficiarios"].sum()
    cidade_principal = vidas_por_cidade.idxmax()
    vidas_principal = int(vidas_por_cidade.max())
    dependencia = (vidas_principal / total * 100) if total > 0 else 0

    return jsonify({
        "total_beneficiarios": total,
        "num_municipios": num_mun,
        "num_estados": num_uf,
        "indice_dependencia": round(dependencia, 1),
        "cidade_principal": cidade_principal,
        "vidas_cidade_principal": vidas_principal,
    })


@operadora_bp.route("/mapa", methods=["GET"])
def get_mapa():
    """
    Dados GeoJSON para mapa coroplético da operadora.

    Retorna FeatureCollection com polígonos dos municípios onde
    a operadora atua, coloridos pela quantidade de beneficiários.
    """
    df, dl = _get_operadora_df()

    if df.empty:
        return jsonify({"type": "FeatureCollection", "features": []})

    # Agregar beneficiários por município
    vidas_mun = (
        df.groupby("codigo_municipio", as_index=False)
        .agg(qtd_beneficiarios=("qtd_beneficiarios", "sum"))
    )

    # Merge com dim_municipio para pegar polígonos
    mun_geo = vidas_mun.merge(
        dl.dim_mun[["codigo_municipio", "nome_municipio", "nome_uf", "poligono"]],
        on="codigo_municipio",
        how="inner",
    )

    geojson = build_feature_collection(mun_geo)
    return jsonify(geojson)


@operadora_bp.route("/pareto", methods=["GET"])
def get_pareto():
    """
    Curva ABC / Risco Geográfico.

    Top 10 cidades da operadora com barras + linha de % acumulado
    (demonstrando concentração ou pulverização da carteira).
    """
    df, _ = _get_operadora_df()

    if df.empty:
        return jsonify([])

    # Agrupar por município
    vidas = (
        df.groupby(["codigo_municipio", "nome_municipio", "nome_uf"], as_index=False)
        .agg(qtd_beneficiarios=("qtd_beneficiarios", "sum"))
        .sort_values("qtd_beneficiarios", ascending=False)
    )

    total = vidas["qtd_beneficiarios"].sum()
    vidas["percentual"] = (vidas["qtd_beneficiarios"] / total * 100).round(1)
    vidas["percentual_acumulado"] = vidas["percentual"].cumsum().round(1)

    top10 = vidas.head(10)

    result = [
        {
            "nome_municipio": row["nome_municipio"],
            "nome_uf": row["nome_uf"],
            "qtd_beneficiarios": int(row["qtd_beneficiarios"]),
            "percentual": float(row["percentual"]),
            "percentual_acumulado": float(row["percentual_acumulado"]),
        }
        for _, row in top10.iterrows()
    ]

    return jsonify(result)


@operadora_bp.route("/market_share_principal", methods=["GET"])
def get_market_share_principal():
    """
    Market share da operadora na sua praça principal (donut chart).

    Compara a operadora selecionada com o "Resto do Mercado"
    na cidade onde ela tem mais clientes.
    """
    df, dl = _get_operadora_df()

    if df.empty:
        return jsonify({
            "cidade": "",
            "operadora_vidas": 0,
            "operadora_share": 0,
            "mercado_vidas": 0,
            "mercado_share": 0,
        })

    # Encontrar a praça principal da operadora
    vidas_por_cidade = df.groupby(
        ["codigo_municipio", "nome_municipio"]
    )["qtd_beneficiarios"].sum()
    idx_principal = vidas_por_cidade.idxmax()
    cod_mun_principal = idx_principal[0]
    nome_principal = idx_principal[1]
    vidas_operadora = int(vidas_por_cidade.max())

    # Total de vidas de TODAS as operadoras naquela cidade
    all_ops = dl.op_mun
    total_cidade = int(
        all_ops[all_ops["codigo_municipio"] == cod_mun_principal]["qtd_beneficiarios"].sum()
    )
    vidas_mercado = total_cidade - vidas_operadora

    share_op = (vidas_operadora / total_cidade * 100) if total_cidade > 0 else 0
    share_mercado = 100 - share_op

    return jsonify({
        "cidade": nome_principal,
        "operadora_vidas": vidas_operadora,
        "operadora_share": round(share_op, 1),
        "mercado_vidas": vidas_mercado,
        "mercado_share": round(share_mercado, 1),
    })
