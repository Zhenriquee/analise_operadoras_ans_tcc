"""
Blueprint da Visão Operadora — Aba 1: O Nosso Quintal.

Fornece endpoints para KPIs de carteira, mapa coroplético de atuação,
top 10 municípios, e informações cadastrais.
"""
from flask import Blueprint, jsonify, request
from src.data_loader import DataLoader
from src.utils.geo import build_feature_collection

operadora_bp = Blueprint("operadora", __name__, url_prefix="/api/operadora")


def _get_codigo_operadora():
    """Extrai e valida o código da operadora da query string."""
    codigo = request.args.get("operadora", "")
    if not codigo:
        return None
    try:
        return int(codigo)
    except ValueError:
        return None


@operadora_bp.route("/info", methods=["GET"])
def get_info():
    """
    Informações cadastrais da operadora (dim_operadora).

    Retorna: razão social, CNPJ, modalidade, endereço, representante.
    """
    dl = DataLoader()
    codigo = _get_codigo_operadora()

    if codigo is None:
        return jsonify({})

    row = dl.dim_operadora[dl.dim_operadora["codigo_registro_operadora"] == codigo]

    if row.empty:
        return jsonify({})

    r = row.iloc[0]

    # Formatar CNPJ (14 dígitos)
    cnpj_raw = str(int(r["cnpj"])).zfill(14)
    cnpj_fmt = f"{cnpj_raw[:2]}.{cnpj_raw[2:5]}.{cnpj_raw[5:8]}/{cnpj_raw[8:12]}-{cnpj_raw[12:14]}"

    return jsonify({
        "razao_social": r["razao_social"],
        "cnpj": cnpj_fmt,
        "modalidade": r["modalidade"],
        "logradouro": r["logradouro"],
        "bairro": r["bairro"],
        "cidade": r["cidade"],
        "uf": r["uf"],
        "representante": r["representante"],
        "codigo_registro": int(r["codigo_registro_operadora"]),
    })


@operadora_bp.route("/kpis_carteira", methods=["GET"])
def get_kpis_carteira():
    """
    KPIs da Aba 1 — O Nosso Quintal.

    Fórmulas:
    - Total Beneficiários: SUM(fato_beneficiario.qtd_beneficiarios)
      filtrado pela operadora na competência mais recente
    - Taxa de Ocupação: COUNT(DISTINCT municipios_com_beneficiarios) /
      COUNT(DISTINCT municipios_permitidos_na_area_comercializacao) × 100
    - Razão Demográfica: SUM(faixas_jovens 0-28) / SUM(faixa_idosa 59+)
      da carteira da operadora
    """
    dl = DataLoader()
    codigo = _get_codigo_operadora()

    if codigo is None:
        return jsonify({
            "total_beneficiarios": 0,
            "taxa_ocupacao": 0,
            "municipios_com_clientes": 0,
            "municipios_permitidos": 0,
            "razao_demografica": 0,
            "pct_jovens": 0,
            "pct_idosos": 0,
        })

    # Filtrar beneficiários da operadora (competência mais recente)
    fb = dl.fato_beneficiario
    fb_op = fb[fb["codigo_registro_operadora"] == codigo]

    if fb_op.empty:
        return jsonify({
            "total_beneficiarios": 0,
            "taxa_ocupacao": 0,
            "municipios_com_clientes": 0,
            "municipios_permitidos": 0,
            "razao_demografica": 0,
            "pct_jovens": 0,
            "pct_idosos": 0,
        })

    # Usar competência mais recente
    comp_max = fb_op["ID_TEMPO_COMPETENCIA"].max()
    fb_latest = fb_op[fb_op["ID_TEMPO_COMPETENCIA"] == comp_max]

    total_benef = int(fb_latest["qtd_beneficiarios"].sum())

    # Municípios com clientes (beneficiários > 0)
    mun_com_clientes = fb_latest[fb_latest["qtd_beneficiarios"] > 0][
        "codigo_municipio"
    ].nunique()

    # Municípios permitidos pela ANS
    ac = dl.area_comercializacao
    mun_permitidos = ac[ac["codigo_registro_operadora"] == codigo][
        "codigo_municipio"
    ].nunique()

    # Taxa de ocupação
    taxa_ocupacao = (
        (mun_com_clientes / mun_permitidos * 100) if mun_permitidos > 0 else 0
    )

    # Razão Demográfica: jovens (0-28) vs idosos (59+)
    faixas_jovens = [
        "masculino_0_18", "feminino_0_18",
        "masculino_19_23", "feminino_19_23",
        "masculino_24_28", "feminino_24_28",
    ]
    faixas_idosos = [
        "masculino_59_mais", "feminino_59_mais",
    ]

    total_jovens = int(fb_latest[faixas_jovens].sum().sum())
    total_idosos = int(fb_latest[faixas_idosos].sum().sum())

    razao = (total_jovens / total_idosos) if total_idosos > 0 else 0

    pct_jovens = (total_jovens / total_benef * 100) if total_benef > 0 else 0
    pct_idosos = (total_idosos / total_benef * 100) if total_benef > 0 else 0

    return jsonify({
        "total_beneficiarios": total_benef,
        "taxa_ocupacao": round(taxa_ocupacao, 1),
        "municipios_com_clientes": mun_com_clientes,
        "municipios_permitidos": mun_permitidos,
        "razao_demografica": round(razao, 2),
        "pct_jovens": round(pct_jovens, 1),
        "pct_idosos": round(pct_idosos, 1),
    })


