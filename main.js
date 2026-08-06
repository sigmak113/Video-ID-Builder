const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { execFile } = require("child_process");
const ffmpegPath = require("ffmpeg-static");

function createWindow() {
  const win = new BrowserWindow({
    width: 780,
    height: 580,
    minWidth: 560,
    minHeight: 540,
    backgroundColor: "#14151a",
    autoHideMenuBar: true,
    title: "영상 ID 생성기",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ---------- 영상 파일에 ID를 메타데이터로 기록 ----------
const VIDEO_EXT = new Set([".mp4", ".mov", ".m4v", ".mkv", ".webm"]);

ipcMain.handle("embed-id", async (event, filePath, videoId) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return { success: false, error: "파일을 찾을 수 없습니다." };
    }
    const ext = path.extname(filePath).toLowerCase();
    if (!VIDEO_EXT.has(ext)) {
      return { success: false, error: `지원하지 않는 형식입니다 (${ext}). mp4/mov/mkv/webm만 가능합니다.` };
    }

    const dir = path.dirname(filePath);
    const base = path.basename(filePath, ext);
    const tempOutput = path.join(dir, `${base}.__idtag_tmp__${ext}`);
    const backupPath = path.join(dir, `${base}.__idtag_backup__${ext}`);

    // 임시 파일 정리 (혹시 이전 실패로 남아있는 경우 대비)
    [tempOutput, backupPath].forEach(p => { if (fs.existsSync(p)) fs.unlinkSync(p); });

    await new Promise((resolve, reject) => {
      execFile(
        ffmpegPath,
        ["-y", "-i", filePath, "-metadata", `comment=${videoId}`, "-codec", "copy", tempOutput],
        (error, stdout, stderr) => {
          if (error) reject(new Error(stderr || error.message));
          else resolve();
        }
      );
    });

    // 원본을 백업으로 옮기고, 새 파일을 원래 이름 자리에 넣는다 (파일명 그대로 유지)
    fs.renameSync(filePath, backupPath);
    try {
      fs.renameSync(tempOutput, filePath);
    } catch (renameErr) {
      // 실패 시 원본 복구
      fs.renameSync(backupPath, filePath);
      throw renameErr;
    }
    fs.unlinkSync(backupPath);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
});

ipcMain.handle("get-ffmpeg-path", () => ffmpegPath);

ipcMain.handle("read-id", async (event, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return { success: false, error: "파일을 찾을 수 없습니다." };
    }
    const stderrText = await new Promise((resolve) => {
      // ffmpeg -i 만 실행하면 출력 파일이 없어 에러로 끝나지만,
      // 그 전에 메타데이터를 stderr로 먼저 출력하므로 그걸 그대로 읽는다.
      execFile(ffmpegPath, ["-i", filePath], (error, stdout, stderr) => {
        resolve(stderr || "");
      });
    });
    const match = stderrText.match(/comment\s*:\s*(.+)/i);
    return { success: true, id: match ? match[1].trim() : null };
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
});

