<template>
    <div class="layout-container">
        <div class="sidebar">
            <div class="top-buttons">
                <div class="nav-button">
                    <component :is="VideoCamera" class="nav-icon" />
                    <span class="nav-text">会议</span>
                </div>
                <div class="nav-button">
                    <component :is="User" class="nav-icon" />
                    <span class="nav-text">通讯录</span>
                </div>
                <div class="nav-button">
                    <component :is="VideoPlay" class="nav-icon" />
                    <span class="nav-text">录制</span>
                </div>
            </div>
            <div class="bottom-buttons">
                <div class="setting-button">
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
</script>

<style lang="scss" scoped>
.layout-container {
    display: flex;
    height: 100vh;
    width: 100vw;

    .sidebar {
        width: 88px;
        background-color: #f5f5f5;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 20px 0;
        box-sizing: border-box;
        height: 100%;
        -webkit-app-region: drag;

        .top-buttons {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 30px;
        }

        .bottom-buttons {
            display: flex;
            justify-content: center;
        }

        .nav-button {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 72px;
            padding: 12px 8px;
            cursor: pointer;
            transition: background-color 0.2s;

            &:hover {
                background-color: #e8f4ff;
            }

            .nav-icon {
                width: 28px;
                height: 28px;
                margin-bottom: 6px;
                color: #409eff;
            }

            .nav-text {
                font-size: 12px;
                color: #333;
                white-space: nowrap;
            }
        }

        .setting-button {
            width: 40px;
            height: 40px;
        }
    }

    .main-content {
        flex: 1;
        overflow: auto;
    }
}
</style>