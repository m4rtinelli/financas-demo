# Finanças

App local de controle de despesas por mês.

**Abrir:** dê dois cliques em `iniciar.bat` (ou rode `npm run dev`) e acesse http://localhost:5180

- **Gastos fixos**: o modelo do mês. Importe sua planilha (copie as células no Excel/Sheets e cole) ou cadastre um a um.
- **Mês**: ao abrir um mês novo, clique em **Lançar fixos**; depois marque o que foi pago e adicione gastos avulsos.
- Os dados ficam em `data/` (JSON). Pode editar à mão ou pedir ao Claude para lançar — a tela atualiza sozinha.

## Demo online

https://m4rtinelli.github.io/financas-demo/

A demo usa dados fictícios e salva tudo só no navegador de quem está testando. A pasta `data/` não é versionada.

Para publicar uma nova versão:

```bash
npm run deploy:demo
```
