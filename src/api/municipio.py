"""
Blueprint da Visão Município.

Fornece endpoints para KPIs, ranking de operadoras, distribuição
por modalidade e termômetro B2B de um município selecionado.
"""
from flask import Blueprint, jsonify, request
from src.data_loader import DataLoader

municipio_bp = Blueprint("municipio", __name__, url_prefix="/api/municipio")


def _filter_dataframe(df):
    """Aplica filtros comuns de UF, município e modalidade ao DataFrame."""
    uf_param = request.args.get("uf", "")
    if uf_param:
        ufs = [u.strip() for u in uf_param.split(",")]
        df = df[df["nome_uf"].isin(ufs)]

    municipio = request.args.get("municipio", "")
    if municipio:
        df = df[df["nome_municipio"] == municipio]

    modalidade_param = request.args.get("modalidade", "")
    if modalidade_param:
        modalidades = [m.strip() for m in modalidade_param.split(",")]
        df = df[df["modalidade"].isin(modalidades)]

    return df


@municipio_bp.route("/kpis", methods=["GET"])
def get_kpis():
    """
    Retorna os KPIs da Visão Município.

    Cards: População, Pop. Estimada 2025, Vínculos CLT,
    Total de Vidas, Taxa de Cobertura.
    """
    dl = DataLoader()
    df = _filter_dataframe(dl.op_mun)

    if df.empty:
        return jsonify({
            "populacao_2022": 0,
            "populacao_estimada_2025": 0,
            "crescimento_percentual": 0,
            "vinculos_clt": 0,
            "total_vidas": 0,
            "taxa_cobertura": 0,
            "num_operadoras": 0,
        })

    # Populacao e CLT são valores por município, não por operadora
    # Pegar o valor único por município (first de cada grupo)
    mun_data = df.groupby("codigo_municipio").agg(
        populacao_2022=("populacao_2022", "first"),
        populacao_estimada_2025=("populacao_estimada_2025", "first"),
        vinculos_clt=("qtd_pessoas_contratadas", "first"),
    ).sum()

    pop_2022 = int(mun_data["populacao_2022"])
    pop_2025 = int(mun_data["populacao_estimada_2025"])
    vinculos = int(mun_data["vinculos_clt"])
    total_vidas = int(df["qtd_beneficiarios"].sum())

    crescimento = ((pop_2025 - pop_2022) / pop_2022 * 100) if pop_2022 > 0 else 0
    cobertura = (total_vidas / pop_2022 * 100) if pop_2022 > 0 else 0

    return jsonify({
        "populacao_2022": pop_2022,
        "populacao_estimada_2025": pop_2025,
        "crescimento_percentual": round(crescimento, 1),
        "vinculos_clt": vinculos,
        "total_vidas": total_vidas,
        "taxa_cobertura": round(cobertura, 1),
        "num_operadoras": int(df["codigo_registro_operadora"].nunique()),
    })


@municipio_bp.route("/ranking", methods=["GET"])
def get_ranking():
    """
    Top 10 operadoras com mais vidas no município e seus market shares.

    Retorna lista ordenada por qtd_beneficiarios descendente.
    """
    dl = DataLoader()
    df = _filter_dataframe(dl.op_mun)

    if df.empty:
        return jsonify([])

    total_vidas = df["qtd_beneficiarios"].sum()

    ranking = (
        df.groupby(["codigo_registro_operadora", "razao_social"], as_index=False)
        .agg(qtd_beneficiarios=("qtd_beneficiarios", "sum"))
        .sort_values("qtd_beneficiarios", ascending=False)
        .head(10)
    )

    result = []
    for _, row in ranking.iterrows():
        market_share = (
            (row["qtd_beneficiarios"] / total_vidas * 100) if total_vidas > 0 else 0
        )
        result.append({
            "razao_social": row["razao_social"],
            "qtd_beneficiarios": int(row["qtd_beneficiarios"]),
            "market_share": round(market_share, 1),
        })

    return jsonify(result)


@municipio_bp.route("/modalidade", methods=["GET"])
def get_modalidade():
    """
    Distribuição de vidas por modalidade no município.

    Retorna dados para gráfico de pizza.
    """
    dl = DataLoader()
    # Filtrar apenas por UF e município, não por modalidade
    df = dl.op_mun.copy()

    uf_param = request.args.get("uf", "")
    if uf_param:
        ufs = [u.strip() for u in uf_param.split(",")]
        df = df[df["nome_uf"].isin(ufs)]

    municipio = request.args.get("municipio", "")
    if municipio:
        df = df[df["nome_municipio"] == municipio]

    if df.empty:
        return jsonify([])

    dist = (
        df.groupby("modalidade", as_index=False)
        .agg(qtd_beneficiarios=("qtd_beneficiarios", "sum"))
        .sort_values("qtd_beneficiarios", ascending=False)
    )

    total = dist["qtd_beneficiarios"].sum()
    result = [
        {
            "modalidade": row["modalidade"],
            "qtd_beneficiarios": int(row["qtd_beneficiarios"]),
            "percentual": round(row["qtd_beneficiarios"] / total * 100, 1) if total > 0 else 0,
        }
        for _, row in dist.iterrows()
    ]

    return jsonify(result)


@municipio_bp.route("/termometro_b2b", methods=["GET"])
def get_termometro_b2b():
    """
    Dados para o Termômetro B2B: comparativo entre potencial (CLT) e vidas atuais.

    Retorna valores para gráfico de gauge/velocímetro.
    """
    dl = DataLoader()
    df = _filter_dataframe(dl.op_mun)

    if df.empty:
        return jsonify({
            "potencial_b2b": 0,
            "vidas_atuais": 0,
            "penetracao": 0,
            "oportunidade": 0,
        })

    # CLT é valor por município (pegar first de cada grupo)
    mun_data = df.groupby("codigo_municipio").agg(
        vinculos_clt=("qtd_pessoas_contratadas", "first"),
    ).sum()

    potencial = int(mun_data["vinculos_clt"])
    vidas = int(df["qtd_beneficiarios"].sum())

    penetracao = (vidas / potencial * 100) if potencial > 0 else 0
    oportunidade = max(0, potencial - vidas)

    return jsonify({
        "potencial_b2b": potencial,
        "vidas_atuais": vidas,
        "penetracao": round(penetracao, 1),
        "oportunidade": oportunidade,
    })
