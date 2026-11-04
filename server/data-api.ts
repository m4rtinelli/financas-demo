import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

const DATA_DIR = path.resolve(import.meta.dirname, '../data')
const MESES_DIR = path.join(DATA_DIR, 'meses')
const MES_RE = /^\d{4}-\d{2}$/

const DEFAULT_CATEGORIAS = [
  'Moradia', 'Contas', 'Alimentação', 'Transporte', 'Saúde', 'Educação',
  'Lazer', 'Assinaturas', 'Compras', 'Cartão', 'Impostos', 'Outros',
]

function ensureData() {
  fs.mkdirSync(MESES_DIR, { recursive: true })
  const cat = path.join(DATA_DIR, 'categorias.json')
  if (!fs.existsSync(cat)) writeJson(cat, DEFAULT_CATEGORIAS)
  const fixos = path.join(DATA_DIR, 'fixos.json')
  if (!fs.existsSync(fixos)) writeJson(fixos, [])
  const orcamento = path.join(DATA_DIR, 'orcamento.json')
  if (!fs.existsSync(orcamento)) writeJson(orcamento, [])
  const investimentos = path.join(DATA_DIR, 'investimentos.json')
  if (!fs.existsSync(investimentos)) writeJson(investimentos, [])
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, '')) as T
  } catch {
    return fallback
  }
}

function writeJson(file: string, data: unknown) {
  const tmp = `${file}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8')
  fs.renameSync(tmp, file)
}

function readBody(req: import('node:http').IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (c) => (raw += c))
    req.on('end', () => {
      try { resolve(JSON.parse(raw || 'null')) } catch (e) { reject(e) }
    })
    req.on('error', reject)
  })
}

export function dataApi(): Plugin {
  return {
    name: 'finances-data-api',
    configureServer(server) {
      ensureData()

      // Avisa o navegador quando algum JSON em data/ muda por fora do app
      server.watcher.add(DATA_DIR)
      const notify = (file: string) => {
        if (file.startsWith(DATA_DIR) && file.endsWith('.json')) {
          server.ws.send({ type: 'custom', event: 'data-changed', data: { file: path.relative(DATA_DIR, file) } })
        }
      }
      server.watcher.on('change', notify)
      server.watcher.on('add', notify)
      server.watcher.on('unlink', notify)

      server.middlewares.use('/api', async (req, res) => {
        const url = new URL(req.url ?? '/', 'http://x')
        const parts = url.pathname.split('/').filter(Boolean)
        const send = (status: number, body: unknown) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(body))
        }

        try {
          const [res0, id] = parts
          if (res0 === 'categorias' || res0 === 'fixos' || res0 === 'orcamento' || res0 === 'investimentos') {
            const file = path.join(DATA_DIR, `${res0}.json`)
            if (req.method === 'GET') return send(200, readJson(file, []))
            if (req.method === 'PUT') {
              writeJson(file, await readBody(req))
              return send(200, { ok: true })
            }
          }

          if (res0 === 'meses' && !id && req.method === 'GET') {
            const meses = fs.readdirSync(MESES_DIR)
              .filter((f) => f.endsWith('.json'))
              .map((f) => f.replace(/\.json$/, ''))
              .filter((m) => MES_RE.test(m))
              .sort()
            return send(200, meses)
          }

          if (res0 === 'meses' && id && MES_RE.test(id)) {
            const file = path.join(MESES_DIR, `${id}.json`)
            if (req.method === 'GET') {
              const exists = fs.existsSync(file)
              const data = readJson(file, { mes: id, receitas: [], despesas: [], aportes: [] })
              return send(200, { ...data, mes: id, existe: exists })
            }
            if (req.method === 'PUT') {
              const body = (await readBody(req)) as Record<string, unknown>
              delete body.existe
              writeJson(file, { ...body, mes: id })
              return send(200, { ok: true })
            }
          }

          send(404, { error: 'not found' })
        } catch (e) {
          send(500, { error: String(e) })
        }
      })
    },
  }
}
