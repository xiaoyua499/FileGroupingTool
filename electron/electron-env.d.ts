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
type groupFilesType = [olderPath: string, step: string, folderCount: string]
interface ElectronAPI {
  selectFolder: () => Promise<any>
  groupFiles: (...args: groupFilesType) => Promise<any>
}
// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import('electron').IpcRenderer
  electronAPI: ElectronAPI
}
