import { ipcMain } from "electron"
import { getWindow } from "./windowProxy"

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
    ipcMain.handle("onLoginSuccess", (e) => {
        const mainWindow = getWindow("main")
        const width = 800
        const height = 600
        mainWindow.setSize(width, height)
        mainWindow.setMinimumSize(width, height)
        mainWindow.setResizable(true)
    })
}

export {
    onLoginOrRegister,
    onLoginSuccess
}