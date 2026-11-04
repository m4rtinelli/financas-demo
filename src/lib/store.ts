import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { api, lastLocalWrite } from './api'
import { dataNoMes, uid } from './format'
import type { Fixo, Investimento, Mes, Orcamento } from './types'

export function useFinance(mes: string) {
  const [dados, setDados] = useState<Mes | null>(null)
  const [fixos, setFixos] = useState<Fixo[]>([])
  const [categorias, setCategorias] = useState<string[]>([])
  const [orcamento, setOrcamento] = useState<Orcamento[]>([])
  const [investimentos, setInvestimentos] = useState<Investimento[]>([])
  const [meses, setMeses] = useState<string[]>([])
  const mesRef = useRef(mes)
  mesRef.current = mes

  const carregar = useCallback(async () => {
    const m = mesRef.current
    const [d, f, c, o, ms, inv] = await Promise.all([
      api.getMes(m), api.getFixos(), api.getCategorias(), api.getOrcamento(), api.listMeses(), api.getInvestimentos(),
    ])
    if (mesRef.current !== m) return
    setDados({ ...d, aportes: d.aportes ?? [] })
    setInvestimentos(inv)
    setFixos(f)
    setCategorias(c)
    setOrcamento(o)
    setMeses(ms)
  }, [])

  useEffect(() => {
    setDados(null)
    carregar().catch((e) => toast.error(`Erro ao carregar: ${e.message}`))
  }, [mes, carregar])

  // Recarrega quando os JSON em data/ forem editados fora do app
  useEffect(() => {
    if (!import.meta.hot) return
    const onChange = (p: { file: string }) => {
      if (Date.now() - lastLocalWrite < 1500) return
      carregar().then(() => toast.info(`Dados atualizados (${p.file})`))
    }
    import.meta.hot.on('data-changed', onChange)
    return () => import.meta.hot?.off('data-changed', onChange)
  }, [carregar])

  const dadosRef = useRef(dados)
  dadosRef.current = dados
  const fixosRef = useRef(fixos)
  fixosRef.current = fixos
  const invRef = useRef(investimentos)
  invRef.current = investimentos

  const salvarMes = useCallback((fn: (m: Mes) => Mes) => {
    const atual = dadosRef.current
    if (!atual) return
    const novo = { ...fn(structuredClone(atual)), existe: true }
    dadosRef.current = novo
    setDados(novo)
    api.saveMes(novo)
      .then(() => setMeses((ms) => (ms.includes(novo.mes) ? ms : [...ms, novo.mes].sort())))
      .catch((e) => toast.error(`Erro ao salvar: ${e.message}`))
  }, [])

  const salvarFixos = useCallback((fn: (f: Fixo[]) => Fixo[]) => {
    const novo = fn(structuredClone(fixosRef.current))
    fixosRef.current = novo
    setFixos(novo)
    api.saveFixos(novo).catch((e) => toast.error(`Erro ao salvar: ${e.message}`))
  }, [])

  const salvarInvestimentos = useCallback((fn: (i: Investimento[]) => Investimento[]) => {
    const novo = fn(structuredClone(invRef.current))
    invRef.current = novo
    setInvestimentos(novo)
    api.saveInvestimentos(novo).catch((e) => toast.error(`Erro ao salvar: ${e.message}`))
  }, [])

  const salvarCategorias = useCallback((novas: string[]) => {
    const unicas = [...new Set(novas.map((c) => c.trim()).filter(Boolean))]
    setCategorias(unicas)
    api.saveCategorias(unicas).catch((e) => toast.error(`Erro ao salvar: ${e.message}`))
  }, [])

  const salvarOrcamento = useCallback((novo: Orcamento[]) => {
    setOrcamento(novo)
    api.saveOrcamento(novo).catch((e) => toast.error(`Erro ao salvar: ${e.message}`))
  }, [])

  /** Fixos ativos que ainda não foram lançados no mês aberto. */
  const fixosPendentes = dados
    ? fixos.filter((f) => f.ativo && !(f.tipo === 'despesa' ? dados.despesas : f.tipo === 'receita' ? dados.receitas : dados.aportes)
      .some((x) => x.fixoId === f.id))
    : []

  const aplicarFixos = useCallback((lista: Fixo[]) => {
    salvarMes((m) => {
      for (const f of lista) {
        if (f.tipo === 'despesa') {
          m.despesas.push({
            id: uid(), descricao: f.descricao, categoria: f.categoria, valor: f.valor,
            vencimento: dataNoMes(m.mes, f.dia), pago: false, fixoId: f.id,
          })
        } else if (f.tipo === 'aporte') {
          if (!f.ativoId) continue
          m.aportes.push({
            id: uid(), investimentoId: f.ativoId, tipo: 'aporte', valor: f.valor,
            data: dataNoMes(m.mes, f.dia), feito: false, fixoId: f.id,
          })
        } else {
          m.receitas.push({
            id: uid(), descricao: f.descricao, valor: f.valor,
            data: dataNoMes(m.mes, f.dia), recebido: false, fixoId: f.id,
          })
        }
      }
      return m
    })
  }, [salvarMes])

  return { dados, fixos, categorias, orcamento, investimentos, salvarInvestimentos, meses, salvarOrcamento, salvarMes, salvarFixos, salvarCategorias, fixosPendentes, aplicarFixos }
}
