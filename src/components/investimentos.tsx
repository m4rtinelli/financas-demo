import { useEffect, useState } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ArrowDownLeftIcon, ArrowUpRightIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, RepeatIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { brl, diaMes, mesLabel, parseValor } from '@/lib/format'
import { evolucao, posicoesDoMes } from '@/lib/investimentos'
import { TIPOS_INVESTIMENTO, type Aporte, type Investimento } from '@/lib/types'
import { cn } from '@/lib/utils'

const pct = (n: number) => `${n >= 0 ? '+' : ''}${(n * 100).toFixed(2).replace('.', ',')}%`
const mesCurto = (m: string) => {
  const [y, mm] = m.split('-').map(Number)
  return new Date(y, mm - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('. de ', '/').replace('.', '')
}

// ---------- Diálogos ----------

export type InvestimentoValues = { nome: string; instituicao?: string; tipo: string; saldo?: number }

export function InvestimentoDialog({
  open, onOpenChange, inicial, mes, onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  inicial?: InvestimentoValues
  mes: string
  onSave: (v: InvestimentoValues) => void
}) {
  const [nome, setNome] = useState('')
  const [instituicao, setInstituicao] = useState('')
  const [tipo, setTipo] = useState<string>('Renda fixa')
  const [saldo, setSaldo] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!open) return
    setNome(inicial?.nome ?? '')
    setInstituicao(inicial?.instituicao ?? '')
    setTipo(inicial?.tipo ?? 'Renda fixa')
    setSaldo(inicial?.saldo !== undefined ? String(inicial.saldo).replace('.', ',') : '')
    setErro('')
  }, [open, inicial])

  function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return setErro('Informe o nome.')
    const s = saldo.trim() ? parseValor(saldo) : undefined
    if (s !== undefined && (Number.isNaN(s) || s < 0)) return setErro('Saldo inválido.')
    onSave({ nome: nome.trim(), instituicao: instituicao.trim() || undefined, tipo, saldo: s })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={salvar} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{inicial ? 'Editar posição' : 'Nova posição'}</DialogTitle>
            <DialogDescription>Um ativo (CDB, PETR4, Tesouro IPCA…) ou uma conta inteira (XP, Nubank…).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="inv-nome">Nome</Label>
            <Input id="inv-nome" autoFocus value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: CDB XP 110% CDI" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="inv-inst">Instituição</Label>
              <Input id="inv-inst" value={instituicao} onChange={(e) => setInstituicao(e.target.value)} placeholder="XP" />
            </div>
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(String(v))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_INVESTIMENTO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="inv-saldo">Saldo em {mesLabel(mes).toLowerCase()} (R$)</Label>
            <Input id="inv-saldo" inputMode="decimal" value={saldo} onChange={(e) => setSaldo(e.target.value)} placeholder="Opcional" />
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type AporteValues = Omit<Aporte, 'id' | 'fixoId'>

