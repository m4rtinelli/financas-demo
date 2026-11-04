import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Progress } from '@/components/ui/progress'
import { brl } from '@/lib/format'
import type { Mes } from '@/lib/types'

const soma = (xs: { valor: number }[]) => xs.reduce((s, x) => s + x.valor, 0)

export function ResumoCards({ dados, planejado }: { dados: Mes; planejado: number }) {
  const receitas = soma(dados.receitas)
  const recebido = soma(dados.receitas.filter((r) => r.recebido))
  const despesas = soma(dados.despesas)
  const pago = soma(dados.despesas.filter((d) => d.pago))
  const liquido = (as: Mes['aportes']) => as.reduce((s, a) => s + (a.tipo === 'resgate' ? -a.valor : a.valor), 0)
  const aportes = liquido(dados.aportes)
  const aportesFeitos = liquido(dados.aportes.filter((a) => a.feito))
  const saldo = receitas - despesas - aportes
  const pctPago = despesas ? (pago / despesas) * 100 : 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardDescription>Receitas</CardDescription>
          <CardTitle className="text-2xl tabular-nums text-emerald-600 dark:text-emerald-400">{brl(receitas)}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">Recebido {brl(recebido)}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Despesas</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{brl(despesas)}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {planejado > 0 ? `Planejado ${brl(planejado)} · ` : ''}{dados.despesas.length} lançamentos
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Saldo previsto</CardDescription>
          <CardTitle className={`text-2xl tabular-nums ${saldo < 0 ? 'text-destructive' : ''}`}>{brl(saldo)}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">{aportes ? `Após ${brl(aportes)} em aportes · ` : ''}Em caixa {brl(recebido - pago - aportesFeitos)}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Pago</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{brl(pago)}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-1.5">
          <Progress value={pctPago} />
          <span className="text-xs text-muted-foreground">Falta pagar {brl(despesas - pago)}</span>
        </CardContent>
      </Card>
    </div>
  )
}

const chartConfig = { valor: { label: 'Total', color: 'var(--chart-1)' } } satisfies ChartConfig

export function GraficoCategorias({ dados }: { dados: Mes }) {
  const porCat = new Map<string, number>()
  for (const d of dados.despesas) porCat.set(d.categoria || 'Outros', (porCat.get(d.categoria || 'Outros') ?? 0) + d.valor)
  const data = [...porCat].map(([categoria, valor]) => ({ categoria, valor })).sort((a, b) => b.valor - a.valor)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Por categoria</CardTitle>
        <CardDescription>Onde o dinheiro está indo este mês</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Sem despesas ainda.</p>
        ) : (
          <ChartContainer config={chartConfig} className="w-full" style={{ height: Math.max(160, data.length * 36) }}>
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 12 }}>
              <CartesianGrid horizontal={false} />
              <YAxis dataKey="categoria" type="category" tickLine={false} axisLine={false} width={96} />
              <XAxis type="number" hide />
              <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(v) => brl(Number(v))} hideLabel={false} />} />
              <Bar dataKey="valor" fill="var(--color-valor)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
