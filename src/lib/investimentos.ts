import { addMes } from './format'
import type { Aporte, Investimento } from './types'

/** Último saldo informado em um mês anterior a `mes`. */
export function saldoAnterior(inv: Investimento, mes: string): number | undefined {
  const anteriores = Object.keys(inv.saldos).filter((m) => m < mes).sort()
  const ultimo = anteriores.at(-1)
  return ultimo ? inv.saldos[ultimo] : undefined
}

/** Aportes − resgates confirmados de uma posição no mês. */
export function aporteLiquido(aportes: Aporte[], investimentoId: string) {
  return aportes
    .filter((a) => a.investimentoId === investimentoId && a.feito)
    .reduce((s, a) => s + (a.tipo === 'resgate' ? -a.valor : a.valor), 0)
}

export type PosicaoMes = {
  inv: Investimento
  anterior?: number
  aportes: number
  /** saldo informado neste mês */
  informado?: number
  /** saldo usado nos totais: informado, ou anterior + aportes quando ainda não informado */
  saldo: number
  estimado: boolean
  /** só existe quando há saldo anterior e saldo informado neste mês */
  rendimento?: number
}

export function posicoesDoMes(investimentos: Investimento[], aportes: Aporte[], mes: string): PosicaoMes[] {
  return investimentos
    .filter((inv) => !inv.arquivado)
    .map((inv) => {
      const anterior = saldoAnterior(inv, mes)
      const ap = aporteLiquido(aportes, inv.id)
      const informado = inv.saldos[mes]
      const saldo = informado ?? (anterior ?? 0) + ap
      return {
        inv, anterior, aportes: ap, informado, saldo,
        estimado: informado === undefined,
        rendimento: informado !== undefined && anterior !== undefined ? informado - anterior - ap : undefined,
      }
    })
}

/** Patrimônio total em cada mês, do primeiro saldo informado até `ate`. */
export function evolucao(investimentos: Investimento[], ate: string) {
  const todos = investimentos.flatMap((i) => Object.keys(i.saldos)).sort()
  if (!todos.length) return []
  const out: { mes: string; total: number }[] = []
  for (let m = todos[0]; m <= ate; m = addMes(m, 1)) {
    const total = investimentos.reduce((s, inv) => {
      const v = inv.saldos[m] ?? saldoAnterior(inv, m)
      return s + (v ?? 0)
    }, 0)
    out.push({ mes: m, total })
  }
  return out
}
