import { shell, dialog, ipcMain, BrowserWindow, app } from "electron";
import { fileURLToPath } from "node:url";
import * as path$1 from "node:path";
import * as fs from "fs";
import * as path from "path";
function getSortedFiles(folderPath) {
  return fs.readdirSync(folderPath).filter((f) => fs.statSync(path.join(folderPath, f)).isFile()).map((f) => ({
    name: f,
    fullPath: path.join(folderPath, f),
    birth: fs.statSync(path.join(folderPath, f)).birthtime.getTime()
  })).sort((a, b) => a.birth - b.birth);
}
function groupByStepAndFolderCount(allFiles, step, folderCount) {
  const groups = Array.from({ length: folderCount }, () => []);
  for (let i = 0; i < allFiles.length; i += step * folderCount) {
    for (let group = 0; group < folderCount; group++) {
      const start = i + group * step;
      const end = start + step;
      if (start < allFiles.length) {
        groups[group].push(...allFiles.slice(start, end));
      }
    }
  }
  return groups;
}
function groupByNumberPerGroup(allFiles, numberPerGroup) {
  const groups = [];
  for (let i = 0; i < allFiles.length; i += numberPerGroup) {
    groups.push(allFiles.slice(i, i + numberPerGroup));
  }
  return groups;
}
function groupFiles(params, onProgress) {
  const { folderPath, groupType, step, folderCount, numberPerGroup } = params;
  const allFiles = getSortedFiles(folderPath);
  let groups = [];
  let processedSteps = 0;
  let lastPercent = -1;
  const totalSteps = Math.max(allFiles.length * 2, 1);
  const emitProgress = (status, text, force = false) => {
    const percent = Math.min(100, Math.floor(processedSteps / totalSteps * 100));
    if (force || percent !== lastPercent) {
      lastPercent = percent;
      onProgress == null ? void 0 : onProgress({ percent, status, text });
    }
  };
  try {
    emitProgress("processing", "分组中: 0%", true);
    if (groupType === "1") {
      groups = groupByNumberPerGroup(allFiles, Number(numberPerGroup));
    } else {
      groups = groupByStepAndFolderCount(allFiles, Number(step), Number(folderCount));
    }
    for (let i = 0; i < groups.length; i++) {
      const targetDir = path.join(folderPath, `group_${i + 1}`);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir);
      for (const file of groups[i]) {
        const targetPath = path.join(targetDir, file.name);
        fs.copyFileSync(file.fullPath, targetPath);
        processedSteps += 1;
        emitProgress("processing", `分组中: ${Math.floor(processedSteps / totalSteps * 100)}%`);
      }
    }
    for (const file of allFiles) {
      fs.unlinkSync(file.fullPath);
      processedSteps += 1;
      emitProgress("processing", `分组中: ${Math.floor(processedSteps / totalSteps * 100)}%`);
    }
    emitProgress("success", "分组完成", true);
    shell.openPath(folderPath);
    return true;
  } catch (error) {
    emitProgress("error", "分组失败", true);
    throw error;
  }
}
async function selectFolder(win2) {
  const result = await dialog.showOpenDialog(win2, {
    properties: ["openDirectory"],
    title: "请选择一个文件夹"
  });
  return result.canceled ? null : result.filePaths[0];
}
const __dirname$1 = path$1.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path$1.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path$1.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path$1.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path$1.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    title: "文件分组工具",
    width: 600,
    height: 700,
    icon: path$1.join(process.env.VITE_PUBLIC, "icon.ico"),
    webPreferences: {
      preload: path$1.join(__dirname$1, "preload.mjs")
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
ipcMain.handle("group-files", async (event, params) => {
  return groupFiles(params, (payload) => {
    event.sender.send("group-files-progress", payload);
  });
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