export function AporteDialog({
  open, onOpenChange, inicial, investimentos, mes, onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  inicial?: Partial<AporteValues>
  investimentos: Investimento[]
  mes: string
  onSave: (v: AporteValues) => void
}) {
  const [investimentoId, setInvestimentoId] = useState('')
  const [tipo, setTipo] = useState<'aporte' | 'resgate'>('aporte')
  const [valor, setValor] = useState('')
  const [data, setData] = useState('')
  const [feito, setFeito] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!open) return
    setInvestimentoId(inicial?.investimentoId ?? investimentos[0]?.id ?? '')
    setTipo(inicial?.tipo ?? 'aporte')
    setValor(inicial?.valor !== undefined ? String(inicial.valor).replace('.', ',') : '')
    setData(inicial?.data ?? '')
    setFeito(inicial?.feito ?? true)
    setErro('')
  }, [open, inicial, investimentos])

  function salvar(e: React.FormEvent) {
    e.preventDefault()
    const v = parseValor(valor)
    if (!investimentoId) return setErro('Cadastre uma posição na aba Investimentos primeiro.')
    if (Number.isNaN(v) || v <= 0) return setErro('Valor inválido.')
    onSave({ investimentoId, tipo, valor: v, data: data || undefined, feito })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={salvar} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{inicial?.valor !== undefined ? 'Editar movimentação' : 'Novo aporte'}</DialogTitle>
            <DialogDescription>Dinheiro que sai do caixa para um investimento, ou volta dele.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>Investimento</Label>
            <Select
              value={investimentoId}
              onValueChange={(v) => setInvestimentoId(String(v))}
              items={Object.fromEntries(investimentos.map((i) => [i.id, i.nome]))}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="Nenhuma posição cadastrada" /></SelectTrigger>
              <SelectContent>
                {investimentos.map((i) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select
                value={tipo}
                onValueChange={(v) => setTipo(v as 'aporte' | 'resgate')}
                items={{ aporte: 'Aporte', resgate: 'Resgate' }}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aporte">Aporte</SelectItem>
                  <SelectItem value="resgate">Resgate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ap-valor">Valor (R$)</Label>
              <Input id="ap-valor" autoFocus inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ap-data">Data</Label>
            <Input id="ap-data" type="date" value={data} onChange={(e) => setData(e.target.value)} min={`${mes}-01`} max={`${mes}-31`} />
          </div>
          <Label className="flex items-center gap-2 font-normal">
            <Checkbox checked={feito} onCheckedChange={(c) => setFeito(Boolean(c))} />
            Já foi feito
          </Label>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Card de aportes (aba Mês) ----------

export function AportesCard({
  aportes, investimentos, onToggle, onAdd, onEdit, onDelete,
}: {
  aportes: Aporte[]
  investimentos: Investimento[]
  onToggle: (id: string, feito: boolean) => void
  onAdd: () => void
  onEdit: (a: Aporte) => void
  onDelete: (a: Aporte) => void
}) {
  const nome = (id: string) => investimentos.find((i) => i.id === id)?.nome ?? '(removido)'
  const lista = [...aportes].sort((a, b) => (a.data ?? '9').localeCompare(b.data ?? '9'))
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aportes</CardTitle>
        <CardDescription>Dinheiro guardado neste mês</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline" onClick={onAdd}><PlusIcon /> Aporte</Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {lista.length === 0 && (
              <TableRow>
                <TableCell className="py-6 text-center text-muted-foreground">Nenhum aporte.</TableCell>
              </TableRow>
            )}
            {lista.map((a) => (
              <TableRow key={a.id} className={cn(!a.feito && 'text-muted-foreground')}>
                <TableCell className="w-10">
                  <Checkbox checked={a.feito} onCheckedChange={(c) => onToggle(a.id, Boolean(c))} aria-label="Feito" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {a.tipo === 'resgate'
                      ? <ArrowDownLeftIcon className="size-3.5 text-amber-600" />
                      : <ArrowUpRightIcon className="size-3.5 text-sky-600 dark:text-sky-400" />}
                    <span className="font-medium">{nome(a.investimentoId)}</span>
                    {a.fixoId && (
                      <Tooltip>
                        <TooltipTrigger render={<span className="inline-flex text-muted-foreground" />}>
                          <RepeatIcon className="size-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>Aporte fixo</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{a.tipo === 'resgate' ? 'Resgate · ' : ''}{diaMes(a.data)}</div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{a.tipo === 'resgate' ? '−' : ''}{brl(a.valor)}</TableCell>
                <TableCell className="w-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Ações" />}>
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(a)}><PencilIcon /> Editar</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => onDelete(a)}><Trash2Icon /> Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// ---------- Aba Investimentos ----------

/** Campo de saldo do mês: vazio = ainda não informado (usa estimativa). */
function SaldoInput({ valor, estimativa, onChange }: {
  valor?: number
  estimativa: number
  onChange: (v: number | undefined) => void
}) {
  const fmt = (n?: number) => (n === undefined ? '' : String(n).replace('.', ','))
  const [texto, setTexto] = useState(fmt(valor))
  useEffect(() => setTexto(fmt(valor)), [valor])
  return (
    <Input
      inputMode="decimal"
      className="ml-auto h-7 w-32 text-right tabular-nums placeholder:italic"
      placeholder={brl(estimativa)}
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={() => {
        const v = texto.trim() ? parseValor(texto) : undefined
        if (v !== undefined && (Number.isNaN(v) || v < 0)) return setTexto(fmt(valor))
        if (v !== valor) onChange(v)
      }}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  )
}

const chartConfig = { total: { label: 'Patrimônio', color: 'var(--chart-1)' } } satisfies ChartConfig

export function InvestimentosView({
  mes, investimentos, aportes, onAddInvestimento, onEditInvestimento, onDeleteInvestimento, onSaldo, onAddAporte,
}: {
  mes: string
  investimentos: Investimento[]
  aportes: Aporte[]
  onAddInvestimento: () => void
  onEditInvestimento: (i: Investimento) => void
  onDeleteInvestimento: (i: Investimento) => void
  onSaldo: (id: string, valor: number | undefined) => void
  onAddAporte: (investimentoId?: string) => void
}) {
  const posicoes = posicoesDoMes(investimentos, aportes, mes)
  const total = posicoes.reduce((s, p) => s + p.saldo, 0)
  const aportesMes = posicoes.reduce((s, p) => s + p.aportes, 0)
  const comRend = posicoes.filter((p) => p.rendimento !== undefined)
  const rendimento = comRend.reduce((s, p) => s + p.rendimento!, 0)
  const baseRend = comRend.reduce((s, p) => s + p.anterior! + Math.max(0, p.aportes), 0)
  const pendentes = posicoes.filter((p) => p.estimado).length

  const porTipo = new Map<string, number>()
  for (const p of posicoes) porTipo.set(p.inv.tipo, (porTipo.get(p.inv.tipo) ?? 0) + p.saldo)
  const alocacao = [...porTipo].map(([tipo, v]) => ({ tipo, v })).filter((a) => a.v > 0).sort((a, b) => b.v - a.v)

  const serie = evolucao(investimentos, mes).map((p) => ({ ...p, label: mesCurto(p.mes) }))
  const ordenadas = [...posicoes].sort((a, b) => b.saldo - a.saldo)

  if (investimentos.filter((i) => !i.arquivado).length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Monte sua carteira</CardTitle>
          <CardDescription>
            Cadastre cada posição (um ativo ou uma conta inteira) com o saldo atual.
            Todo mês, atualize os saldos aqui e lance os aportes na aba Mês — o rendimento sai calculado.
          </CardDescription>
          <CardAction><Button onClick={onAddInvestimento}><PlusIcon /> Posição</Button></CardAction>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Patrimônio investido</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{brl(total)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {pendentes ? `${pendentes} saldo(s) ainda estimado(s)` : 'Todos os saldos informados'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Aportes no mês</CardDescription>
            <CardTitle className="text-2xl tabular-nums text-sky-600 dark:text-sky-400">{brl(aportesMes)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Líquido de resgates, só os já feitos</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Rendimento no mês</CardDescription>
            <CardTitle className={cn('text-2xl tabular-nums', comRend.length && (rendimento >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'))}>
              {comRend.length ? brl(rendimento) : '—'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {comRend.length && baseRend ? `${pct(rendimento / baseRend)} sobre ${comRend.length} posição(ões)` : 'Informe os saldos de dois meses seguidos'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Posições</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{posicoes.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">{alocacao.length} tipo(s) de investimento</CardContent>
        </Card>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader>
            <CardTitle>Carteira</CardTitle>
            <CardDescription>Digite o saldo de fim de mês de cada posição. Em branco = estimado (anterior + aportes).</CardDescription>
            <CardAction className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onAddAporte()}><ArrowUpRightIcon /> Aporte</Button>
              <Button size="sm" onClick={onAddInvestimento}><PlusIcon /> Posição</Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posição</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Mês anterior</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Aportes</TableHead>
                  <TableHead className="text-right">Saldo em {mesCurto(mes)}</TableHead>
                  <TableHead className="text-right">Rendimento</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordenadas.map((p) => (
                  <TableRow key={p.inv.id}>
                    <TableCell>
                      <div className="font-medium">{p.inv.nome}</div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{p.inv.tipo}</Badge>
                        {p.inv.instituicao}
                        {total > 0 && <span>· {((p.saldo / total) * 100).toFixed(0)}%</span>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums text-muted-foreground md:table-cell">
                      {p.anterior !== undefined ? brl(p.anterior) : '—'}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      {p.aportes ? brl(p.aportes) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <SaldoInput valor={p.informado} estimativa={p.saldo} onChange={(v) => onSaldo(p.inv.id, v)} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.rendimento === undefined ? <span className="text-muted-foreground">—</span> : (
                        <div className={p.rendimento >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}>
                          {brl(p.rendimento)}
                          {p.anterior ? <div className="text-xs opacity-80">{pct(p.rendimento / (p.anterior + Math.max(0, p.aportes)))}</div> : null}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Ações" />}>
                          <MoreHorizontalIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onAddAporte(p.inv.id)}><ArrowUpRightIcon /> Aportar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditInvestimento(p.inv)}><PencilIcon /> Editar</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => onDeleteInvestimento(p.inv)}><Trash2Icon /> Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>Total</TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    {brl(posicoes.reduce((s, p) => s + (p.anterior ?? 0), 0))}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{brl(aportesMes)}</TableCell>
                  <TableCell className="text-right tabular-nums">{brl(total)}</TableCell>
                  <TableCell className="text-right tabular-nums">{comRend.length ? brl(rendimento) : '—'}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Alocação</CardTitle>
              <CardDescription>Por tipo de investimento</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {alocacao.map((a) => (
                <div key={a.tipo} className="grid gap-1">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span>{a.tipo}</span>
                    <span className="tabular-nums text-muted-foreground">
                      <span className="text-foreground">{brl(a.v)}</span> · {((a.v / total) * 100).toFixed(1).replace('.', ',')}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-[var(--chart-1)]" style={{ width: `${(a.v / total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {serie.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Evolução</CardTitle>
                <CardDescription>Patrimônio no fim de cada mês</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-44 w-full">
                  <AreaChart data={serie} margin={{ left: 0, right: 8, top: 8 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis hide domain={['dataMin * 0.95', 'dataMax * 1.02']} />
                    <ChartTooltip content={<ChartTooltipContent formatter={(v) => brl(Number(v))} />} />
                    <Area dataKey="total" type="monotone" fill="var(--color-total)" fillOpacity={0.2} stroke="var(--color-total)" strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                {serie.length} meses · de {brl(serie[0].total)} para {brl(serie.at(-1)!.total)}
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
