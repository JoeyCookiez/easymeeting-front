<template>
    <div class="right-panel">
        <div v-if="isMin" class="sys-btn" @click="handleSysOperation('min')">
            <img :src="sys_min" />
        </div>
        <div v-if="isMax" class="sys-btn" @click="handleSysOperation('max')">
            <img :src="isClickMax ? sys_restore : sys_max" />
        </div>
        <div v-if="isClose" class="sys-btn" @mouseenter="changeImg(sys_close_hover)" @mouseleave="changeImg(sys_close)"
            @click="handleSysOperation('close')">
            <img :src="sys_close" ref="closeRef" />
        </div>
    </div>
</template>

<script setup>
import { ref, defineProps } from 'vue'
import sys_close from '../assets/icons/in_meeting_sys_close.svg'
import sys_close_hover from '../assets/icons/in_meeting_sys_close_hover.svg'
import sys_max from '../assets/icons/in_meeting_sys_max.svg'
import sys_min from '../assets/icons/in_meeting_sys_min.svg'
import sys_restore from '../assets/icons/in_meeting_sys_restore.svg'
const isClickMax = ref(false)
const closeRef = ref(null)
const props = defineProps({
    title: { type: String, default: '' },
    isMin: { type: Boolean, default: true },
    isMax: { type: Boolean, default: true },
    isClose: { type: Boolean, default: true },
    borderRadius: { type: Number, default: 8 }
})
const handleSysOperation = (type) => {
    switch (type) {
        case 'min':
            window.electronAPI.minimize()
            break
        case 'max':
            window.electronAPI.maximize()
            isClickMax.value = !isClickMax.value
            break
        case 'close':
            window.electronAPI.close()
            break
    }
}
const changeImg = (imgSrc) => {
    closeRef.value.src = imgSrc
}
</script>

<style lang="scss" scoped>
.right-panel {
    -webkit-app-region: no-drag;
    display: flex;
    position: absolute;
    right: 0;
    top: 0;
    z-index: 9999;
}

.sys-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    img {
        width: 26px;
        height: 26px;
    }

    &:hover {
        background-color: rgb(235, 235, 235);

    }
}
</style>