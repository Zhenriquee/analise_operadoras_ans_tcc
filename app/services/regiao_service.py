import pandas as pd
from app.repositories.regiao_repository import RegiaoRepository

class RegiaoService:
    def __init__(self, repository: RegiaoRepository):
        self.repository = repository

    def listar_municipios_atuacao(self, registro_ans: int):
        return self.repository.obter_lista_municipios(registro_ans)

    def listar_modalidades(self):
        return self.repository.obter_lista_modalidades()

    def processar_analise_regional(self, registro_ans: int, codigo_municipio: int = None, modalidades: list = None):
        dados = self.repository.obter_metricas_regiao(registro_ans, codigo_municipio, modalidades)
        if not dados: return None
            
        cod_mun = dados['codigo_municipio']
        def s_int(v): return int(v) if pd.notna(v) else 0

        populacao = s_int(dados['populacao_total'])
        mercado = s_int(dados['total_vidas_mercado'])
        operadora = s_int(dados['vidas_operadora'])
        
        cobertura = round((mercado / populacao * 100), 1) if populacao > 0 else 0
        market_share = round((operadora / mercado * 100), 1) if mercado > 0 else 0

        # --- 1. Processa o PARETO ---
        pareto_raw = self.repository.obter_pareto_regiao(cod_mun, modalidades)
        labels_pareto, alvo_pareto, outros_pareto, linha_pareto = [], [], [], []

        dados_emprego = self.repository.obter_emprego_formal(cod_mun)
        emprego_formal = int(dados_emprego['estoque']) if dados_emprego else 0
        
        for p in pareto_raw:
            labels_pareto.append(p['razao_social'][:20] + "...") 
            linha_pareto.append(round(p['perc_acumulado'], 1))
            if p['codigo_registro_operadora'] == registro_ans:
                alvo_pareto.append(s_int(p['vidas']))
                outros_pareto.append(None)
            else:
                alvo_pareto.append(None)
                outros_pareto.append(s_int(p['vidas']))

        # --- 2. Processa FAIXAS ETÁRIAS ---
        faixas_raw = self.repository.obter_faixas_etarias(registro_ans, cod_mun, modalidades)
        arr_pop, arr_mercado, arr_op = [], [], []
        if faixas_raw:
            for i in range(1, 11):
                arr_pop.append(s_int(faixas_raw.get(f'p_{i}')))
                arr_mercado.append(s_int(faixas_raw.get(f'm_{i}')))
                arr_op.append(s_int(faixas_raw.get(f'o_{i}')))

        return {
            "municipio_uf": f"{dados['municipio']} - {dados['sg_uf']}",
            "codigo_municipio": cod_mun,
            "populacao_formatada": f"{populacao:,}".replace(",", "."),
            "vidas_operadora_formatada": f"{operadora:,}".replace(",", "."),
            "market_share_formatado": f"{market_share:.1f}%".replace(".", ","),
            "emprego_formal_formatado": f"{emprego_formal:,}".replace(",", "."),
            "cobertura_formatada": f"{cobertura:.1f}%".replace(".", ","),
            "grafico_cobertura": [cobertura],
            "grafico_pareto": {
                "labels": labels_pareto, "alvo": alvo_pareto, 
                "outros": outros_pareto, "linha": linha_pareto
            },
            "grafico_faixas": {
                "categorias": ['0-18', '19-23', '24-28', '29-33', '34-38', '39-43', '44-48', '49-53', '54-58', '59+'],
                "populacao": arr_pop,
                "mercado": arr_mercado,
                "operadora": arr_op
            }
        }