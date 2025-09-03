import { ipcMain, BrowserWindow, screen } from "electron"
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { getWindow, saveWindow, delWindow } from "./windowProxy"
import { initWs, sendWSData } from "./wsClient"
import store from "./store"
import { getSharedState, setSharedState, updateSharedState } from './sharedState'

const onLoginOrRegister = () => {
    ipcMain.handle("onLoginOrRegister", (e, isLogin) => {
        const login_width = 375
        const login_height = 400
        const register_height = 570
        const mainWindow = getWindow("main")

        // 允许调整窗口大小
        mainWindow.setResizable(true)
        mainWindow.setMinimumSize(login_width, login_height)

        // 根据登录/注册状态调整窗口大小
        if (isLogin) {
            mainWindow.setSize(login_width, login_height)
        } else {
            mainWindow.setSize(login_width, register_height)
        }

        // 禁止用户手动调整大小
        mainWindow.setResizable(false)
    })
}
const onLoginSuccess = () => {
    ipcMain.handle("onLoginSuccess", (e, userInfo, wsUrl) => {
        const mainWindow = getWindow("main");
        const width = 720;
        const height = 480;

        // 获取主屏幕的尺寸信息
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

        // 计算窗口居中的位置
        const x = Math.floor((screenWidth - width) / 2);
        const y = Math.floor((screenHeight - height) / 2);

        // 设置窗口属性并居中
        mainWindow.setResizable(true);
        mainWindow.setSize(width, height);
        mainWindow.setMinimumSize(width, height);
        mainWindow.setPosition(x, y); // 设置窗口位置到屏幕中央
        mainWindow.setResizable(false);

        store.initUserId(userInfo.userId);
        store.setData("userInfo", userInfo);
        initWs(wsUrl + userInfo?.token);
    });
};

const onSendPeerConnection = () => {
    ipcMain.on("sendPeerConnection", (e, peerData) => {
        peerData.token = store.getData("userInfo")?.token
        sendWSData(JSON.stringify(peerData))
    })
}
const onSendGeneralMessage = () => {
    ipcMain.on("onSendGeneralMessage", (e, data) => {
        data.token = store.getData("userInfo")?.token
        sendWSData(JSON.stringify(data))
    })
}

export {
    onLoginOrRegister,
    onLoginSuccess,
    onSendPeerConnection,
    onSendGeneralMessage
}

// 会议室窗口：注册打开与控制事件
export function registerMeetingWindowHandlers() {
    // 打开会议室窗口
    ipcMain.handle('openMeetingWindow', (e, payload) => {
        const { meetingId, nickName, video } = payload || {}
        const meetingWindow = new BrowserWindow({
            width: 1278,
            height: 845,
            minWidth: 1024,
            minHeight: 640,
            show: true,
            autoHideMenuBar: true,
            frame: false,
            resizable: true,
            webPreferences: {
                preload: join(__dirname, '../preload/index.js'),
                sandbox: false,
                scrollBounce: false
            }
        })

        const idKey = `meeting-${meetingId || Date.now()}`
        saveWindow(idKey, meetingWindow)
        meetingWindow.on('closed', () => delWindow(idKey))

        const hash = `/meetingRoom/${encodeURIComponent(meetingId || '')}?nickName=${encodeURIComponent(nickName || '')}&video=${video ? '1' : '0'}`
        if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
            meetingWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/#${hash}`)
        } else {
            const fileUrl = `file://${join(__dirname, '../renderer/index.html')}#${hash}`
            meetingWindow.loadURL(fileUrl)
        }

        return { ok: true }
    })

    // 会议窗口控制：最小化、最大化、关闭
    ipcMain.on('meeting-window-control', (event, action) => {
        const bw = BrowserWindow.fromWebContents(event.sender)
        if (!bw) return
        switch (action) {
            case 'minimize':
                bw.minimize();
                break;
            case 'maximize':
                if (bw.isMaximized()) bw.unmaximize(); else bw.maximize();
                break;
            case 'close':
                bw.close();
                break;
        }
    })

    // 全局状态：获取/设置/合并更新
    ipcMain.handle('shared:get', () => getSharedState())
    ipcMain.handle('shared:set', (_e, next) => setSharedState(next))
    ipcMain.handle('shared:update', (_e, patch) => updateSharedState(patch))
}