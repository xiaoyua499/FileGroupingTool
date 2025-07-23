import { dialog, BrowserWindow } from 'electron'

export async function selectFolder(win: BrowserWindow): Promise<string | null> {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
    title: '请选择一个文件夹',
  })
  return result.canceled ? null : result.filePaths[0]
}
