import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { parseValor } from '@/lib/format'

type TipoFixo = 'despesa' | 'receita' | 'aporte'

export type ItemKind = 'despesa' | 'receita' | 'fixo'

export type ItemValues = {
  descricao: string
  valor: number
  categoria: string
  /** YYYY-MM-DD (despesa/receita) */
  data?: string
  /** dia do mês (fixo) */
  dia?: number
  feito: boolean
  tipo: TipoFixo
  /** fixo do tipo aporte: posição de destino */
  ativoId?: string
  obs?: string
}

const TITULOS: Record<ItemKind, [string, string]> = {
  despesa: ['Despesa', 'Lançamento deste mês.'],
  receita: ['Receita', 'Entrada de dinheiro deste mês.'],
  fixo: ['Gasto fixo', 'Repete todo mês. Use "Lançar fixos" para trazer para o mês aberto.'],
}

export function ItemDialog({
  open, onOpenChange, kind, inicial, categorias, investimentos = [], mes, onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  kind: ItemKind
  inicial?: Partial<ItemValues>
  categorias: string[]
  investimentos?: { id: string; nome: string }[]
  mes: string
  onSave: (v: ItemValues) => void
}) {
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [categoria, setCategoria] = useState('')
  const [data, setData] = useState('')
  const [dia, setDia] = useState('')
  const [feito, setFeito] = useState(false)
  const [tipo, setTipo] = useState<TipoFixo>('despesa')
  const [ativoId, setAtivoId] = useState('')
  const [obs, setObs] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!open) return
    setDescricao(inicial?.descricao ?? '')
    setValor(inicial?.valor !== undefined ? String(inicial.valor).replace('.', ',') : '')
    setCategoria(inicial?.categoria ?? categorias[0] ?? 'Outros')
    setData(inicial?.data ?? '')
    setDia(inicial?.dia ? String(inicial.dia) : '')
    setFeito(inicial?.feito ?? false)
    setTipo(inicial?.tipo ?? 'despesa')
    setAtivoId(inicial?.ativoId ?? investimentos[0]?.id ?? '')
    setObs(inicial?.obs ?? '')
    setErro('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, inicial])

  const editando = inicial?.descricao !== undefined
  const [titulo, descricaoDialog] = TITULOS[kind]
  const mostraCategoria = kind === 'despesa' || (kind === 'fixo' && tipo === 'despesa')

  function salvar(e: React.FormEvent) {
    e.preventDefault()
    const v = parseValor(valor)
    if (!descricao.trim()) return setErro('Informe a descrição.')
    if (Number.isNaN(v) || v < 0) return setErro('Valor inválido.')
    const d = dia ? Number(dia) : undefined
    if (d !== undefined && (d < 1 || d > 31)) return setErro('Dia deve ser entre 1 e 31.')
    if (kind === 'fixo' && tipo === 'aporte' && !ativoId) return setErro('Escolha o investimento de destino (cadastre na aba Investimentos).')
    onSave({
      descricao: descricao.trim(), valor: v, categoria, data: data || undefined,
      dia: d, feito, tipo, obs: obs.trim() || undefined,
      ativoId: kind === 'fixo' && tipo === 'aporte' ? ativoId : undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={salvar} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{editando ? `Editar ${titulo.toLowerCase()}` : kind === 'fixo' ? 'Novo gasto fixo' : `Nova ${titulo.toLowerCase()}`}</DialogTitle>
            <DialogDescription>{descricaoDialog}</DialogDescription>
          </DialogHeader>

          {kind === 'fixo' && (
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select
                value={tipo}
                onValueChange={(v) => setTipo(v as TipoFixo)}
                items={{ despesa: 'Despesa', receita: 'Receita', aporte: 'Aporte em investimento' }}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="despesa">Despesa</SelectItem>
                  <SelectItem value="receita">Receita (salário, aluguel recebido…)</SelectItem>
                  <SelectItem value="aporte">Aporte em investimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input id="descricao" autoFocus value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Aluguel" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input id="valor" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
            </div>
            {kind === 'fixo' ? (
              <div className="grid gap-2">
                <Label htmlFor="dia">Dia do vencimento</Label>
                <Input id="dia" type="number" min={1} max={31} value={dia} onChange={(e) => setDia(e.target.value)} placeholder="—" />
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="data">{kind === 'despesa' ? 'Vencimento' : 'Data'}</Label>
                <Input
                  id="data" type="date" value={data} onChange={(e) => setData(e.target.value)}
                  min={`${mes}-01`} max={`${mes}-31`}
                />
              </div>
            )}
          </div>

          {kind === 'fixo' && tipo === 'aporte' && (
            <div className="grid gap-2">
              <Label>Investimento</Label>
              <Select
                value={ativoId}
                onValueChange={(v) => setAtivoId(String(v))}
                items={Object.fromEntries(investimentos.map((i) => [i.id, i.nome]))}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Cadastre na aba Investimentos" /></SelectTrigger>
                <SelectContent>
                  {investimentos.map((i) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {mostraCategoria && (
            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={(v) => setCategoria(String(v))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[...new Set([...categorias, categoria])].filter(Boolean).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {kind === 'despesa' && (
            <div className="grid gap-2">
              <Label htmlFor="obs">Observação</Label>
              <Textarea id="obs" rows={2} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Opcional" />
            </div>
          )}

          <Label className="flex items-center gap-2 font-normal">
            <Checkbox checked={feito} onCheckedChange={(c) => setFeito(Boolean(c))} />
            {kind === 'despesa' ? 'Já está pago' : kind === 'receita' ? 'Já recebi' : 'Ativo (entra no lançamento mensal)'}
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
