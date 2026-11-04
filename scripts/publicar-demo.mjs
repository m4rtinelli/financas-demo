// Gera a demo e publica o conteúdo de dist/ na branch gh-pages.
import { execSync } from 'node:child_process'

const REPO = 'https://github.com/m4rtinelli/financas-demo.git'
const run = (cmd, cwd = '.') => execSync(cmd, { cwd, stdio: 'inherit' })
// dist/ é um repositório à parte: usa a mesma identidade deste projeto, não a global
const config = (chave) => execSync(`git config ${chave}`, { encoding: 'utf8' }).trim()
const autor = `-c user.name="${config('user.name')}" -c user.email="${config('user.email')}"`

run('npm run build:demo')
run('git init -b gh-pages', 'dist')
run('git add -A', 'dist')
run(`git ${autor} commit -m "Publica demo"`, 'dist')
run(`git push --force ${REPO} gh-pages`, 'dist')
