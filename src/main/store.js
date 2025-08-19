// 兼容 electron-store ESM/CJS 导出
// 在 CJS 场景下 require('electron-store') 可能返回 { default: Store }
// 在 ESM 场景下 import 默认导出直接是 Store
// 这里统一做一次 default 回退，避免 “Store is not a constructor”
// 注意：保持与现有导出风格一致（下方仍然使用 export default 导出 API 对象）
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ElectronStoreModule = require("electron-store")
const Store = ElectronStoreModule?.default ?? ElectronStoreModule
const store = new Store()
let userId = null
const initUserId = (_userId)=>{
    userId = _userId
}

const setData = (key,value)=>{
    store.set(userId+key,value)
}

const getData = (key)=>{
    return store.get(userId+key)
}

const getUserId = ()=>{
    return userId
}

export default {
    initUserId,
    setData,
    getData,
    getUserId
}