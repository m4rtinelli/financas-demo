import { useEffect, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, MoonIcon, RepeatIcon, SunIcon, UploadIcon, WalletIcon } from 'lucide-react'
import { toast } from 'sonner'
import { DespesasCard, ReceitasCard } from '@/components/lancamentos'
import { FixosView } from '@/components/fixos-view'
import { ImportDialog, type Destino } from '@/components/import-dialog'
import {
  AporteDialog, AportesCard, InvestimentoDialog, InvestimentosView,
  type AporteValues, type InvestimentoValues,
} from '@/components/investimentos'
import { ItemDialog, type ItemKind, type ItemValues } from '@/components/item-dialog'
import { OrcamentoCard } from '@/components/orcamento'
import { ResumoCards } from '@/components/resumo'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Toaster } from '@/components/ui/sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DEMO } from '@/lib/api'
import type { LinhaImport } from '@/lib/csv'
import { restaurarExemplo } from '@/lib/demo-api'
import { addMes, brl, dataNoMes, mesAtual, mesLabel, uid } from '@/lib/format'
import { useFinance } from '@/lib/store'
import type { Aporte, Despesa, Fixo, Investimento, Receita } from '@/lib/types'

type DialogState = { kind: ItemKind; id?: string; inicial?: Partial<ItemValues> }
type InvDialog = { id?: string; inicial?: InvestimentoValues }
type AporteDialogState = { id?: string; inicial?: Partial<AporteValues> }

function useTema() {
  const [escuro, setEscuro] = useState(() => {
    try {
      const s = localStorage.getItem('tema')
      return s ? s === 'escuro' : matchMedia('(prefers-color-scheme: dark)').matches
    } catch { return false }
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', escuro)
    try { localStorage.setItem('tema', escuro ? 'escuro' : 'claro') } catch { /* ignore */ }
  }, [escuro])
  return [escuro, setEscuro] as const
}

