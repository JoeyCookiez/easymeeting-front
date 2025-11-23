<template>
    <div class="window-header">
        <div class="title">YoMeeting</div>
        <div class="window-controls">
            <button class="control-btn min-btn" @click="minimizeWindow">─</button>
            <button class="control-btn close-btn" @click="handleClose">×</button>
        </div>
    </div>
</template>

<script setup>
const minimizeWindow = () => {
    window.electron?.ipcRenderer?.send('minimize-window')
}

const handleClose = () => {
    window.electron?.ipcRenderer?.send('show-close-dialog')
}
</script>

<style lang="scss" scoped>
.window-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.06);
    -webkit-app-region: drag;

    .title {
        color: #333;
        font-size: 14px;
        font-weight: 600;
    }

    .window-controls {
        display: flex;
        gap: 6px;
        -webkit-app-region: no-drag;

        .control-btn {
            width: 22px;
            height: 22px;
            border: none;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.08);
            color: #333;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;

            &:hover { background: rgba(0, 0, 0, 0.12); }
            &.close-btn:hover { background: #ff5f56; color: #fff; }
            &.min-btn:hover { background: #ffbd2e; color: #fff; }
        }
    }
}
</style>


