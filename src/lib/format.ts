const brlFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export const brl = (n: number) => brlFmt.format(n || 0)

export const uid = () => crypto.randomUUID().slice(0, 8)

export function mesAtual() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function addMes(mes: string, delta: number) {
  const [y, m] = mes.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function mesLabel(mes: string) {
  const [y, m] = mes.split('-').map(Number)
  const s = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function diasNoMes(mes: string) {
  const [y, m] = mes.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

/** Data YYYY-MM-DD para o dia informado dentro do mês (limitado ao último dia). */
export function dataNoMes(mes: string, dia?: number) {
  if (!dia) return undefined
  const d = Math.min(Math.max(1, Math.round(dia)), diasNoMes(mes))
  return `${mes}-${String(d).padStart(2, '0')}`
}

export function diaMes(iso?: string) {
  if (!iso) return '—'
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export function hojeIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Aceita "1.234,56", "1234,56", "1234.56", "R$ 99,90", "-50". */
export function parseValor(input: string | number): number {
  if (typeof input === 'number') return input
  let s = input.replace(/[^\d,.-]/g, '')
  if (!s) return NaN
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  else if ((s.match(/\./g) ?? []).length > 1) s = s.replace(/\./g, '')
  else if (/^\-?\d{1,3}\.\d{3}$/.test(s)) s = s.replace('.', '')
  return Number(s)
}
