import { ipcMain, BrowserWindow, screen, session, desktopCapturer } from "electron"
import { dialog } from 'electron'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { getWindow, saveWindow, delWindow, getWindowMange } from "./windowProxy"
import { initWs, sendWSData } from "./wsClient"
import store from "./store"
import { getSharedState, setSharedState, updateSharedState } from './sharedState'
import { appConfig } from "./config"

const onLoginOrRegister = () => {
    ipcMain.handle("onLoginOrRegister", (e, isLogin) => {
        const login_width = appConfig.LOGIN_INIT_WIDTH
        const login_height = appConfig.LOGIN_INIT_HEIGHT
        const register_height = appConfig.REIGISTER_INIT_HEIGHT
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
const onShowJoinMeetingWindow = () => {
    ipcMain.handle("onShowJoinMeetingWindow", (e, payload) => {
        const { nickName } = payload || {}
        // 如果已存在窗口，则只显示并聚焦
        const existing = getWindow("joinMeeting")
        if (existing && !existing.isDestroyed()) {
            if (existing.isMinimized()) existing.restore()
            existing.show()
            existing.focus()
            return { ok: true, reused: true, id: existing.id }
        }

        const joinMeetingWindow = new BrowserWindow({
            width: appConfig.JOINMEETING_INIT_WIDTH,
            height: appConfig.JOINMEETING_INIT_HEIGHT,
            useContentSize: true, // 设置内容区域尺寸
            show: true,
            autoHideMenuBar: true,
            frame: false,
            resizable: false,
            transparent: true,
            webPreferences: {
                preload: join(__dirname, '../preload/index.js'),
                sandbox: false,
                scrollBounce: false,
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                webSecurity: true
            }
        })
        // 注册窗口
        saveWindow("joinMeeting", joinMeetingWindow)
        joinMeetingWindow.once("closed", () => { delWindow("joinMeeting") })
        // 窗口自动居中
        joinMeetingWindow.center()
        // 窗口加载路由页面
        const hash = `/joinMeeting/?nickName=${encodeURIComponent(nickName || '')}`
        if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
            joinMeetingWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/#${hash}`)
        } else {
            const fileUrl = `file://${join(__dirname, '../renderer/index.html')}#${hash}`
            joinMeetingWindow.loadURL(fileUrl)
        }
        return { ok: true, reused: false, id: joinMeetingWindow.id }
    })
}

const onLoginSuccess = () => {
    ipcMain.handle("onLoginSuccess", (e, userInfo, wsUrl) => {
        const mainWindow = getWindow("main");
        const width = appConfig.HOME_INIT_WIDTH;
        const height = appConfig.HOME_INIT_HEIGHT;

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

// 添加获取窗口信息的IPC处理器
const onGetWindow = () => {
    ipcMain.handle("getWindow", (e, windowId) => {
        const window = getWindow(windowId)
        if (window && !window.isDestroyed()) {
            return {
                id: window.id,
                isVisible: window.isVisible(),
                isMinimized: window.isMinimized(),
                isMaximized: window.isMaximized(),
                isFocused: window.isFocused(),
                exists: true
            }
        }
        return { exists: false }
    })
}

// 添加窗口操作处理器
const onWindowOperation = () => {
    ipcMain.handle("windowOperation", (e, windowId, operation) => {
        const window = getWindow(windowId)
        if (!window || window.isDestroyed()) {
            return { success: false, message: '窗口不存在' }
        }
        
        try {
            switch (operation) {
                case 'show':
                    window.show()
                    window.focus()
                    break
                case 'hide':
                    window.hide()
                    break
                case 'minimize':
                    window.minimize()
                    break
                case 'restore':
                    window.restore()
                    break
                case 'maximize':
                    window.maximize()
                    break
                case 'unmaximize':
                    window.unmaximize()
                    break
                case 'close':
                    window.close()
                    break
                default:
                    return { success: false, message: '未知操作' }
            }
            return { success: true }
        } catch (error) {
            return { success: false, message: error.message }
        }
    })
}

const onGetWindowManage = () => {
    ipcMain.handle("getWindowManage", () => {
        const windowManage = getWindowMange()
        // 只返回窗口的基本信息，不返回整个BrowserWindow对象
        const result = {}
        for (const [key, window] of Object.entries(windowManage)) {
            if (window && !window.isDestroyed()) {
                result[key] = {
                    id: window.id,
                    isVisible: window.isVisible(),
                    isMinimized: window.isMinimized(),
                    isMaximized: window.isMaximized(),
                    isFocused: window.isFocused()
                }
            }
        }
        return result
    })
}
const onShowChatRoom = ()=>{
    ipcMain.handle("onShowChatRoom",async(event,data)=>{
        console.log("showChatRoom",data)
        const win = BrowserWindow.fromWebContents(event.sender)
        win.setResizable(true)
        if(data?.show){
            win.setSize(appConfig.MEETINGROOM_CHAT_WIDTH,appConfig.MEETINGROOM_INIT_HEIGHT)
        }else{
            win.setSize(appConfig.MEETINGROOM_INIT_WIDTH,appConfig.MEETINGROOM_INIT_HEIGHT)
        }
        
    })
}
const onSendTunnelMessage = ()=>{
    ipcMain.handle("onSendTunnelMessage",(event,message)=>{
        const {winKey,data} = message
        console.log(message)
        const win = getWindow(winKey)
        win?.webContents?.send("tunnel-message",data)
    })
}


export {
    onLoginOrRegister,
    onLoginSuccess,
    onSendPeerConnection,
    onSendGeneralMessage,
    onShowJoinMeetingWindow,
    onGetWindow,
    onGetWindowManage,
    onWindowOperation,
    onShowChatRoom,
    onSendTunnelMessage
}

// 会议室窗口：注册打开与控制事件
export function registerMeetingWindowHandlers() {
    // 打开会议室窗口
    ipcMain.handle('openMeetingWindow', (e, payload) => {
        const { meetingNo,nickName, video, micro } = payload || {}
        const meetingWindow = new BrowserWindow({
            width: appConfig.MEETINGROOM_INIT_WIDTH,
            height: appConfig.MEETINGROOM_INIT_HEIGHT,
            useContentSize: true, // 设置内容区域尺寸
            // minWidth: 1024,
            // minHeight: 640,
            show: true,
            autoHideMenuBar: true,
            frame: false,
            resizable: true,
            transparent: true,
            webPreferences: {
                preload: join(__dirname, '../preload/index.js'),
                sandbox: false,
                scrollBounce: false,
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                webSecurity: true
            }
        })

        const idKey = `meeting-${meetingNo || Date.now()}`
        saveWindow(idKey, meetingWindow)
        meetingWindow.on('closed', () => delWindow(idKey))

        // 为会议窗口设置屏幕捕获权限
        meetingWindow.webContents.session.setDisplayMediaRequestHandler((request, callback) => {
            desktopCapturer.getSources({ types: ['screen', 'window'] }).then((sources) => {
                // 如果有选中的源，使用选中的源；否则使用第一个源
                const selectedSource = global.selectedScreenShareSource
                    ? sources.find(source => source.id === global.selectedScreenShareSource)
                    : sources[0]

                if (selectedSource) {
                    console.log('使用选中的屏幕源:', selectedSource.name)
                    callback({ video: selectedSource, audio: 'loopback' })
                } else {
                    console.log('使用默认屏幕源:', sources[0].name)
                    callback({ video: sources[0], audio: 'loopback' })
                }
            }).catch((error) => {
                console.error('获取屏幕源失败:', error)
                callback({ video: sources[0], audio: 'loopback' })
            })
        }, { useSystemPicker: false })

        const hash = `/meetingRoom/meetingNo=${encodeURIComponent(meetingNo || '')}?nickName=${encodeURIComponent(nickName || '')}&video=${video ==='1' ? '1' : '0'}&micro=${micro === '1' ? '1':'0'}`
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

    // 获取屏幕和窗口源
    ipcMain.handle('getScreenSources', async () => {
        try {
            const sources = await desktopCapturer.getSources({
                types: ['screen', 'window'],
                thumbnailSize: { width: 200, height: 120 },
                fetchWindowIcons: true
            })

            console.log('获取到的原始源数量:', sources.length)
            sources.forEach(source => {
                console.log('源信息:', {
                    id: source.id,
                    name: source.name,
                    type: source.id.startsWith('screen:') ? 'screen' : 'window'
                })
            })

            return sources.map(source => ({
                id: source.id,
                name: source.name,
                type: source.id.startsWith('screen:') ? 'screen' : 'window',
                thumbnail: source.thumbnail.toDataURL(),
                appIcon: source.appIcon ? source.appIcon.toDataURL() : null
            }))
        } catch (error) {
            console.error('获取屏幕源失败:', error)
            return []
        }
    })

    // 设置屏幕共享源
    ipcMain.handle('setScreenShareSource', async (event, sourceId) => {
        try {
            console.log('设置屏幕共享源:', sourceId)
            // 这里我们存储选中的源ID，供setDisplayMediaRequestHandler使用
            global.selectedScreenShareSource = sourceId
            return { success: true }
        } catch (error) {
            console.error('设置屏幕共享源失败:', error)
            return { success: false, error: error.message }
        }
    })

    // 创建屏幕共享tipbar窗口
    ipcMain.handle('createScreenShareTipbar', async (event, payload) => {
        try {
            const { meetingId, nickName, isMuted, cameraOn, recording, sourceInfo } = payload || {}

            // 检查是否已经存在tipbar窗口
            const existingTipbar = getWindow('screen-share-tipbar')
            if (existingTipbar) {
                existingTipbar.close()
            }

            const tipbarWindow = new BrowserWindow({
                width: 1200,
                height: 200,
                minWidth: 800,
                minHeight: 120,
                show: false, // 先不显示，等加载完成后再显示
                frame: false,
                resizable: false,
                alwaysOnTop: true, // 始终在顶部
                skipTaskbar: true, // 不在任务栏显示
                transparent: true, // 透明背景
                webPreferences: {
                    preload: join(__dirname, '../preload/index.js'),
                    sandbox: false,
                    nodeIntegration: false,
                    contextIsolation: true,
                    enableRemoteModule: false,
                    webSecurity: true
                }
            })

            // 设置窗口位置到屏幕顶部
            const primaryDisplay = screen.getPrimaryDisplay()
            const { width: screenWidth } = primaryDisplay.workAreaSize
            const windowWidth = 1200
            const x = Math.floor((screenWidth - windowWidth) / 2)
            tipbarWindow.setPosition(x, 0)

            const idKey = 'screen-share-tipbar'
            saveWindow(idKey, tipbarWindow)
            tipbarWindow.on('closed', () => delWindow(idKey))

            const hash = `/screenShareTipbar/${encodeURIComponent(meetingId || '')}?nickName=${encodeURIComponent(nickName || '')}&isMuted=${isMuted ? '1' : '0'}&cameraOn=${cameraOn ? '1' : '0'}&recording=${recording ? '1' : '0'}&sourceType=${sourceInfo?.type || 'screen'}&sourceName=${encodeURIComponent(sourceInfo?.name || '')}`

            if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
                tipbarWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/#${hash}`)
            } else {
                const fileUrl = `file://${join(__dirname, '../renderer/index.html')}#${hash}`
                tipbarWindow.loadURL(fileUrl)
            }

            // 窗口加载完成后显示
            tipbarWindow.once('ready-to-show', () => {
                tipbarWindow.show()
                tipbarWindow.focus()
            })

            return { ok: true, windowId: tipbarWindow.id }
        } catch (error) {
            console.error('创建屏幕共享tipbar窗口失败:', error)
            return { ok: false, error: error.message }
        }
    })

    // 隐藏会议室窗口
    ipcMain.handle('hideMeetingWindow', async (event) => {
        try {
            const meetingWindow = BrowserWindow.fromWebContents(event.sender)
            if (meetingWindow) {
                meetingWindow.hide()
                return { success: true }
            }
            return { success: false, message: '会议室窗口不存在' }
        } catch (error) {
            console.error('隐藏会议室窗口失败:', error)
            return { success: false, error: error.message }
        }
    })

    // 显示会议室窗口
    ipcMain.handle('showMeetingWindow', async (event) => {
        try {
            const meetingWindow = BrowserWindow.fromWebContents(event.sender)
            if (meetingWindow) {
                meetingWindow.show()
                meetingWindow.focus()
                return { success: true }
            }
            return { success: false, message: '会议室窗口不存在' }
        } catch (error) {
            console.error('显示会议室窗口失败:', error)
            return { success: false, error: error.message }
        }
    })

    // 关闭屏幕共享tipbar窗口
    ipcMain.handle('closeScreenShareTipbar', async () => {
        try {
            const tipbarWindow = getWindow('screen-share-tipbar')
            if (tipbarWindow) {
                tipbarWindow.close()
                return { success: true }
            }
            return { success: false, message: 'Tipbar窗口不存在' }
        } catch (error) {
            console.error('关闭屏幕共享tipbar窗口失败:', error)
            return { success: false, error: error.message }
        }
    })

    // 更新tipbar状态
    ipcMain.handle('updateTipbarState', async (event, state) => {
        try {
            const tipbarWindow = getWindow('screen-share-tipbar')
            if (tipbarWindow) {
                tipbarWindow.webContents.send('update-tipbar-state', state)
                return { success: true }
            }
            return { success: false, message: 'Tipbar窗口不存在' }
        } catch (error) {
            console.error('更新tipbar状态失败:', error)
            return { success: false, error: error.message }
        }
    })

    // 转发 tipbar 动作到会议窗口（用于在tipbar点击“结束共享”等时，控制会议窗口）
    ipcMain.on('tipbar-action', (event, actionPayload) => {
        try {
            const senderWin = BrowserWindow.fromWebContents(event.sender)
            // 广播到除发送者外的所有窗口（会议室窗口会监听该事件）
            BrowserWindow.getAllWindows().forEach((win) => {
                if (win && win !== senderWin && !win.isDestroyed()) {
                    win.webContents.send('tipbar-action', actionPayload)
                }
            })
        } catch (error) {
            console.error('转发 tipbar-action 失败:', error)
        }
    })

    // 保存录制的二进制缓冲区为文件（webm 或 mp4）
    ipcMain.handle('saveRecordingBuffer', async (event, payload) => {
        try {
            const { buffer, defaultFileName, extension } = payload || {}
            const bw = BrowserWindow.fromWebContents(event.sender)
            const { canceled, filePath } = await dialog.showSaveDialog(bw, {
                title: '保存录制文件',
                defaultPath: `${defaultFileName || 'meeting-record'}.${extension || 'webm'}`,
                filters: [
                    { name: 'MP4', extensions: ['mp4'] },
                    { name: 'WebM', extensions: ['webm'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            })
            if (canceled || !filePath) return { success: false, canceled: true }
            await writeFile(filePath, Buffer.from(buffer))
            return { success: true, filePath }
        } catch (error) {
            console.error('保存录制文件失败:', error)
            return { success: false, error: error.message }
        }
    })
}