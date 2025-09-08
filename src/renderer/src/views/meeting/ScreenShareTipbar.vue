<template>
  <div class="tipbar-page">
    <ScreenShareTipbar
      :visible="true"
      :is-muted="isMuted"
      :camera-on="cameraOn"
      :recording="recording"
      :source-type="sourceType"
      :source-name="sourceName"
      @stop-sharing="handleStopSharing"
      @toggle-mute="handleToggleMute"
      @toggle-camera="handleToggleCamera"
      @toggle-members="handleToggleMembers"
      @toggle-chat="handleToggleChat"
      @toggle-record="handleToggleRecord"
      @share-screen="handleShareScreen"
      @end-meeting="handleEndMeeting"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import ScreenShareTipbar from '../../components/ScreenShareTipbar.vue'

const route = useRoute()
const meetingId = route.params.meetingId
const nickName = route.query.nickName || ''
const isMuted = ref(route.query.isMuted === '1')
const cameraOn = ref(route.query.cameraOn === '1')
const recording = ref(route.query.recording === '1')
const sourceType = route.query.sourceType || 'screen'
const sourceName = route.query.sourceName || ''

// 处理停止共享
const handleStopSharing = async () => {
  try {
    // 通知主窗口停止屏幕共享
    await window.electron.ipcRenderer.invoke('closeScreenShareTipbar')
    
    // 发送消息给主窗口
    window.electron.ipcRenderer.send('tipbar-action', {
      action: 'stop-sharing'
    })
    
    ElMessage.success('屏幕共享已停止')
  } catch (error) {
    console.error('停止屏幕共享失败:', error)
    ElMessage.error('停止屏幕共享失败')
  }
}

// 处理切换静音
const handleToggleMute = () => {
  isMuted.value = !isMuted.value
  window.electron.ipcRenderer.send('tipbar-action', {
    action: 'toggle-mute',
    isMuted: isMuted.value
  })
}

// 处理切换摄像头
const handleToggleCamera = () => {
  cameraOn.value = !cameraOn.value
  window.electron.ipcRenderer.send('tipbar-action', {
    action: 'toggle-camera',
    cameraOn: cameraOn.value
  })
}

// 处理切换成员列表
const handleToggleMembers = () => {
  window.electron.ipcRenderer.send('tipbar-action', {
    action: 'toggle-members'
  })
}

// 处理切换聊天
const handleToggleChat = () => {
  window.electron.ipcRenderer.send('tipbar-action', {
    action: 'toggle-chat'
  })
}

// 处理切换录制
const handleToggleRecord = () => {
  recording.value = !recording.value
  window.electron.ipcRenderer.send('tipbar-action', {
    action: 'toggle-record',
    recording: recording.value
  })
}

// 处理共享屏幕
const handleShareScreen = () => {
  window.electron.ipcRenderer.send('tipbar-action', {
    action: 'share-screen'
  })
}

// 处理结束会议
const handleEndMeeting = () => {
  window.electron.ipcRenderer.send('tipbar-action', {
    action: 'end-meeting'
  })
}

// 监听状态更新
onMounted(() => {
  // 监听来自主窗口的状态更新
  window.electron.ipcRenderer.on('update-tipbar-state', (event, state) => {
    if (state.isMuted !== undefined) isMuted.value = state.isMuted
    if (state.cameraOn !== undefined) cameraOn.value = state.cameraOn
    if (state.recording !== undefined) recording.value = state.recording
  })
  
  console.log('Tipbar页面加载完成:', {
    meetingId,
    nickName,
    sourceType,
    sourceName,
    isMuted: isMuted.value,
    cameraOn: cameraOn.value,
    recording: recording.value
  })
})

onBeforeUnmount(() => {
  // 清理监听器
  window.electron.ipcRenderer.removeAllListeners('update-tipbar-state')
})
</script>

<style lang="scss" scoped>
.tipbar-page {
  width: 100%;
  height: 100vh;
  background: transparent;
  overflow: hidden;
}
</style>
