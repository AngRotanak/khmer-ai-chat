import fs from 'fs'
import path from 'path'

export function loadFlow(flowName: string) {
  const base = path.join(__dirname, '../flows', flowName)
  const en = JSON.parse(fs.readFileSync(path.join(base, 'en.json'), 'utf-8'))
  const kh = JSON.parse(fs.readFileSync(path.join(base, 'kh.json'), 'utf-8'))
  const metadata = JSON.parse(fs.readFileSync(path.join(base, 'metadata.json'), 'utf-8'))

  return { en, kh, metadata }
}
