<template>
  <div class="screen-share-tipbar" v-if="visible" :class="{ expanded: isExpanded }">
    <!-- 基础tipbar -->
    <div class="tipbar-basic" @mouseenter="expandTipbar" @mouseleave="collapseTipbar">
      <div class="status-text">
        <span class="status-icon">{{ props.sourceType === 'window' ? '🪟' : '📺' }}</span>
        <span>您正在共享{{ props.sourceType === 'window' ? '窗口' : '屏幕' }}</span>
        <span class="source-name" v-if="props.sourceName">{{ props.sourceName }}</span>
      </div>
      <button class="stop-share-btn" @click="stopSharing">结束共享</button>
    </div>

    <!-- 展开的会议详情 -->
    <div class="tipbar-expanded" v-if="isExpanded">
      <div class="meeting-controls">
        <button 
          class="control-btn" 
          :class="{ active: !isMuted }"
          @click="toggleMute"
          :title="isMuted ? '解除静音' : '静音'"
        >
          <span class="btn-icon">{{ isMuted ? '🔇' : '🎤' }}</span>
          <span class="btn-text">{{ isMuted ? '静音' : '解除静音' }}</span>
        </button>

        <button 
          class="control-btn" 
          :class="{ active: cameraOn }"
          @click="toggleCamera"
          :title="cameraOn ? '关闭视频' : '开启视频'"
        >
          <span class="btn-icon">{{ cameraOn ? '📹' : '📷' }}</span>
          <span class="btn-text">{{ cameraOn ? '关闭视频' : '开启视频' }}</span>
        </button>

        <button 
          class="control-btn"
          @click="toggleMembers"
          title="成员"
        >
          <span class="btn-icon">👥</span>
          <span class="btn-text">成员</span>
        </button>

        <button 
          class="control-btn"
          @click="toggleChat"
          title="聊天"
        >
          <span class="btn-icon">💬</span>
          <span class="btn-text">聊天</span>
        </button>

        <button 
          class="control-btn"
          :class="{ active: recording }"
          @click="toggleRecord"
          :title="recording ? '停止录制' : '开始录制'"
        >
          <span class="btn-icon">{{ recording ? '⏹️' : '⏺️' }}</span>
          <span class="btn-text">{{ recording ? '停止录制' : '录制' }}</span>
        </button>

        <button 
          class="control-btn"
          @click="shareScreen"
          title="共享屏幕"
        >
          <span class="btn-icon">📺</span>
          <span class="btn-text">共享</span>
        </button>

        <button 
          class="control-btn danger"
          @click="endMeeting"
          title="结束会议"
        >
          <span class="btn-icon">🚪</span>
          <span class="btn-text">结束会议</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  isMuted: {
    type: Boolean,
    default: false
  },
  cameraOn: {
    type: Boolean,
    default: false
  },
  recording: {
    type: Boolean,
    default: false
  },
  sourceType: {
    type: String,
    default: 'screen'
  },
  sourceName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'stop-sharing',
  'toggle-mute',
  'toggle-camera',
  'toggle-members',
  'toggle-chat',
  'toggle-record',
  'share-screen',
  'end-meeting'
])

const isExpanded = ref(false)
let expandTimer = null
let collapseTimer = null

// 展开tipbar
const expandTipbar = () => {
  if (collapseTimer) {
    clearTimeout(collapseTimer)
    collapseTimer = null
  }
  
  if (expandTimer) {
    clearTimeout(expandTimer)
  }
  
  expandTimer = setTimeout(() => {
    isExpanded.value = true
  }, 300) // 300ms延迟展开
}

// 收起tipbar
const collapseTipbar = () => {
  if (expandTimer) {
    clearTimeout(expandTimer)
    expandTimer = null
  }
  
  if (collapseTimer) {
    clearTimeout(collapseTimer)
  }
  
  collapseTimer = setTimeout(() => {
    isExpanded.value = false
  }, 500) // 500ms延迟收起
}

// 停止共享
const stopSharing = () => {
  emit('stop-sharing')
}

// 切换静音
const toggleMute = () => {
  emit('toggle-mute')
}

// 切换摄像头
const toggleCamera = () => {
  emit('toggle-camera')
}

// 切换成员列表
const toggleMembers = () => {
  emit('toggle-members')
}

// 切换聊天
const toggleChat = () => {
  emit('toggle-chat')
}

// 切换录制
const toggleRecord = () => {
  emit('toggle-record')
}

// 共享屏幕
const shareScreen = () => {
  emit('share-screen')
}

// 结束会议
const endMeeting = () => {
  emit('end-meeting')
}

// 清理定时器
onBeforeUnmount(() => {
  if (expandTimer) clearTimeout(expandTimer)
  if (collapseTimer) clearTimeout(collapseTimer)
})
</script>

<style lang="scss" scoped>
.screen-share-tipbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10000;
  pointer-events: none;
  
  .tipbar-basic {
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 12px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    pointer-events: auto;
    transition: all 0.3s ease;
    
    .status-text {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #fff;
      font-size: 14px;
      font-weight: 500;
      
      .status-icon {
        font-size: 16px;
      }
      
      .source-name {
        color: #409eff;
        font-weight: 600;
        margin-left: 8px;
        font-size: 13px;
        opacity: 0.9;
      }
    }
    
    .stop-share-btn {
      background: #ff4757;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: #ff3742;
        transform: translateY(-1px);
      }
      
      &:active {
        transform: translateY(0);
      }
    }
  }
  
  .tipbar-expanded {
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(15px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 16px 20px;
    pointer-events: auto;
    animation: slideDown 0.3s ease-out;
    
    .meeting-controls {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
      
      .control-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        padding: 12px 16px;
        color: #fff;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 80px;
        
        &:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }
        
        &:active {
          transform: translateY(0);
        }
        
        &.active {
          background: rgba(64, 158, 255, 0.3);
          border-color: #409eff;
          color: #409eff;
        }
        
        &.danger {
          background: rgba(255, 71, 87, 0.2);
          border-color: #ff4757;
          color: #ff4757;
          
          &:hover {
            background: rgba(255, 71, 87, 0.3);
          }
          
          &.active {
            background: rgba(255, 71, 87, 0.4);
          }
        }
        
        .btn-icon {
          font-size: 18px;
          line-height: 1;
        }
        
        .btn-text {
          font-size: 11px;
          font-weight: 500;
          text-align: center;
          line-height: 1.2;
        }
      }
    }
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .screen-share-tipbar {
    .tipbar-expanded .meeting-controls {
      gap: 8px;
      
      .control-btn {
        min-width: 70px;
        padding: 10px 12px;
        
        .btn-icon {
          font-size: 16px;
        }
        
        .btn-text {
          font-size: 10px;
        }
      }
    }
  }
}
</style>
