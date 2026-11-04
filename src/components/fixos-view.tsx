import { PencilIcon, PlusIcon, Trash2Icon, UploadIcon } from 'lucide-react'
import { OrcamentoEditor } from '@/components/orcamento'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { brl } from '@/lib/format'
import type { Fixo, Orcamento } from '@/lib/types'
import { cn } from '@/lib/utils'

export function FixosView({
  fixos, categorias, orcamento, onAdd, onEdit, onDelete, onToggle, onImport, onCategorias, onOrcamento,
}: {
  fixos: Fixo[]
  categorias: string[]
  onAdd: () => void
  onEdit: (f: Fixo) => void
  onDelete: (f: Fixo) => void
  onToggle: (id: string, ativo: boolean) => void
  onImport: () => void
  onCategorias: (c: string[]) => void
  orcamento: Orcamento[]
  onOrcamento: (o: Orcamento[]) => void
}) {
  const ordenados = [...fixos].sort((a, b) =>
    a.tipo.localeCompare(b.tipo) * -1 || (a.dia ?? 99) - (b.dia ?? 99) || a.descricao.localeCompare(b.descricao))
  const ativos = fixos.filter((f) => f.ativo)
  const totalDesp = ativos.filter((f) => f.tipo === 'despesa').reduce((s, f) => s + f.valor, 0)
  const totalRec = ativos.filter((f) => f.tipo === 'receita').reduce((s, f) => s + f.valor, 0)
  const totalAporte = ativos.filter((f) => f.tipo === 'aporte').reduce((s, f) => s + f.valor, 0)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card>
        <CardHeader>
          <CardTitle>Fixos</CardTitle>
          <CardDescription>
            Receitas e contas que se repetem todo mês. Em cada mês novo, "Lançar fixos" copia estes itens.
          </CardDescription>
          <CardAction className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onImport}><UploadIcon /> Importar planilha</Button>
            <Button size="sm" onClick={onAdd}><PlusIcon /> Fixo</Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Ativo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                <TableHead>Dia</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordenados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Nenhum fixo cadastrado.
                  </TableCell>
                </TableRow>
              )}
              {ordenados.map((f) => (
                <TableRow key={f.id} className={cn(!f.ativo && 'text-muted-foreground')}>
                  <TableCell>
                    <Checkbox checked={f.ativo} onCheckedChange={(c) => onToggle(f.id, Boolean(c))} aria-label="Ativo" />
                  </TableCell>
                  <TableCell className="font-medium">{f.descricao}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {f.tipo === 'receita'
                      ? <Badge className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">Receita</Badge>
                      : f.tipo === 'aporte'
                        ? <Badge className="bg-sky-600/10 text-sky-700 dark:text-sky-400">Aporte</Badge>
                        : <Badge variant="secondary">{f.categoria}</Badge>}
                  </TableCell>
                  <TableCell className="tabular-nums">{f.dia ?? '—'}</TableCell>
                  <TableCell className={cn('text-right tabular-nums', f.tipo === 'receita' && 'text-emerald-600 dark:text-emerald-400')}>
                    {brl(f.valor)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon-sm" onClick={() => onEdit(f)} aria-label="Editar"><PencilIcon /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => onDelete(f)} aria-label="Excluir"><Trash2Icon /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            {ordenados.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4}>Despesas fixas ativas</TableCell>
                  <TableCell className="text-right tabular-nums">{brl(totalDesp)}</TableCell>
                  <TableCell />
                </TableRow>
                {totalRec > 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>Sobra após fixos{totalAporte > 0 && ` e ${brl(totalAporte)} em aportes`}</TableCell>
                    <TableCell className="text-right tabular-nums">{brl(totalRec - totalDesp - totalAporte)}</TableCell>
                    <TableCell />
                  </TableRow>
                )}
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>

      <OrcamentoEditor
        categorias={categorias}
        orcamento={orcamento}
        onCategorias={onCategorias}
        onOrcamento={onOrcamento}
      />
    </div>
  )
}
