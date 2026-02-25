/// <reference types="vite-plugin-electron/electron-env" />
// import type { groupFilesType } from './utils/type'

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}
type GroupFilesParams = {
  folderPath: string
  groupType: string
  step: string
  folderCount: string
  numberPerGroup: string
}
interface ElectronAPI {
  selectFolder: () => Promise<any>
  groupFiles: (params: GroupFilesParams) => Promise<any>
}
// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import('electron').IpcRenderer
  electronAPI: ElectronAPI
}
