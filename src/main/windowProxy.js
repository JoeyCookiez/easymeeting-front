const windowMange = {}
const saveWindow = (id,window)=>{
    windowMange[id] = window
}

const getWindow = (id)=>{
    return windowMange[id]
}

const delWindow = (id)=>{
    delete windowMange[id]
}

const getWindowMange = ()=>{
    return windowMange
}

// 添加获取主窗口的方法
const getMainWindow = () => {
    return windowMange["main"]
}

export {
    saveWindow,
    getWindow,
    delWindow,
    getWindowMange,
    getMainWindow
}