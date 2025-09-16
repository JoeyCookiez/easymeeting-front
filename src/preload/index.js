import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  openMeetingWindow: (payload) => ipcRenderer.invoke('openMeetingWindow', payload),
  meetingWindowControl: (action) => ipcRenderer.send('meeting-window-control', action),
  createScreenShareTipbar: (payload) => ipcRenderer.invoke('createScreenShareTipbar', payload),
  closeScreenShareTipbar: () => ipcRenderer.invoke('closeScreenShareTipbar'),
  updateTipbarState: (state) => ipcRenderer.invoke('updateTipbarState', state),
  getScreenSources: () => ipcRenderer.invoke('getScreenSources'),
  setScreenShareSource: (sourceId) => ipcRenderer.invoke('setScreenShareSource', sourceId),
  hideMeetingWindow: () => ipcRenderer.invoke('hideMeetingWindow'),
  showMeetingWindow: () => ipcRenderer.invoke('showMeetingWindow')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    // 共享状态：renderer 通过 invoke 与主进程交互
    contextBridge.exposeInMainWorld('shared', {
      get: () => ipcRenderer.invoke('shared:get'),
      set: (next) => ipcRenderer.invoke('shared:set', next),
      update: (patch) => ipcRenderer.invoke('shared:update', patch)
    })
    contextBridge.exposeInMainWorld('electronAPI', {
      // 监听WebSocket消息
      onWsMessage: (callback) => ipcRenderer.on("ws-message", (event,data)=>callback(data)),
      // 渲染进程间传递消息
      onTunnelMessage:(callback) => ipcRenderer.on("tunnel-message",(e,data)=>callback(data)),
      sendTunnelMessage:(data)=>ipcRenderer.invoke("onSendTunnelMessage",data),
      getGlobalData:()=> global.globalData,
      setGlobalData:(data) =>{global.globalData = data},
      showChatRoom:(data)=>ipcRenderer.invoke("onShowChatRoom", data),
      minimize:()=> ipcRenderer.send("window-minimize"),
      maximize:()=> ipcRenderer.send("window-maximize"),
      close:()=> ipcRenderer.send("window-close")
    });
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    invoke: (channel, data) => ipcRenderer.invoke(channel, data)
  },

});

