import * as fs from 'fs'
import * as path from 'path'
import { shell } from 'electron'
export function groupFiles(folderPath: string, step: string, folderCount: string) {
  let newStep = Number(step)
  let newFolderCount = Number(folderCount)
  const files = fs.readdirSync(folderPath).filter(f => fs.statSync(path.join(folderPath, f)).isFile())
  files.sort()
  console.log(files);

  const groups: string[][] = Array.from({ length: newFolderCount }, () => [])


  for (let i = 0; i < files.length; i += newStep * newFolderCount) {
    for (let group = 0; group < newFolderCount; group++) {
      const start = i + group * newStep;
      const end = start + newStep;
      if (start < files.length) {
        groups[group].push(...files.slice(start, end));
      }
    }
  }

  for (let i = 0; i < groups.length; i++) {
    const targetDir = path.join(folderPath, `group_${i + 1}`)
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir)
    for (const file of groups[i]) {
      fs.renameSync(path.join(folderPath, file), path.join(targetDir, file))
    }
  }
  // 分组完成后打开该文件夹
  shell.openPath(folderPath)
  return true
}
