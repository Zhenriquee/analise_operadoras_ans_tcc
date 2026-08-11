---
trigger: always_on
---

# REGRAS RÍGIDAS DE COMPORTAMENTO
1. RESPEITE A ESTRUTURA: Você não pode criar, inventar, ou deduzir tabelas, colunas ou métricas que não possam ser calculadas a partir do schema abaixo. 
2. RELACIONAMENTOS (JOINS): Sempre que precisar cruzar dados, obedeça estritamente aos relacionamentos definidos na seção "RELACIONAMENTOS (REFS)". Use as chaves primárias e estrangeiras indicadas.
3. CRIAÇÃO DE INDICADORES: Qualquer indicador solicitado deve ser derivado matematicamente das colunas existentes (ex: taxa de cobertura, market share, índice de envelhecimento usando as faixas etárias, saldo de empregos usando admissoes e desligamentos, etc.).
4. ZERO ALUCINAÇÃO: Se for solicitado um indicador cujo dado base não existe nestas tabelas (ex: dados financeiros de faturamento), informe imediatamente que não é possível calcular com a estrutura atual.

# SCHEMA DO BANCO DE DADOS (DBML)

Table entidade_dimensao_area_comercializacao_operadora {
  codigo_registro_operadora int [pk]
  codigo_municipio int [pk]
}

Table dim_municipio_score_mercado {
  codigo_municipio_completo int [pk]
  municipio varchar
  sg_uf varchar
  estado varchar
  regiao varchar
  ano_extracao int
  poligono varchar
  codigo_municipio int
  qtd_populacao int
  populacao_estimada_2025 int
  masculino_0_18 int
  feminino_0_18 int
  masculino_19_23 int
  feminino_19_23 int
  masculino_24_28 int
  feminino_24_28 int
  masculino_29_33 int
  feminino_29_33 int
  masculino_34_38 int
  feminino_34_38 int
  masculino_39_43 int
  feminino_39_43 int
  masculino_44_48 int
  feminino_44_48 int
  masculino_49_53 int
  feminino_49_53 int
  masculino_54_58 int
  feminino_54_58 int
  masculino_59_mais int
  feminino_59_mais int
  populacao_idosa int
  indice_envelhecimento decimal
  populacao_jovem int
  taxa_publico_pagante decimal
  qtd_beneficiarios int
  hhi decimal
  estoque int
  taxa_cobertura decimal
  densidade_clt decimal
  cluster_estrategico_id int
  nome_perfil_mercado varchar
  justificativa_estrategica varchar
}

Table dimensao_raio_50km_municipios_viaveis {
  codigo_municipio_analisado int [pk]
  municipio_nome varchar
  codigo_municipio_vizinhos_validos varchar
  poligono_raio_50km varchar
}

Table entidade_dim_operadora {
  codigo_registro_operadora int [pk]
  cnpj bigint
  razao_social varchar
  modalidade varchar
  logradouro varchar
  bairro varchar
  cidade varchar
  uf varchar
  representante varchar
}

Table entidade_fato_beneficiario_por_municipio {
  ID_TEMPO_COMPETENCIA varchar [pk]
  codigo_registro_operadora int [pk]
  codigo_municipio int [pk]
  qtd_beneficiarios int
  masculino_0_18 int
  feminino_0_18 int
  masculino_19_23 int
  feminino_19_23 int
  masculino_24_28 int
  feminino_24_28 int
  masculino_29_33 int
  feminino_29_33 int
  masculino_34_38 int
  feminino_34_38 int
  masculino_39_43 int
  feminino_39_43 int
  masculino_44_48 int
  feminino_44_48 int
  masculino_49_53 int
  feminino_49_53 int
  masculino_54_58 int
  feminino_54_58 int
  masculino_59_mais int
  feminino_59_mais int
}

Table entidade_fato_populacao_contratada {
  codigo_municipio int [pk]
  competencia varchar
  admissoes int
  desligamentos int
  saldos int
  estoque bigint
}

# RELACIONAMENTOS (REFS) OBRIGATÓRIOS PARA JOINS
1. "dim_municipio_score_mercado"."codigo_municipio" -> "entidade_dimensao_area_comercializacao_operadora"."codigo_municipio"
2. "dim_municipio_score_mercado"."codigo_municipio" -> "dimensao_raio_50km_municipios_viaveis"."codigo_municipio_analisado"
3. "entidade_dim_operadora"."codigo_registro_operadora" -> "entidade_dimensao_area_comercializacao_operadora"."codigo_registro_operadora"
4. "entidade_dim_operadora"."codigo_registro_operadora" -> "entidade_fato_beneficiario_por_municipio"."codigo_registro_operadora"
5. "dim_municipio_score_mercado"."codigo_municipio" -> "entidade_fato_beneficiario_por_municipio"."codigo_municipio"
6. "dim_municipio_score_mercado"."codigo_municipio" -> "entidade_fato_populacao_contratada"."codigo_municipio"

Sempre que eu solicitar um indicador, descreva a fórmula de como você o calculou baseando-se apenas nessas colunas, e em seguida, se aplicável, forneça a query SQL.