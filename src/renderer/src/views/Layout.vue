<template>
    <div class="layout-container">
        <div class="sidebar">
            <div class="top-buttons">
                <div class="nav-button" :class="{ active: isActive('/meetingMain') }" @click="go('/meetingMain')">
                    <component :is="VideoCamera" class="nav-icon" />
                    <span class="nav-text">会议</span>
                </div>
                <div class="nav-button" :class="{ active: isActive('/contacts') }" @click="go('/contacts')">
                    <component :is="User" class="nav-icon" />
                    <span class="nav-text">通讯录</span>
                </div>
                <div class="nav-button" :class="{ active: isActive('/recordings') }" @click="go('/recordings')">
                    <component :is="VideoPlay" class="nav-icon" />
                    <span class="nav-text">录制</span>
                </div>
            </div>
            <div class="bottom-buttons">
                <div class="setting-button" :class="{ active: isActive('/settings') }" @click="go('/settings')">
                    <component :is="Setting" class="nav-icon" />
                </div>
            </div>
        </div>
        <div class="main-content">
            <router-view />
        </div>
    </div>
    
</template>

<script setup>
import { VideoCamera, User, VideoPlay, Setting } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const go = (path) => {
    if (route.path !== path) {
        router.push(path)
    }
}
const isActive = (path) => route.path === path
</script>

<style lang="scss" scoped>
.layout-container {
    display: flex;
    height: 100%;
    width: 100%;
    overflow: hidden;

    .sidebar {
        width: 72px;
        background-color: #f5f7fa;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 12px 0;
        box-sizing: border-box;
        height: 100%;
        -webkit-app-region: drag;

        .top-buttons {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
        }

        .bottom-buttons {
            display: flex;
            justify-content: center;
            padding-bottom: 6px;
        }

        .nav-button {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 56px;
            padding: 8px 6px;
            cursor: pointer;
            transition: background-color 0.2s;
            -webkit-app-region: no-drag;

            &:hover {
                background-color: #eef5ff;
            }
            &.active { background-color: #e8f4ff; }

            .nav-icon {
                width: 22px;
                height: 22px;
                margin-bottom: 4px;
                color: #409eff;
            }

            .nav-text {
                font-size: 11px;
                color: #333;
                white-space: nowrap;
            }
        }

        .setting-button {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            cursor: pointer;
            -webkit-app-region: no-drag;
            &:hover { background: #eef5ff; }
            &.active { background: #e8f4ff; }
        }
    }

    .main-content {
        flex: 1;
        overflow: hidden;
        background: #fff;
    }
}
</style>