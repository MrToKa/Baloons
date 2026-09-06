const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");
const { fileURLToPath } = require("node:url");

const APP_ID = "com.baloons.typinggame";
const DIST_DIRECTORY = path.resolve(__dirname, "..", "dist");
const IS_SMOKE_TEST = process.env.BALOONS_SMOKE_TEST === "1";
let mainWindow;

app.setAppUserModelId(APP_ID);

function isLocalAppUrl(url) {
  try {
    if (new URL(url).protocol !== "file:") return false;

    const localPath = path.resolve(fileURLToPath(url));
    const relativePath = path.relative(DIST_DIRECTORY, localPath);

    return (
      relativePath === "" ||
      (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
    );
  } catch {
    return false;
  }
}

function openExternalUrl(url) {
  try {
    const protocol = new URL(url).protocol;
    if (protocol === "https:" || protocol === "http:") {
      void shell.openExternal(url);
    }
  } catch {
    // Ignore malformed URLs.
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: "#101426",
    autoHideMenuBar: true,
    show: false,
    title: "Baloons",
    icon: path.join(__dirname, "..", "build", "icon.svg"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: !app.isPackaged,
    },
  });

  mainWindow.once("ready-to-show", () => {
    if (!IS_SMOKE_TEST) mainWindow.show();
  });

  if (IS_SMOKE_TEST) {
    mainWindow.webContents.once("did-finish-load", () => {
      console.log("Baloons desktop smoke test passed.");
      app.quit();
    });
  }

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (isLocalAppUrl(url)) return;

    event.preventDefault();
    openExternalUrl(url);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternalUrl(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && input.key === "F11") {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = undefined;
  });

  void mainWindow.loadFile(path.join(DIST_DIRECTORY, "index.html"));
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