export default function App() {
  const [mes, setMes] = useState(mesAtual)
  const [aba, setAba] = useState('mes')
  const [dialog, setDialog] = useState<DialogState>({ kind: 'despesa' })
  const [dialogAberto, setDialogAberto] = useState(false)
  const [importar, setImportar] = useState<Destino>('fixos')
  const [importAberto, setImportAberto] = useState(false)
  const [escuro, setEscuro] = useTema()
  const [invDialog, setInvDialog] = useState<InvDialog>({})
  const [invAberto, setInvAberto] = useState(false)
  const [apDialog, setApDialog] = useState<AporteDialogState>({})
  const [apAberto, setApAberto] = useState(false)
  const fin = useFinance(mes)
  const { dados, fixos, categorias, orcamento, investimentos, fixosPendentes } = fin
  const ativos = investimentos.filter((i) => !i.arquivado)

  const abrir = (d: DialogState) => { setDialog(d); setDialogAberto(true) }
  const abrirImport = (d: Destino) => { setImportar(d); setImportAberto(true) }
  const abrirInv = (d: InvDialog) => { setInvDialog(d); setInvAberto(true) }
  const abrirAporte = (d: AporteDialogState) => { setApDialog(d); setApAberto(true) }

  function salvarInvestimento(v: InvestimentoValues) {
    const id = invDialog.id
    fin.salvarInvestimentos((is) => {
      const atual = id ? is.find((i) => i.id === id) : undefined
      const item: Investimento = atual
        ? { ...atual, nome: v.nome, instituicao: v.instituicao, tipo: v.tipo }
        : { id: uid(), nome: v.nome, instituicao: v.instituicao, tipo: v.tipo, saldos: {} }
      if (v.saldo !== undefined) item.saldos[mes] = v.saldo
      return atual ? is.map((i) => (i.id === id ? item : i)) : [...is, item]
    })
  }

  function definirSaldo(id: string, valor: number | undefined) {
    fin.salvarInvestimentos((is) => is.map((i) => {
      if (i.id !== id) return i
      const saldos = { ...i.saldos }
      if (valor === undefined) delete saldos[mes]
      else saldos[mes] = valor
      return { ...i, saldos }
    }))
  }

  function excluirInvestimento(inv: Investimento) {
    fin.salvarInvestimentos((is) => is.filter((i) => i.id !== inv.id))
    toast(`"${inv.nome}" removido da carteira`, {
      action: { label: 'Desfazer', onClick: () => fin.salvarInvestimentos((is) => [...is, inv]) },
    })
  }

  function salvarAporte(v: AporteValues) {
    const id = apDialog.id
    fin.salvarMes((m) => {
      const i = id ? m.aportes.findIndex((a) => a.id === id) : -1
      if (i >= 0) m.aportes[i] = { ...m.aportes[i], ...v }
      else m.aportes.push({ id: uid(), ...v })
      return m
    })
  }

  function excluirAporte(a: Aporte) {
    fin.salvarMes((m) => ({ ...m, aportes: m.aportes.filter((x) => x.id !== a.id) }))
    toast('Aporte excluído', {
      action: { label: 'Desfazer', onClick: () => fin.salvarMes((m) => ({ ...m, aportes: [...m.aportes, a] })) },
    })
  }

  function salvarItem(v: ItemValues) {
    const { kind, id } = dialog
    if (kind === 'despesa') {
      const item: Despesa = {
        id: id ?? uid(), descricao: v.descricao, categoria: v.categoria, valor: v.valor,
        vencimento: v.data, pago: v.feito, obs: v.obs,
      }
      fin.salvarMes((m) => {
        const i = m.despesas.findIndex((d) => d.id === item.id)
        if (i >= 0) m.despesas[i] = { ...m.despesas[i], ...item }
        else m.despesas.push(item)
        return m
      })
    } else if (kind === 'receita') {
      const item: Receita = { id: id ?? uid(), descricao: v.descricao, valor: v.valor, data: v.data, recebido: v.feito }
      fin.salvarMes((m) => {
        const i = m.receitas.findIndex((r) => r.id === item.id)
        if (i >= 0) m.receitas[i] = { ...m.receitas[i], ...item }
        else m.receitas.push(item)
        return m
      })
    } else {
      const item: Fixo = {
        id: id ?? uid(), tipo: v.tipo, descricao: v.descricao, valor: v.valor,
        categoria: v.tipo === 'receita' ? 'Receita' : v.tipo === 'aporte' ? 'Aporte' : v.categoria,
        dia: v.dia, ativo: v.feito, ativoId: v.ativoId,
      }
      fin.salvarFixos((fs) => {
        const i = fs.findIndex((f) => f.id === item.id)
        if (i >= 0) fs[i] = item
        else fs.push(item)
        return fs
      })
    }
  }

  function excluirDespesa(d: Despesa) {
    fin.salvarMes((m) => ({ ...m, despesas: m.despesas.filter((x) => x.id !== d.id) }))
    toast(`"${d.descricao}" excluída`, {
      action: { label: 'Desfazer', onClick: () => fin.salvarMes((m) => ({ ...m, despesas: [...m.despesas, d] })) },
    })
  }

  function excluirReceita(r: Receita) {
    fin.salvarMes((m) => ({ ...m, receitas: m.receitas.filter((x) => x.id !== r.id) }))
    toast(`"${r.descricao}" excluída`, {
      action: { label: 'Desfazer', onClick: () => fin.salvarMes((m) => ({ ...m, receitas: [...m.receitas, r] })) },
    })
  }

  function excluirFixo(f: Fixo) {
    fin.salvarFixos((fs) => fs.filter((x) => x.id !== f.id))
    toast(`"${f.descricao}" removido dos fixos`, {
      action: { label: 'Desfazer', onClick: () => fin.salvarFixos((fs) => [...fs, f]) },
    })
  }

  function importarLinhas(linhas: LinhaImport[], destino: Destino) {
    const novasCats = linhas.map((l) => l.categoria).filter((c): c is string => !!c && !categorias.includes(c))
    if (novasCats.length) fin.salvarCategorias([...categorias, ...novasCats])
    if (destino === 'fixos') {
      fin.salvarFixos((fs) => [
        ...fs,
        ...linhas.map((l): Fixo => ({
          id: uid(), tipo: 'despesa', descricao: l.descricao, categoria: l.categoria ?? 'Outros',
          valor: l.valor, dia: l.dia, ativo: true,
        })),
      ])
      setAba('fixos')
    } else {
      fin.salvarMes((m) => {
        m.despesas.push(...linhas.map((l): Despesa => ({
          id: uid(), descricao: l.descricao, categoria: l.categoria ?? 'Outros', valor: l.valor,
          vencimento: dataNoMes(m.mes, l.dia), pago: false,
        })))
        return m
      })
      setAba('mes')
    }
    toast.success(`${linhas.length} itens importados`)
  }

  function lancarFixos() {
    fin.aplicarFixos(fixosPendentes)
    toast.success(`${fixosPendentes.length} fixos lançados em ${mesLabel(mes)}`)
  }

  const totalPendente = fixosPendentes.reduce((s, f) => s + (f.tipo === 'despesa' ? f.valor : 0), 0)

  return (
    <TooltipProvider>
      <div className="min-h-svh bg-muted/40">
        {DEMO && (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b bg-background px-4 py-2 text-center text-sm text-muted-foreground">
            <span>Versão de demonstração: dados fictícios, salvos só neste navegador.</span>
            <Button variant="link" size="sm" className="h-auto p-0" onClick={restaurarExemplo}>Restaurar exemplo</Button>
          </div>
        )}
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
            <div className="flex items-center gap-2 font-semibold">
              <WalletIcon className="size-5" /> Finanças
            </div>
            <div className="mx-auto flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setMes(addMes(mes, -1))} aria-label="Mês anterior">
                <ChevronLeftIcon />
              </Button>
              <span className="min-w-40 text-center font-medium">{mesLabel(mes)}</span>
              <Button variant="ghost" size="icon" onClick={() => setMes(addMes(mes, 1))} aria-label="Próximo mês">
                <ChevronRightIcon />
              </Button>
              {mes !== mesAtual() && (
                <Button variant="outline" size="sm" onClick={() => setMes(mesAtual())}>Hoje</Button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => abrirImport(aba === 'fixos' ? 'fixos' : 'mes')}>
                <UploadIcon /> Importar
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setEscuro(!escuro)} aria-label="Alternar tema">
                {escuro ? <SunIcon /> : <MoonIcon />}
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">
          <Tabs value={aba} onValueChange={(v) => setAba(String(v))} className="gap-6">
            <TabsList>
              <TabsTrigger value="mes">Mês</TabsTrigger>
              <TabsTrigger value="fixos">Fixos & orçamento</TabsTrigger>
              <TabsTrigger value="investimentos">Investimentos</TabsTrigger>
            </TabsList>

            <TabsContent value="mes" className="grid gap-6">
              {!dados ? (
                <p className="py-20 text-center text-muted-foreground">Carregando…</p>
              ) : (
                <>
                  {fixosPendentes.length > 0 && (
                    <Card className="border-dashed">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <RepeatIcon className="size-4" />
                          {dados.existe ? 'Fixos ainda não lançados' : `Começar ${mesLabel(mes)}`}
                        </CardTitle>
                        <CardDescription>
                          {fixosPendentes.length} itens dos gastos fixos ainda não estão neste mês
                          {totalPendente > 0 && ` (${brl(totalPendente)} em despesas)`}.
                        </CardDescription>
                        <CardAction><Button onClick={lancarFixos}>Lançar fixos</Button></CardAction>
                      </CardHeader>
                    </Card>
                  )}
                  {!dados.existe && fixos.length === 0 && orcamento.length === 0 && (
                    <Card className="border-dashed">
                      <CardHeader>
                        <CardTitle>Comece pelos gastos fixos</CardTitle>
                        <CardDescription>
                          Importe sua planilha mensal para criar o modelo de gastos que se repetem todo mês.
                        </CardDescription>
                        <CardAction>
                          <Button onClick={() => abrirImport('fixos')}><UploadIcon /> Importar planilha</Button>
                        </CardAction>
                      </CardHeader>
                    </Card>
                  )}

                  <ResumoCards dados={dados} planejado={orcamento.reduce((s, o) => s + o.valor, 0)} />

                  <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
                    <DespesasCard
                      despesas={dados.despesas}
                      onToggle={(id, pago) => fin.salvarMes((m) => {
                        const d = m.despesas.find((x) => x.id === id)
                        if (d) d.pago = pago
                        return m
                      })}
                      onAdd={() => abrir({ kind: 'despesa' })}
                      onEdit={(d) => abrir({
                        kind: 'despesa', id: d.id,
                        inicial: { descricao: d.descricao, valor: d.valor, categoria: d.categoria, data: d.vencimento, feito: d.pago, obs: d.obs },
                      })}
                      onDelete={excluirDespesa}
                    />
                    <div className="grid gap-6">
                      <ReceitasCard
                        receitas={dados.receitas}
                        onToggle={(id, recebido) => fin.salvarMes((m) => {
                          const r = m.receitas.find((x) => x.id === id)
                          if (r) r.recebido = recebido
                          return m
                        })}
                        onAdd={() => abrir({ kind: 'receita' })}
                        onEdit={(r) => abrir({
                          kind: 'receita', id: r.id,
                          inicial: { descricao: r.descricao, valor: r.valor, data: r.data, feito: r.recebido },
                        })}
                        onDelete={excluirReceita}
                      />
                      <AportesCard
                        aportes={dados.aportes}
                        investimentos={investimentos}
                        onToggle={(id, feito) => fin.salvarMes((m) => {
                          const a = m.aportes.find((x) => x.id === id)
                          if (a) a.feito = feito
                          return m
                        })}
                        onAdd={() => abrirAporte({})}
                        onEdit={(a) => abrirAporte({
                          id: a.id,
                          inicial: { investimentoId: a.investimentoId, tipo: a.tipo, valor: a.valor, data: a.data, feito: a.feito },
                        })}
                        onDelete={excluirAporte}
                      />
                      <OrcamentoCard dados={dados} orcamento={orcamento} />
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="investimentos">
              <InvestimentosView
                mes={mes}
                investimentos={investimentos}
                aportes={dados?.aportes ?? []}
                onAddInvestimento={() => abrirInv({})}
                onEditInvestimento={(i) => abrirInv({
                  id: i.id,
                  inicial: { nome: i.nome, instituicao: i.instituicao, tipo: i.tipo, saldo: i.saldos[mes] },
                })}
                onDeleteInvestimento={excluirInvestimento}
                onSaldo={definirSaldo}
                onAddAporte={(investimentoId) => abrirAporte({ inicial: investimentoId ? { investimentoId } : undefined })}
              />
            </TabsContent>

            <TabsContent value="fixos">
              <FixosView
                fixos={fixos}
                categorias={categorias}
                orcamento={orcamento}
                onOrcamento={fin.salvarOrcamento}
                onAdd={() => abrir({ kind: 'fixo', inicial: { feito: true } })}
                onEdit={(f) => abrir({
                  kind: 'fixo', id: f.id,
                  inicial: { descricao: f.descricao, valor: f.valor, categoria: f.categoria, dia: f.dia, feito: f.ativo, tipo: f.tipo, ativoId: f.ativoId },
                })}
                onDelete={excluirFixo}
                onToggle={(id, ativo) => fin.salvarFixos((fs) => fs.map((f) => (f.id === id ? { ...f, ativo } : f)))}
                onImport={() => abrirImport('fixos')}
                onCategorias={fin.salvarCategorias}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <ItemDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        kind={dialog.kind}
        inicial={dialog.inicial}
        categorias={categorias}
        investimentos={ativos}
        mes={mes}
        onSave={salvarItem}
      />
      <InvestimentoDialog
        open={invAberto}
        onOpenChange={setInvAberto}
        inicial={invDialog.inicial}
        mes={mes}
        onSave={salvarInvestimento}
      />
      <AporteDialog
        open={apAberto}
        onOpenChange={setApAberto}
        inicial={apDialog.inicial}
        investimentos={ativos}
        mes={mes}
        onSave={salvarAporte}
      />
      <ImportDialog
        open={importAberto}
        onOpenChange={setImportAberto}
        mes={mes}
        destinoInicial={importar}
        onImport={importarLinhas}
      />
      <Toaster richColors position="bottom-right" />
    </TooltipProvider>
  )
}
