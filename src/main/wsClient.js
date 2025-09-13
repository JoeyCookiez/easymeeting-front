import WebSocket from "ws";
import { getMainWindow, getWindow, getWindowMange } from "./windowProxy";
import { updateSharedState } from "./sharedState";

let ws = null
const maxRetries = 50
let retryCount = 0
const HEARTBASET_INTERVAL = 5000
const retryInterval = 1000
let heartBeatTimer = null
let wsUrl = null
let needReconnect = false
let memberList = []
const initWs = (_wsUrl) => {
    wsUrl = _wsUrl
    needReconnect = true
    connectWs()
}

const wsCheck = () => {
    return import.meta.env.VITE_WS_CHECK === "true"
}

const connectWs = () => {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        console.log("已经连接上")
        return
    }
    console.log(`尝试连接...重试次数:${retryCount}/${maxRetries},连接地址:${wsUrl}`)
    ws = new WebSocket(wsUrl)
    ws.onopen = () => {
        if (retryCount > 0 && wsCheck()) {
            const mainWindow = getWindow("main")
            mainWindow?.webContents?.send("reconnect", true)
        }
        retryCount = 0
        console.log("websocket连接成功")
        startHeartBeat()
    }

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        // console.log("收到消息:", data)
        const { messageType, messageContent } = data
        
        // 向所有窗口广播消息（包括主窗口和会议室窗口）
        const windows = getWindowMange()
        for (const key in windows) {
            try {
                windows[key]?.webContents?.send("ws-message", data)
            } catch (e) {
                console.log(`向窗口 ${key} 发送消息失败:`, e.message)
            }
        }
        
        switch (messageType) {
            case 1:
                // 加入会议情况
                const { meetingMemberList } = messageContent
                updateSharedState({
                    memberList: meetingMemberList
                })
                break
            default:
                break
        }
    }
    ws.onerror = () => {
        try { ws?.close() } catch { }
    }

    ws.onclose = () => {
        clearHeartBeatTimers()
        handlerReconnect()
    }
}

const startHeartBeat = () => {
    clearHeartBeatTimers()
    heartBeatTimer = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send("ping")
        }
    }, HEARTBASET_INTERVAL)
}

const clearHeartBeatTimers = () => {
    if (heartBeatTimer) {
        clearInterval(heartBeatTimer)
        heartBeatTimer = null
    }
}

const handlerReconnect = () => {
    if (!needReconnect) {
        return
    }
    if (retryCount >= maxRetries) {
        console.log("已经到达最大重试次数，停止重试")
        retryCount = 0
        if (wsCheck()) {
            logout(false)
        }
        return
    }
    retryCount += 1
    const delay = retryInterval * Math.pow(1.5, retryCount - 1)
    console.log(`连接断开，等待${delay / 1000}秒后重试`)
    if (wsCheck()) {
        const mainWindow = getWindow("main")
        mainWindow?.webContents?.send("reconnect", false)
    }
    setTimeout(() => {
        connectWs()
    }, delay)
}

const logout = (closeWs = true) => {
    const login_width = 375
    const login_height = 400
    const mainWindow = getWindow("main")
    // 允许调整窗口大小
    mainWindow.setResizable(true)
    mainWindow.setMinimumSize(login_width, login_height)
    // 根据登录/注册状态调整窗口大小
    mainWindow.setSize(login_width, login_height)
    // 禁止用户手动调整大小
    mainWindow.setResizable(false)
    if (closeWs) {
        needReconnect = false
        try { ws?.close() } catch { }
    }
    const windows = getWindowMange()
    for (let winKey in windows) {
        const win = windows[winKey]
        if (winKey !== "main") {
            win.close()
        }
    }
    mainWindow.webContents.send("logout")
}

const sendWSData = (data) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        return
    }
    ws.send(data)
}

export {
    initWs,
    logout,
    sendWSData,
}