@operadora_bp.route("/mapa_atuacao", methods=["GET"])
def get_mapa_atuacao():
    """
    GeoJSON coroplético dos municípios de atuação da operadora.

    Cruza fato_beneficiario × dim_municipio_score para obter polígonos
    e colori-los pela densidade de beneficiários.
    """
    dl = DataLoader()
    codigo = _get_codigo_operadora()

    if codigo is None:
        return jsonify({"type": "FeatureCollection", "features": []})

    fb = dl.fato_beneficiario
    fb_op = fb[fb["codigo_registro_operadora"] == codigo]

    if fb_op.empty:
        return jsonify({"type": "FeatureCollection", "features": []})

    # Competência mais recente
    comp_max = fb_op["ID_TEMPO_COMPETENCIA"].max()
    fb_latest = fb_op[fb_op["ID_TEMPO_COMPETENCIA"] == comp_max]

    # Agregar beneficiários por município
    vidas_mun = (
        fb_latest.groupby("codigo_municipio", as_index=False)
        .agg(qtd_beneficiarios=("qtd_beneficiarios", "sum"))
    )

    # Merge com dim_municipio_score para polígonos e nomes
    dms = dl.dim_municipio_score[
        ["codigo_municipio", "municipio", "sg_uf", "poligono"]
    ].copy()

    mun_geo = vidas_mun.merge(dms, on="codigo_municipio", how="inner")

    geojson = build_feature_collection(
        mun_geo,
        extra_properties=["municipio", "sg_uf", "qtd_beneficiarios"],
    )
    return jsonify(geojson)


@operadora_bp.route("/top10_municipios", methods=["GET"])
def get_top10_municipios():
    """
    Top 10 municípios com mais vidas da operadora.

    Retorna lista ordenada por qtd_beneficiarios descendente.
    """
    dl = DataLoader()
    codigo = _get_codigo_operadora()

    if codigo is None:
        return jsonify([])

    fb = dl.fato_beneficiario
    fb_op = fb[fb["codigo_registro_operadora"] == codigo]

    if fb_op.empty:
        return jsonify([])

    comp_max = fb_op["ID_TEMPO_COMPETENCIA"].max()
    fb_latest = fb_op[fb_op["ID_TEMPO_COMPETENCIA"] == comp_max]

    vidas = (
        fb_latest.groupby("codigo_municipio", as_index=False)
        .agg(qtd_beneficiarios=("qtd_beneficiarios", "sum"))
        .sort_values("qtd_beneficiarios", ascending=False)
    )

    total = vidas["qtd_beneficiarios"].sum()

    # Merge com dim_municipio_score para obter nome
    dms = dl.dim_municipio_score[["codigo_municipio", "municipio", "sg_uf"]].copy()
    vidas = vidas.merge(dms, on="codigo_municipio", how="left")

    top10 = vidas.head(10)

    result = [
        {
            "municipio": row.get("municipio", f"Cód {row['codigo_municipio']}"),
            "sg_uf": row.get("sg_uf", ""),
            "qtd_beneficiarios": int(row["qtd_beneficiarios"]),
            "percentual": round(
                row["qtd_beneficiarios"] / total * 100, 1
            ) if total > 0 else 0,
        }
        for _, row in top10.iterrows()
    ]

    return jsonify(result)
