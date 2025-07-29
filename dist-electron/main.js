import { shell, dialog, ipcMain, BrowserWindow, app } from "electron";
import { fileURLToPath } from "node:url";
import * as path$1 from "node:path";
import * as fs from "fs";
import * as path from "path";
function groupFiles(folderPath, step, folderCount) {
  const newStep = Number(step);
  const newFolderCount = Number(folderCount);
  const allFiles = fs.readdirSync(folderPath).filter((f) => fs.statSync(path.join(folderPath, f)).isFile()).map((f) => ({
    name: f,
    fullPath: path.join(folderPath, f),
    birth: fs.statSync(path.join(folderPath, f)).birthtime.getTime()
  })).sort((a, b) => a.birth - b.birth);
  const groups = Array.from({ length: newFolderCount }, () => []);
  for (let i = 0; i < allFiles.length; i += newStep * newFolderCount) {
    for (let group = 0; group < newFolderCount; group++) {
      const start = i + group * newStep;
      const end = start + newStep;
      if (start < allFiles.length) {
        groups[group].push(...allFiles.slice(start, end));
      }
    }
  }
  for (let i = 0; i < groups.length; i++) {
    const targetDir = path.join(folderPath, `group_${i + 1}`);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir);
    for (const file of groups[i]) {
      const targetPath = path.join(targetDir, file.name);
      fs.copyFileSync(file.fullPath, targetPath);
    }
  }
  for (const file of allFiles) {
    fs.unlinkSync(file.fullPath);
  }
  shell.openPath(folderPath);
  return true;
}
async function selectFolder(win2) {
  const result = await dialog.showOpenDialog(win2, {
    properties: ["openDirectory"],
    title: "请选择一个文件夹"
  });
  return result.canceled ? null : result.filePaths[0];
}
const __dirname = path$1.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path$1.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path$1.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path$1.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path$1.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    title: "文件分组工具",
    width: 1e3,
    height: 800,
    icon: path$1.join(process.env.VITE_PUBLIC, "icon.ico"),
    webPreferences: {
      preload: path$1.join(__dirname, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path$1.join(RENDERER_DIST, "index.html"));
  }
  if (process.env.NODE_ENV === "development" || VITE_DEV_SERVER_URL) {
    win.webContents.openDevTools();
  }
}
ipcMain.handle("select-folder", async (event) => {
  const win2 = BrowserWindow.fromWebContents(event.sender);
  if (!win2) return null;
  return await selectFolder(win2);
});
ipcMain.handle("group-files", async (_, folderPath, step, folderCount) => {
  return groupFiles(folderPath, step, folderCount);
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
