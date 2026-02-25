export interface GroupFilesParams {
  folderPath: string
  groupType: string
  step: string
  folderCount: string
  numberPerGroup: string
}

export type GroupProgressStatus = 'processing' | 'success' | 'error'

export interface GroupProgressPayload {
  percent: number
  status: GroupProgressStatus
  text: string
}
