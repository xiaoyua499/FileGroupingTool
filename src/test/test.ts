import * as fs from 'fs'
import * as path from 'path'

const folderPath = path.resolve('../test', 'test-folder')
const fileCount = 2000 // 可调整数量
const intervalSeconds = 10 // 每个文件创建时间相差60秒

// 如果目录已存在则清空
if (fs.existsSync(folderPath)) {
  fs.rmSync(folderPath, { recursive: true, force: true })
}
fs.mkdirSync(folderPath)

console.log(`📂 创建测试文件夹: ${folderPath}`)

// 创建模拟文件
for (let i = 0; i < fileCount; i++) {
  const fileName = `${(i + 1).toString().padStart(2, '0')}.txt`
  const filePath = path.join(folderPath, fileName)
  fs.writeFileSync(filePath, `测试文件 ${fileName}`)

  // 设置文件的创建时间（仅在 Mac/Linux 有效，Windows 可能无效）
  const time = new Date(Date.now() - (fileCount - i) * intervalSeconds * 1000)
  fs.utimesSync(filePath, time, time) // atime, mtime
}

console.log(`✅ 已创建 ${fileCount} 个测试文件。`)
