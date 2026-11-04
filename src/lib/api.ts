import { demoApi } from './demo-api'
import type { Fixo, Investimento, Mes, Orcamento } from './types'

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json' },
  })
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
  return r.json() as Promise<T>
}

/** Marca escritas feitas pelo próprio app, para ignorar o eco do file watcher. */
export let lastLocalWrite = 0
const put = (url: string, body: unknown) => {
  lastLocalWrite = Date.now()
  return req<{ ok: true }>(url, { method: 'PUT', body: JSON.stringify(body) })
}

/** Build de demonstração (`npm run build:demo`): sem servidor, dados fictícios no navegador. */
export const DEMO = import.meta.env.VITE_DEMO === 'true'

const apiLocal = {
  getMes: (mes: string) => req<Mes>(`/api/meses/${mes}`),
  saveMes: (m: Mes) => put(`/api/meses/${m.mes}`, m),
  listMeses: () => req<string[]>('/api/meses'),
  getFixos: () => req<Fixo[]>('/api/fixos'),
  saveFixos: (f: Fixo[]) => put('/api/fixos', f),
  getOrcamento: () => req<Orcamento[]>('/api/orcamento'),
  saveOrcamento: (o: Orcamento[]) => put('/api/orcamento', o),
  getInvestimentos: () => req<Investimento[]>('/api/investimentos'),
  saveInvestimentos: (i: Investimento[]) => put('/api/investimentos', i),
  getCategorias: () => req<string[]>('/api/categorias'),
  saveCategorias: (c: string[]) => put('/api/categorias', c),
}

export const api = DEMO ? demoApi : apiLocal
