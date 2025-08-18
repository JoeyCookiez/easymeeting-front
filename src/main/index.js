import { app, shell, BrowserWindow, ipcMain, dialog, Tray, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { saveWindow,getMainWindow } from './windowProxy'
import { onLoginOrRegister } from './ipc'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 375,
    height: 400,
    show: false,
    autoHideMenuBar: true,
    resizable: false,
    transparent: true,
    frame: false,
    transparent: true,
    maximizable: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      scrollBounce: false
    }
  })

  saveWindow("main",mainWindow)
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}
onLoginOrRegister()
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
// 添加以下IPC监听
ipcMain.on('minimize-window', () => {
  const mainWindow = getMainWindow(); // 获取主窗口实例
  if (mainWindow) {
    mainWindow.minimize();
  }
});

// 添加全局变量
let tray = null;

// 修改关闭对话框的处理
ipcMain.on('show-close-dialog', () => {
  const mainWindow = getMainWindow();
  if (mainWindow) {
    dialog.showMessageBox({
      type: 'question',
      buttons: ['最小化到托盘', '直接退出'],
      message: '确定要退出吗?',
      detail: '选择最小化到托盘可以保持程序在后台运行'
    }).then(({ response }) => {
      if (response === 0) {
        // 隐藏窗口而不是最小化
        mainWindow.hide();
        // 创建托盘图标
        createTray();
      } else {
        app.quit();
      }
    });
  }
});

function createTray() {
  // 如果托盘已存在，则不重复创建
  if (tray) return;
  
  tray = new Tray(join(__dirname, '../../resources/icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        const mainWindow = getMainWindow();
        if (mainWindow) {
          mainWindow.show();
        }
      }
    },
    {
      label: '退出',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('EasyMeeting');
  tray.setContextMenu(contextMenu);
  
  // 点击托盘图标显示窗口
  tray.on('click', () => {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.show();
    }
  });
}

// 在应用退出时销毁托盘
app.on('before-quit', () => {
  if (tray) {
    tray.destroy();
    tray = null;
  }
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
