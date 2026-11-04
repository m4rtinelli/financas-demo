import { parseValor } from './format'

export type LinhaImport = {
  descricao: string
  categoria?: string
  valor: number
  dia?: number
}

function splitLinha(linha: string, sep: string) {
  const out: string[] = []
  let cur = ''
  let q = false
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i]
    if (c === '"') {
      if (q && linha[i + 1] === '"') { cur += '"'; i++ } else q = !q
    } else if (c === sep && !q) {
      out.push(cur.trim()); cur = ''
    } else cur += c
  }
  out.push(cur.trim())
  return out
}

const HEADERS: Record<keyof LinhaImport, RegExp> = {
  descricao: /descri|nome|item|gasto|despesa|conta|hist/i,
  categoria: /categ|tipo|grupo/i,
  valor: /valor|pre[cç]o|total|r\$|quantia|montante/i,
  dia: /dia|venc|data/i,
}

function diaDe(s: string | undefined) {
  if (!s) return undefined
  const m = s.match(/^(\d{1,2})(?:[/-]\d{1,2}(?:[/-]\d{2,4})?)?$/) ?? s.match(/^\d{4}-\d{2}-(\d{2})$/)
  const d = m ? Number(m[1]) : NaN
  return d >= 1 && d <= 31 ? d : undefined
}

/**
 * Lê texto colado do Excel/Sheets (TSV) ou CSV com ; ou ,.
 * Detecta cabeçalho pelo nome das colunas; sem cabeçalho, assume
 * a primeira coluna de texto como descrição e a primeira numérica como valor.
 */
export function parseTabela(texto: string): { linhas: LinhaImport[]; avisos: string[] } {
  const rows = texto.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim())
  if (!rows.length) return { linhas: [], avisos: [] }

  const first = rows[0]
  const sep = ['\t', ';', ','].map((s) => [s, first.split(s).length] as const).sort((a, b) => b[1] - a[1])[0][0]
  const tabela = rows.map((r) => splitLinha(r, sep))

  const header = tabela[0]
  const idx: Partial<Record<keyof LinhaImport, number>> = {}
  for (const key of Object.keys(HEADERS) as (keyof LinhaImport)[]) {
    const i = header.findIndex((h, j) => HEADERS[key].test(h) && !Object.values(idx).includes(j))
    if (i >= 0) idx[key] = i
  }
  const temNumero = header.some((c) => /\d/.test(c) && !Number.isNaN(parseValor(c)))
  const temHeader = !temNumero && (idx.descricao !== undefined || idx.valor !== undefined)
  if (!temHeader) for (const k of Object.keys(idx) as (keyof LinhaImport)[]) delete idx[k]
  const corpo = temHeader ? tabela.slice(1) : tabela

  if (!temHeader) {
    const amostra = corpo[0]
    idx.valor = amostra.findIndex((c) => !Number.isNaN(parseValor(c)) && /\d/.test(c) && !diaDe(c))
    if (idx.valor < 0) idx.valor = amostra.findIndex((c) => !Number.isNaN(parseValor(c)) && /\d/.test(c))
    idx.descricao = amostra.findIndex((c, i) => i !== idx.valor && Number.isNaN(parseValor(c)))
    const outroTexto = amostra.findIndex((c, i) => i !== idx.descricao && i !== idx.valor && c && Number.isNaN(parseValor(c)))
    if (outroTexto >= 0) idx.categoria = outroTexto
    const dia = amostra.findIndex((c, i) => i !== idx.valor && diaDe(c))
    if (dia >= 0) idx.dia = dia
  }

  const avisos: string[] = []
  const linhas: LinhaImport[] = []
  corpo.forEach((r, n) => {
    const descricao = idx.descricao !== undefined && idx.descricao >= 0 ? r[idx.descricao] : ''
    const valor = idx.valor !== undefined && idx.valor >= 0 ? parseValor(r[idx.valor] ?? '') : NaN
    if (!descricao && Number.isNaN(valor)) return
    if (Number.isNaN(valor)) {
      avisos.push(`Linha ${n + (temHeader ? 2 : 1)} ignorada: valor inválido`)
      return
    }
    linhas.push({
      descricao: descricao || 'Sem descrição',
      categoria: idx.categoria !== undefined ? r[idx.categoria] || undefined : undefined,
      valor: Math.abs(valor),
      dia: idx.dia !== undefined ? diaDe(r[idx.dia]) : undefined,
    })
  })
  return { linhas, avisos }
}
