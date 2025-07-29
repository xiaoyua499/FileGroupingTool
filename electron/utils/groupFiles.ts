import * as fs from 'fs'
import * as path from 'path'
import { shell } from 'electron'

export function groupFiles(folderPath: string, step: string, folderCount: string) {
  const newStep = Number(step)
  const newFolderCount = Number(folderCount)

  // 1. 获取文件（并按创建时间升序排序）
  const allFiles = fs.readdirSync(folderPath)
    .filter(f => fs.statSync(path.join(folderPath, f)).isFile())
    .map(f => ({
      name: f,
      fullPath: path.join(folderPath, f),
      birth: fs.statSync(path.join(folderPath, f)).birthtime.getTime()
    }))
    .sort((a, b) => a.birth - b.birth)

  // 2. 分组
  // const groups: typeof allFiles[][] = Array.from({ length: newFolderCount }, () => [])
  interface FileItem {
    name: string
    fullPath: string
    birth: number
  }

  const groups: FileItem[][] = Array.from({ length: newFolderCount }, () => [])


  for (let i = 0; i < allFiles.length; i += newStep * newFolderCount) {
    for (let group = 0; group < newFolderCount; group++) {
      const start = i + group * newStep
      const end = start + newStep
      if (start < allFiles.length) {
        groups[group].push(...allFiles.slice(start, end))
      }
    }
  }

  // 3. 创建目标目录并复制
  for (let i = 0; i < groups.length; i++) {
    const targetDir = path.join(folderPath, `group_${i + 1}`)
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir)

    for (const file of groups[i]) {
      const targetPath = path.join(targetDir, file.name)
      fs.copyFileSync(file.fullPath, targetPath)
    }
  }

  // 4. 删除原文件
  for (const file of allFiles) {
    fs.unlinkSync(file.fullPath)
  }

  // 5. 打开目标文件夹
  shell.openPath(folderPath)

  return true
}
