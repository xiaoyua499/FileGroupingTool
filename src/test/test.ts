import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

type TestCase = {
  name: string
  fileCount: number
  description: string
  suggestParams: {
    groupType: '0' | '1'
    phoneNum?: number
    size?: number
    folderCount?: number
    numberPerGroup?: number
  }
}

const testCases: TestCase[] = [
  {
    name: 'case_01_type0_regular',
    fileCount: 120,
    description: '按文件个数分组: 常规场景',
    suggestParams: { groupType: '0', phoneNum: 2, size: 5, folderCount: 4 },
  },
  {
    name: 'case_02_type0_remainder',
    fileCount: 73,
    description: '按文件个数分组: 不能整除场景',
    suggestParams: { groupType: '0', phoneNum: 1, size: 6, folderCount: 5 },
  },
  {
    name: 'case_03_type1_regular',
    fileCount: 250,
    description: '按每组个数分组: 常规场景',
    suggestParams: { groupType: '1', numberPerGroup: 40 },
  },
  {
    name: 'case_04_type1_small',
    fileCount: 17,
    description: '按每组个数分组: 小样本场景',
    suggestParams: { groupType: '1', numberPerGroup: 7 },
  },
  {
    name: 'case_05_5000_stress',
    fileCount: 5000,
    description: '5000 文件压力测试',
    suggestParams: { groupType: '1', numberPerGroup: 500 },
  },
  {
    name: 'case_06_5000_stress_b',
    fileCount: 5000,
    description: '5000 文件压力测试(第二组)',
    suggestParams: { groupType: '0', phoneNum: 1, size: 20, folderCount: 10 },
  },
]

const currentFilePath = fileURLToPath(import.meta.url)
const rootDir = path.dirname(currentFilePath)
const outputDir = path.join(rootDir, 'generated-cases')
const intervalSeconds = 10

if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true })
}
fs.mkdirSync(outputDir, { recursive: true })

function createCaseFiles(folderPath: string, fileCount: number) {
  fs.mkdirSync(folderPath, { recursive: true })
  for (let i = 0; i < fileCount; i++) {
    const fileName = `${(i + 1).toString().padStart(4, '0')}.txt`
    const filePath = path.join(folderPath, fileName)
    fs.writeFileSync(filePath, `test file ${fileName}`)

    const time = new Date(Date.now() - (fileCount - i) * intervalSeconds * 1000)
    fs.utimesSync(filePath, time, time)
  }
}

for (const item of testCases) {
  const caseFolder = path.join(outputDir, item.name)
  createCaseFiles(caseFolder, item.fileCount)
}

console.log(`generated: ${outputDir}`)
for (const item of testCases) {
  const caseFolder = path.join(outputDir, item.name)
  console.log(`- ${item.name}`)
  console.log(`  path: ${caseFolder}`)
  console.log(`  files: ${item.fileCount}`)
  console.log(`  scenario: ${item.description}`)
  console.log(`  params: ${JSON.stringify(item.suggestParams)}`)
}
