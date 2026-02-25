import * as fs from 'fs'
import * as path from 'path'
import { shell } from 'electron'
import type { GroupFilesParams, GroupProgressPayload } from './type.js'

interface FileItem {
  name: string
  fullPath: string
  birth: number
}

function getSortedFiles(folderPath: string): FileItem[] {
  return fs.readdirSync(folderPath)
    .filter(f => fs.statSync(path.join(folderPath, f)).isFile())
    .map(f => ({
      name: f,
      fullPath: path.join(folderPath, f),
      birth: fs.statSync(path.join(folderPath, f)).birthtime.getTime()
    }))
    .sort((a, b) => a.birth - b.birth)
}

function groupByStepAndFolderCount(allFiles: FileItem[], step: number, folderCount: number): FileItem[][] {
  const groups: FileItem[][] = Array.from({ length: folderCount }, () => [])

  for (let i = 0; i < allFiles.length; i += step * folderCount) {
    for (let group = 0; group < folderCount; group++) {
      const start = i + group * step
      const end = start + step
      if (start < allFiles.length) {
        groups[group].push(...allFiles.slice(start, end))
      }
    }
  }

  return groups
}

function groupByNumberPerGroup(allFiles: FileItem[], numberPerGroup: number): FileItem[][] {
  const groups: FileItem[][] = []
  for (let i = 0; i < allFiles.length; i += numberPerGroup) {
    groups.push(allFiles.slice(i, i + numberPerGroup))
  }
  return groups
}

export function groupFiles(
  params: GroupFilesParams,
  onProgress?: (payload: GroupProgressPayload) => void
) {
  const { folderPath, groupType, step, folderCount, numberPerGroup } = params
  const allFiles = getSortedFiles(folderPath)
  let groups: FileItem[][] = []

  let processedSteps = 0
  let lastPercent = -1
  const totalSteps = Math.max(allFiles.length * 2, 1)
  const emitProgress = (status: GroupProgressPayload['status'], text: string, force = false) => {
    const percent = Math.min(100, Math.floor((processedSteps / totalSteps) * 100))
    if (force || percent !== lastPercent) {
      lastPercent = percent
      onProgress?.({ percent, status, text })
    }
  }

  try {
    emitProgress('processing', '分组中: 0%', true)

    if (groupType === '1') {
      groups = groupByNumberPerGroup(allFiles, Number(numberPerGroup))
    } else {
      groups = groupByStepAndFolderCount(allFiles, Number(step), Number(folderCount))
    }

    for (let i = 0; i < groups.length; i++) {
      const targetDir = path.join(folderPath, `group_${i + 1}`)
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir)

      for (const file of groups[i]) {
        const targetPath = path.join(targetDir, file.name)
        fs.copyFileSync(file.fullPath, targetPath)
        processedSteps += 1
        emitProgress('processing', `分组中: ${Math.floor((processedSteps / totalSteps) * 100)}%`)
      }
    }

    for (const file of allFiles) {
      fs.unlinkSync(file.fullPath)
      processedSteps += 1
      emitProgress('processing', `分组中: ${Math.floor((processedSteps / totalSteps) * 100)}%`)
    }

    emitProgress('success', '分组完成', true)
    shell.openPath(folderPath)
    return true
  } catch (error) {
    emitProgress('error', '分组失败', true)
    throw error
  }
}
