import { useEffect, useState } from 'react'
import { PlusIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { brl, parseValor } from '@/lib/format'
import type { Mes, Orcamento } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Planejado × real por categoria, como na aba "Resumo" da planilha. */
export function OrcamentoCard({ dados, orcamento }: { dados: Mes; orcamento: Orcamento[] }) {
  const real = new Map<string, number>()
  for (const d of dados.despesas) real.set(d.categoria || 'Outros', (real.get(d.categoria || 'Outros') ?? 0) + d.valor)

  const linhas = [
    ...orcamento.filter((o) => o.valor > 0 || real.has(o.categoria)),
    ...[...real.keys()].filter((c) => !orcamento.some((o) => o.categoria === c)).map((categoria) => ({ categoria, valor: 0 })),
  ].map((o) => ({ ...o, real: real.get(o.categoria) ?? 0 }))

  const totalPlan = linhas.reduce((s, l) => s + l.valor, 0)
  const totalReal = linhas.reduce((s, l) => s + l.real, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orçamento</CardTitle>
        <CardDescription>Real × planejado por categoria</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {linhas.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Defina o orçamento na aba Fixos & orçamento.</p>
        )}
        {linhas.map((l) => {
          const pct = l.valor ? Math.min(100, (l.real / l.valor) * 100) : l.real ? 100 : 0
          const estourou = l.real > l.valor
          return (
            <div key={l.categoria} className="grid gap-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate">{l.categoria}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  <span className={cn('text-foreground', estourou && 'font-medium text-destructive')}>{brl(l.real)}</span>
                  {' / '}{brl(l.valor)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full transition-all', estourou ? 'bg-destructive' : 'bg-[var(--chart-1)]')}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
      {linhas.length > 0 && (
        <CardFooter className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="tabular-nums">
            <span className={cn('font-medium', totalReal > totalPlan && 'text-destructive')}>{brl(totalReal)}</span>
            <span className="text-muted-foreground"> / {brl(totalPlan)}</span>
          </span>
        </CardFooter>
      )}
    </Card>
  )
}

export function ValorInput({ valor, onChange }: { valor: number; onChange: (v: number) => void }) {
  const [texto, setTexto] = useState('')
  useEffect(() => setTexto(valor ? String(valor).replace('.', ',') : ''), [valor])
  return (
    <Input
      inputMode="decimal"
      className="h-7 w-28 text-right tabular-nums"
      placeholder="0"
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={() => {
        const v = texto.trim() ? parseValor(texto) : 0
        if (Number.isNaN(v) || v < 0) setTexto(valor ? String(valor).replace('.', ',') : '')
        else if (v !== valor) onChange(v)
      }}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  )
}

/** Edita categorias e o valor planejado de cada uma. */
export function OrcamentoEditor({
  categorias, orcamento, onCategorias, onOrcamento,
}: {
  categorias: string[]
  orcamento: Orcamento[]
  onCategorias: (c: string[]) => void
  onOrcamento: (o: Orcamento[]) => void
}) {
  const [nova, setNova] = useState('')
  const valorDe = (c: string) => orcamento.find((o) => o.categoria === c)?.valor ?? 0
  const total = categorias.reduce((s, c) => s + valorDe(c), 0)

  const definir = (categoria: string, valor: number) =>
    onOrcamento([...orcamento.filter((o) => o.categoria !== categoria), { categoria, valor }]
      .sort((a, b) => categorias.indexOf(a.categoria) - categorias.indexOf(b.categoria)))

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Orçamento por categoria</CardTitle>
        <CardDescription>Quanto você planeja gastar por mês em cada categoria</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-1">
        {categorias.map((c) => (
          <div key={c} className="group flex items-center gap-2">
            <span className="flex-1 truncate text-sm">{c}</span>
            <ValorInput valor={valorDe(c)} onChange={(v) => definir(c, v)} />
            <button
              className="rounded-sm p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground"
              onClick={() => {
                onCategorias(categorias.filter((x) => x !== c))
                onOrcamento(orcamento.filter((o) => o.categoria !== c))
              }}
              aria-label={`Remover ${c}`}
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        ))}
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (nova.trim() && !categorias.includes(nova.trim())) onCategorias([...categorias, nova.trim()])
            setNova('')
          }}
        >
          <Input placeholder="Nova categoria" value={nova} onChange={(e) => setNova(e.target.value)} />
          <Button type="submit" size="icon" variant="outline" aria-label="Adicionar"><PlusIcon /></Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between text-sm">
        <span className="text-muted-foreground">Total planejado</span>
        <span className="font-medium tabular-nums">{brl(total)}</span>
      </CardFooter>
    </Card>
  )
}
