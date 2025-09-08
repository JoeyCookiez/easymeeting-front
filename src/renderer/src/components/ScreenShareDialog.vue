<template>
  <div class="screen-share-dialog" v-if="visible" @click.self="close">
    <div class="dialog-content">
      <div class="dialog-header">
        <h3>选择要共享的屏幕或窗口</h3>
        <button class="close-btn" @click="close">×</button>
      </div>
      
      <div class="sources-container">
        <div class="sources-grid">
          <div 
            v-for="source in sources" 
            :key="source.id"
            class="source-item"
            :class="{ selected: selectedSource?.id === source.id }"
            @click="selectSource(source)"
          >
            <div class="source-preview">
              <img 
                v-if="source.thumbnail" 
                :src="source.thumbnail" 
                :alt="source.name"
                class="thumbnail"
              />
              <div v-else class="no-preview">
                <img 
                  v-if="source.appIcon" 
                  :src="source.appIcon" 
                  :alt="source.name"
                  class="app-icon"
                />
                <span v-else>{{ source.name.charAt(0) }}</span>
              </div>
            </div>
            <div class="source-info">
              <div class="source-name">{{ source.name }}</div>
              <div class="source-type">{{ getSourceTypeLabel(source.type) }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="dialog-actions">
        <el-button @click="close">取消</el-button>
        <el-button 
          type="primary" 
          :disabled="!selectedSource"
          @click="confirmShare"
        >
          开始共享
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElButton } from 'element-plus'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'share'])

const sources = ref([])
const selectedSource = ref(null)
const loading = ref(false)

// 获取屏幕和窗口源
const getSources = async () => {
  loading.value = true
  try {
    // 通过主进程获取屏幕源
    const result = await window.electron.ipcRenderer.invoke('getScreenSources')
    
    // 过滤掉一些不需要的窗口
    const filteredSources = (result || []).filter(source => {
      // 过滤掉空名称的源
      if (!source.name || source.name.trim() === '') return false
      
      // 过滤掉一些系统窗口
      const excludeNames = [
        'Desktop',
        'Desktop 1',
        'Desktop 2',
        'Desktop 3',
        'Desktop 4',
        'Screen 1',
        'Screen 2',
        'Screen 3',
        'Screen 4'
      ]
      
      if (excludeNames.includes(source.name)) return false
      
      // 过滤掉一些Electron相关的窗口
      if (source.name.includes('Electron') || source.name.includes('esaymeeting')) return false
      
      return true
    })
    
    // 按类型分组：屏幕在前，窗口在后
    sources.value = filteredSources.sort((a, b) => {
      if (a.type === 'screen' && b.type === 'window') return -1
      if (a.type === 'window' && b.type === 'screen') return 1
      return a.name.localeCompare(b.name)
    })
    
    console.log('过滤后的源数量:', sources.value.length)
  } catch (error) {
    console.error('获取屏幕源失败:', error)
    sources.value = []
  } finally {
    loading.value = false
  }
}

// 选择源
const selectSource = (source) => {
  selectedSource.value = source
}

// 获取源类型标签
const getSourceTypeLabel = (type) => {
  const typeMap = {
    screen: '屏幕',
    window: '窗口'
  }
  return typeMap[type] || type
}

// 确认共享
const confirmShare = () => {
  if (selectedSource.value) {
    emit('share', selectedSource.value)
  }
}

// 关闭弹窗
const close = () => {
  emit('close')
}

// 监听弹窗显示状态
watch(() => props.visible, (newVal) => {
  if (newVal) {
    getSources()
    selectedSource.value = null
  }
})

onMounted(() => {
  if (props.visible) {
    getSources()
  }
})
</script>

<style lang="scss" scoped>
.screen-share-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.dialog-content {
  background: #1a1f24;
  border-radius: 12px;
  width: 80%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  h3 {
    margin: 0;
    color: #fff;
    font-size: 18px;
    font-weight: 600;
  }
  
  .close-btn {
    background: none;
    border: none;
    color: #c9d1d9;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

.sources-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.sources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.source-item {
  background: #2a2f35;
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #3a3f45;
    border-color: rgba(64, 158, 255, 0.3);
  }
  
  &.selected {
    border-color: #409eff;
    background: rgba(64, 158, 255, 0.1);
  }
}

.source-preview {
  width: 100%;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
  background: #1a1f24;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  
  .thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .no-preview {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #3a3f45;
    color: #c9d1d9;
    font-size: 24px;
    font-weight: 600;
    
    .app-icon {
      width: 48px;
      height: 48px;
      object-fit: contain;
    }
  }
}

.source-info {
  .source-name {
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .source-type {
    color: #c9d1d9;
    font-size: 12px;
    opacity: 0.8;
  }
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
