import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { parseTabela, type LinhaImport } from '@/lib/csv'
import { brl, mesLabel } from '@/lib/format'

export type Destino = 'fixos' | 'mes'

export function ImportDialog({
  open, onOpenChange, mes, destinoInicial, onImport,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  mes: string
  destinoInicial: Destino
  onImport: (linhas: LinhaImport[], destino: Destino) => void
}) {
  const [texto, setTexto] = useState('')
  const [destino, setDestino] = useState<Destino>(destinoInicial)
  const { linhas, avisos } = useMemo(() => parseTabela(texto), [texto])

  useEffect(() => {
    if (open) setDestino(destinoInicial)
    else setTexto('')
  }, [open, destinoInicial])

  async function lerArquivo(f: File | undefined) {
    if (!f) return
    const buf = await f.arrayBuffer()
    let t = new TextDecoder('utf-8').decode(buf)
    if (t.includes('�')) t = new TextDecoder('windows-1252').decode(buf)
    setTexto(t)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar planilha</DialogTitle>
          <DialogDescription>
            Copie as células no Excel/Google Sheets e cole aqui, ou escolha um arquivo .csv.
            Colunas reconhecidas: descrição, valor, categoria, dia.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Importar para</Label>
              <Select
                value={destino}
                onValueChange={(v) => setDestino(v as Destino)}
                items={{ fixos: 'Gastos fixos (modelo mensal)', mes: `Despesas de ${mesLabel(mes)}` }}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixos">Gastos fixos (modelo mensal)</SelectItem>
                  <SelectItem value="mes">Despesas de {mesLabel(mes)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="arquivo">Arquivo CSV</Label>
              <Input id="arquivo" type="file" accept=".csv,.tsv,.txt" onChange={(e) => lerArquivo(e.target.files?.[0])} />
            </div>
          </div>

          <Textarea
            rows={6}
            className="font-mono text-xs"
            placeholder={'Descrição\tValor\tCategoria\tDia\nAluguel\t2.500,00\tMoradia\t5\nInternet\t119,90\tContas\t10'}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />

          {linhas.length > 0 && (
            <div className="max-h-56 overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Dia</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell>{l.descricao}</TableCell>
                      <TableCell className="text-muted-foreground">{l.categoria ?? 'Outros'}</TableCell>
                      <TableCell className="tabular-nums">{l.dia ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{brl(l.valor)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {avisos.length > 0 && <p className="text-xs text-amber-600">{avisos.join(' · ')}</p>}
        </div>

        <DialogFooter>
          <span className="mr-auto self-center text-sm text-muted-foreground">
            {linhas.length > 0 && `${linhas.length} itens · ${brl(linhas.reduce((s, l) => s + l.valor, 0))}`}
          </span>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={!linhas.length}
            onClick={() => {
              onImport(linhas, destino)
              setTexto('')
              onOpenChange(false)
            }}
          >
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
