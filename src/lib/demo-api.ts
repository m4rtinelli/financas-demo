import type { Fixo, Investimento, Mes, Orcamento } from './types'

/**
 * Backend da versão de demonstração (site estático, sem servidor).
 * Tudo aqui é fictício e fica salvo só no navegador de quem está testando.
 */
type Estado = {
  categorias: string[]
  fixos: Fixo[]
  orcamento: Orcamento[]
  investimentos: Investimento[]
  meses: Record<string, Mes>
}

const CHAVE = 'financas-demo:v1'

function mesRelativo(delta: number) {
  const hoje = new Date()
  const d = new Date(hoje.getFullYear(), hoje.getMonth() + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function exemplo(): Estado {
  const anterior = mesRelativo(-1)
  const atual = mesRelativo(0)

  const fixos: Fixo[] = [
    { id: 'd0000001', tipo: 'receita', descricao: 'Salário (exemplo)', categoria: '', valor: 6500, dia: 5, ativo: true },
    { id: 'd0000002', tipo: 'despesa', descricao: 'Aluguel', categoria: 'Moradia', valor: 1600, dia: 10, ativo: true },
    { id: 'd0000003', tipo: 'despesa', descricao: 'Internet', categoria: 'Contas', valor: 120, dia: 12, ativo: true },
    { id: 'd0000004', tipo: 'despesa', descricao: 'Luz', categoria: 'Contas', valor: 180, dia: 15, ativo: true },
    { id: 'd0000005', tipo: 'despesa', descricao: 'Academia', categoria: 'Saúde', valor: 110, dia: 8, ativo: true },
    { id: 'd0000006', tipo: 'despesa', descricao: 'Streaming', categoria: 'Assinaturas', valor: 55, dia: 20, ativo: true },
    { id: 'd0000007', tipo: 'aporte', descricao: 'Aporte mensal', categoria: '', valor: 500, dia: 6, ativo: true, ativoId: 'e0000001' },
  ]

  const mes = (m: string, extras: Mes['despesas']): Mes => ({
    mes: m,
    receitas: [
      { id: `${m === atual ? 'a' : 'b'}0000001`, descricao: 'Salário (exemplo)', valor: 6500, data: `${m}-05`, recebido: true, fixoId: 'd0000001' },
    ],
    despesas: [
      { id: `${m === atual ? 'a' : 'b'}0000002`, descricao: 'Aluguel', categoria: 'Moradia', valor: 1600, vencimento: `${m}-10`, pago: m !== atual, fixoId: 'd0000002' },
      { id: `${m === atual ? 'a' : 'b'}0000003`, descricao: 'Internet', categoria: 'Contas', valor: 120, vencimento: `${m}-12`, pago: m !== atual, fixoId: 'd0000003' },
      ...extras,
    ],
    aportes: [
      { id: `${m === atual ? 'a' : 'b'}0000004`, investimentoId: 'e0000001', tipo: 'aporte', valor: 500, data: `${m}-06`, feito: true, fixoId: 'd0000007' },
    ],
  })

  return {
    categorias: ['Moradia', 'Contas', 'Alimentação', 'Mercado', 'Transporte', 'Saúde', 'Lazer', 'Assinaturas', 'Outros'],
    fixos,
    orcamento: [
      { categoria: 'Moradia', valor: 1600 },
      { categoria: 'Contas', valor: 350 },
      { categoria: 'Mercado', valor: 800 },
      { categoria: 'Alimentação', valor: 400 },
      { categoria: 'Transporte', valor: 300 },
      { categoria: 'Lazer', valor: 300 },
    ],
    investimentos: [
      { id: 'e0000001', nome: 'Tesouro Selic (exemplo)', instituicao: 'Corretora Exemplo', tipo: 'Tesouro', saldos: { [anterior]: 8000, [atual]: 8590 } },
      { id: 'e0000002', nome: 'CDB Exemplo', instituicao: 'Banco Exemplo', tipo: 'Renda fixa', saldos: { [anterior]: 5000, [atual]: 5055 } },
      { id: 'e0000003', nome: 'Ação Exemplo', instituicao: 'Corretora Exemplo', tipo: 'Ações', saldos: { [anterior]: 3000, [atual]: 2880 } },
      { id: 'e0000004', nome: 'Fundo Imobiliário Exemplo', instituicao: 'Corretora Exemplo', tipo: 'FIIs', saldos: { [anterior]: 1500 } },
    ],
    meses: {
      [anterior]: mes(anterior, [
        { id: 'b0000005', descricao: 'Supermercado', categoria: 'Mercado', valor: 640.3, vencimento: `${anterior}-14`, pago: true },
        { id: 'b0000006', descricao: 'Restaurante', categoria: 'Alimentação', valor: 96.5, vencimento: `${anterior}-21`, pago: true },
      ]),
      [atual]: mes(atual, [
        { id: 'a0000005', descricao: 'Supermercado', categoria: 'Mercado', valor: 312.45, vencimento: `${atual}-03`, pago: true },
        { id: 'a0000006', descricao: 'Combustível', categoria: 'Transporte', valor: 180, vencimento: `${atual}-04`, pago: true },
      ]),
    },
  }
}

function carregar(): Estado {
  try {
    const salvo = localStorage.getItem(CHAVE)
    if (salvo) return JSON.parse(salvo) as Estado
  } catch { /* sem armazenamento: segue só em memória */ }
  return exemplo()
}

const estado = carregar()

function persistir() {
  try { localStorage.setItem(CHAVE, JSON.stringify(estado)) } catch { /* segue só em memória */ }
  return Promise.resolve({ ok: true as const })
}

const ler = <T,>(valor: T) => Promise.resolve(structuredClone(valor))

/** Apaga o que foi editado neste navegador e volta ao exemplo. */
export function restaurarExemplo() {
  try { localStorage.removeItem(CHAVE) } catch { /* ignore */ }
  location.reload()
}

export const demoApi = {
  getMes: (mes: string) => {
    const salvo = estado.meses[mes]
    return ler<Mes>(salvo ? { ...salvo, existe: true } : { mes, receitas: [], despesas: [], aportes: [], existe: false })
  },
  saveMes: (m: Mes) => {
    const { existe: _existe, ...resto } = structuredClone(m)
    estado.meses[m.mes] = resto
    return persistir()
  },
  listMeses: () => ler(Object.keys(estado.meses).sort()),
  getFixos: () => ler(estado.fixos),
  saveFixos: (f: Fixo[]) => { estado.fixos = structuredClone(f); return persistir() },
  getOrcamento: () => ler(estado.orcamento),
  saveOrcamento: (o: Orcamento[]) => { estado.orcamento = structuredClone(o); return persistir() },
  getInvestimentos: () => ler(estado.investimentos),
  saveInvestimentos: (i: Investimento[]) => { estado.investimentos = structuredClone(i); return persistir() },
  getCategorias: () => ler(estado.categorias),
  saveCategorias: (c: string[]) => { estado.categorias = structuredClone(c); return persistir() },
}
