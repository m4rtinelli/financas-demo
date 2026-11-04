# Finanças — app local de controle de despesas mensais

Vite + React + TypeScript + Tailwind v4 + shadcn/ui (estilo `base-nova`, componentes sobre **Base UI**, não Radix:
use `render={<Button/>}` em vez de `asChild`, e passe `items` ao `<Select>` quando o rótulo for diferente do valor).

Rodar: `npm run dev` (ou `iniciar.bat`) → http://localhost:5180

## Dados (fonte da verdade = arquivos JSON em `data/`)

O app lê/grava via `server/data-api.ts` (middleware do Vite). Editar os JSON por fora é suportado:
o servidor observa `data/` e a tela recarrega sozinha.

- `data/categorias.json` — `string[]`
- `data/orcamento.json` — valor planejado por mês por categoria: `{ categoria, valor }[]`
  (o card Orçamento compara com a soma real das despesas do mês; não gera lançamentos)
- `data/fixos.json` — modelo mensal (gastos/receitas/aportes que se repetem):
  `{ id, tipo: "despesa"|"receita"|"aporte", descricao, categoria, valor, dia?, ativo, ativoId? }`
  (`ativoId` = id do investimento de destino quando `tipo` é "aporte")
- `data/investimentos.json` — carteira montada à mão:
  `{ id, nome, instituicao?, tipo, saldos: { "AAAA-MM": valor }, arquivado? }[]`
  `tipo` ∈ Renda fixa, Tesouro, Ações, FIIs, Fundos, Previdência, Cripto, Exterior, Reserva, Outros.
  `saldos[mes]` = saldo de fim de mês informado pelo usuário. Rendimento do mês =
  saldo do mês − último saldo anterior − aportes líquidos feitos no mês.
- `data/meses/AAAA-MM.json` — um arquivo por mês:
  ```json
  {
    "mes": "2026-10",
    "receitas": [{ "id", "descricao", "valor", "data?": "AAAA-MM-DD", "recebido": bool, "fixoId?" }],
    "despesas": [{ "id", "descricao", "categoria", "valor", "vencimento?": "AAAA-MM-DD", "pago": bool, "fixoId?", "obs?" }],
    "aportes": [{ "id", "investimentoId", "tipo": "aporte"|"resgate", "valor", "data?": "AAAA-MM-DD", "feito": bool, "fixoId?" }]
  }
  ```

Regras ao lançar dados por fora:
- `valor` é número em reais (ponto decimal), sempre positivo.
- `id`: 8 caracteres hex únicos dentro do arquivo.
- `categoria` deve existir em `categorias.json` (adicione lá se for nova).
- `fixoId` liga a despesa ao fixo de origem; é o que evita lançar o mesmo fixo duas vezes.
- Se o arquivo do mês não existir, crie com `receitas: []`, `despesas: []` e `aportes: []`.
- Grave em UTF-8 sem escapar acentos.
- Aporte não é despesa: não entra no orçamento, mas reduz o saldo do mês.
