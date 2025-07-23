import { dialog as j, ipcMain as g, BrowserWindow as _, app as f } from "electron";
import { fileURLToPath as y } from "node:url";
import * as s from "node:path";
import * as a from "fs";
import * as p from "path";
function T(n, o, m) {
  let l = Number(o), u = Number(m);
  const c = a.readdirSync(n).filter((e) => a.statSync(p.join(n, e)).isFile());
  c.sort(), console.log(c);
  const w = Array.from({ length: u }, () => []);
  for (let e = 0; e < c.length; e += l * u)
    for (let r = 0; r < u; r++) {
      const i = e + r * l, v = i + l;
      i < c.length && w[r].push(...c.slice(i, v));
    }
  for (let e = 0; e < w.length; e++) {
    const r = p.join(n, `group_${e + 1}`);
    a.existsSync(r) || a.mkdirSync(r);
    for (const i of w[e])
      a.copyFileSync(p.join(n, i), p.join(r, i));
  }
  return !0;
}
async function D(n) {
  const o = await j.showOpenDialog(n, {
    properties: ["openDirectory"],
    title: "请选择一个文件夹"
  });
  return o.canceled ? null : o.filePaths[0];
}
const R = s.dirname(y(import.meta.url));
process.env.APP_ROOT = s.join(R, "..");
const d = process.env.VITE_DEV_SERVER_URL, P = s.join(process.env.APP_ROOT, "dist-electron"), E = s.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = d ? s.join(process.env.APP_ROOT, "public") : E;
let t;
function h() {
  t = new _({
    icon: s.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: s.join(R, "preload.mjs")
    }
  }), t.webContents.on("did-finish-load", () => {
    t == null || t.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), d ? t.loadURL(d) : t.loadFile(s.join(E, "index.html")), (process.env.NODE_ENV === "development" || d) && t.webContents.openDevTools();
}
g.handle("select-folder", async (n) => {
  const o = _.fromWebContents(n.sender);
  return o ? await D(o) : null;
});
g.handle("group-files", async (n, o, m, l) => T(o, m, l));
f.on("window-all-closed", () => {
  process.platform !== "darwin" && (f.quit(), t = null);
});
f.on("activate", () => {
  _.getAllWindows().length === 0 && h();
});
f.whenReady().then(h);
export {
  P as MAIN_DIST,
  E as RENDERER_DIST,
  d as VITE_DEV_SERVER_URL
};
