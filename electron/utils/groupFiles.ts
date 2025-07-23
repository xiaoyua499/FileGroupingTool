import fs from 'fs'
import path from 'path'

export function groupFiles(folderPath: string, step: number, folderCount: number) {
  const files = fs.readdirSync(folderPath).filter(f => fs.statSync(path.join(folderPath, f)).isFile())
  files.sort()

  const groups: string[][] = Array.from({ length: folderCount }, () => [])

  for (let i = 0; i < files.length; i++) {
    const groupIndex = i % folderCount
    groups[groupIndex].push(files[i])
  }

  for (let i = 0; i < groups.length; i++) {
    const targetDir = path.join(folderPath, `group_${i + 1}`)
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir)
    for (const file of groups[i]) {
      fs.copyFileSync(path.join(folderPath, file), path.join(targetDir, file))
    }
  }

  return true
}
