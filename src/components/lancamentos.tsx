import { useMemo, useState } from 'react'
import { MoreHorizontalIcon, PencilIcon, PlusIcon, RepeatIcon, SearchIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { brl, diaMes, hojeIso } from '@/lib/format'
import type { Despesa, Receita } from '@/lib/types'
import { cn } from '@/lib/utils'

function AcoesMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Ações" />}>
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}><PencilIcon /> Editar</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}><Trash2Icon /> Excluir</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function FixoBadge() {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex text-muted-foreground" />}>
        <RepeatIcon className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent>Veio dos gastos fixos</TooltipContent>
    </Tooltip>
  )
}

const ordenar = <T extends { descricao: string }>(xs: T[], data: (x: T) => string | undefined) =>
  [...xs].sort((a, b) => (data(a) ?? '9999').localeCompare(data(b) ?? '9999') || a.descricao.localeCompare(b.descricao))

export function DespesasCard({
  despesas, onToggle, onAdd, onEdit, onDelete,
}: {
  despesas: Despesa[]
  onToggle: (id: string, pago: boolean) => void
  onAdd: () => void
  onEdit: (d: Despesa) => void
  onDelete: (d: Despesa) => void
}) {
  const [filtro, setFiltro] = useState<'todos' | 'pendentes' | 'pagos'>('todos')
  const [busca, setBusca] = useState('')
  const hoje = hojeIso()

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return ordenar(despesas, (d) => d.vencimento).filter((d) =>
      (filtro === 'todos' || (filtro === 'pagos' ? d.pago : !d.pago)) &&
      (!q || d.descricao.toLowerCase().includes(q) || d.categoria.toLowerCase().includes(q)))
  }, [despesas, filtro, busca])

  const total = lista.reduce((s, d) => s + d.valor, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Despesas</CardTitle>
        <CardDescription>Marque como pago conforme for quitando</CardDescription>
        <CardAction>
          <Button size="sm" onClick={onAdd}><PlusIcon /> Despesa</Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={filtro} onValueChange={(v) => setFiltro(v as typeof filtro)}>
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
              <TabsTrigger value="pagos">Pagos</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative ml-auto w-full sm:w-56">
            <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Buscar…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Descrição</TableHead>
              <TableHead className="hidden sm:table-cell">Categoria</TableHead>
              <TableHead>Venc.</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Nenhuma despesa.</TableCell>
              </TableRow>
            )}
            {lista.map((d) => {
              const atrasado = !d.pago && d.vencimento && d.vencimento < hoje
              return (
                <TableRow key={d.id} className={cn(d.pago && 'text-muted-foreground')}>
                  <TableCell>
                    <Checkbox checked={d.pago} onCheckedChange={(c) => onToggle(d.id, Boolean(c))} aria-label="Pago" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className={cn('font-medium', d.pago && 'line-through')}>{d.descricao}</span>
                      {d.fixoId && <FixoBadge />}
                    </div>
                    {d.obs && <div className="text-xs text-muted-foreground">{d.obs}</div>}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell"><Badge variant="secondary">{d.categoria}</Badge></TableCell>
                  <TableCell className={cn('tabular-nums', atrasado && 'font-medium text-destructive')}>
                    {diaMes(d.vencimento)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{brl(d.valor)}</TableCell>
                  <TableCell><AcoesMenu onEdit={() => onEdit(d)} onDelete={() => onDelete(d)} /></TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          {lista.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>Total {filtro !== 'todos' && `(${filtro})`}</TableCell>
                <TableCell className="text-right tabular-nums">{brl(total)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </CardContent>
    </Card>
  )
}

export function ReceitasCard({
  receitas, onToggle, onAdd, onEdit, onDelete,
}: {
  receitas: Receita[]
  onToggle: (id: string, recebido: boolean) => void
  onAdd: () => void
  onEdit: (r: Receita) => void
  onDelete: (r: Receita) => void
}) {
  const lista = ordenar(receitas, (r) => r.data)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Receitas</CardTitle>
        <CardDescription>Salário e outras entradas</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline" onClick={onAdd}><PlusIcon /> Receita</Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {lista.length === 0 && (
              <TableRow>
                <TableCell className="py-6 text-center text-muted-foreground">Nenhuma receita.</TableCell>
              </TableRow>
            )}
            {lista.map((r) => (
              <TableRow key={r.id} className={cn(r.recebido && 'text-muted-foreground')}>
                <TableCell className="w-10">
                  <Checkbox checked={r.recebido} onCheckedChange={(c) => onToggle(r.id, Boolean(c))} aria-label="Recebido" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{r.descricao}</span>
                    {r.fixoId && <FixoBadge />}
                  </div>
                  <div className="text-xs text-muted-foreground">{diaMes(r.data)}</div>
                </TableCell>
                <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">{brl(r.valor)}</TableCell>
                <TableCell className="w-10"><AcoesMenu onEdit={() => onEdit(r)} onDelete={() => onDelete(r)} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
