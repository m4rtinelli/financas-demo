export type Despesa = {
  id: string
  descricao: string
  categoria: string
  valor: number
  /** YYYY-MM-DD */
  vencimento?: string
  pago: boolean
  /** id do gasto fixo que originou esta despesa */
  fixoId?: string
  obs?: string
}

export type Receita = {
  id: string
  descricao: string
  valor: number
  /** YYYY-MM-DD */
  data?: string
  recebido: boolean
  fixoId?: string
}

export type Fixo = {
  id: string
  tipo: 'despesa' | 'receita' | 'aporte'
  descricao: string
  categoria: string
  valor: number
  /** dia do mês de vencimento/recebimento */
  dia?: number
  ativo: boolean
  /** para tipo 'aporte': posição de destino */
  ativoId?: string
}

/** Valor planejado por mês para uma categoria de despesa. */
export type Orcamento = {
  categoria: string
  valor: number
}

export const TIPOS_INVESTIMENTO = [
  'Renda fixa', 'Tesouro', 'Ações', 'FIIs', 'Fundos', 'Previdência', 'Cripto', 'Exterior', 'Reserva', 'Outros',
] as const

/** Uma posição da carteira (pode ser um ativo ou uma conta inteira). */
export type Investimento = {
  id: string
  nome: string
  instituicao?: string
  tipo: string
  /** saldo informado no fim de cada mês: { "AAAA-MM": valor } */
  saldos: Record<string, number>
  arquivado?: boolean
}

/** Dinheiro que saiu do caixa para um investimento (ou voltou, no resgate). */
export type Aporte = {
  id: string
  investimentoId: string
  tipo: 'aporte' | 'resgate'
  valor: number
  /** YYYY-MM-DD */
  data?: string
  feito: boolean
  fixoId?: string
}

export type Mes = {
  mes: string
  receitas: Receita[]
  despesas: Despesa[]
  aportes: Aporte[]
  existe?: boolean
}
