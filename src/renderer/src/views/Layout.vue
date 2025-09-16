<template>
    <div class="layout-container">
        <div class="sidebar">
            <div class="top-buttons">
                <div class="nav-button">
                    <el-avatar :size="42" :src="circleUrl" />
                </div>
                <div v-for="(item, index) in btnItems" :key="index"
                    @mouseenter="changeImg(index, item?.hoverIcon, 'enter')"
                    @mouseleave="changeImg(index, item?.initIcon, 'leave')"
                    @click="handleBtnClick(index, item?.selectIcon, item?.path)" class="nav-button">
                    <img :src="index === curSelectIndex ? item?.selectIcon : item?.initIcon"
                        :ref="el => imgRefs[index] = el" />
                    <span class="nav-text">{{ item?.title }}</span>
                </div>
            </div>
            <div class="bottom-buttons">
                <div class="setting-button" :class="{ active: isActive('/settings') }" @click="go('/settings')">
                    <!-- <component :is="Setting" class="nav-icon" /> -->
                    <img :src="setting_normal"/>
                </div>
            </div>
        </div>
        <div class="main-content">
            <!-- <TitleBar /> -->
            <SysTopBar></SysTopBar>
            <div class="content-body">
                <router-view />
            </div>
        </div>
    </div>

</template>

<script setup>
import { VideoCamera, User, VideoPlay, Setting } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'
import TitleBar from '@/components/TitleBar.vue'
import { useUserInfoStore } from '../stores/UserInfoStore'
import { onBeforeMount, onMounted, ref } from 'vue'
import contacts_deactivate_hover from '../assets/icons/premeeting_home_icon_tab_contacts_deactivate_hover.svg'
import contacts_hover from '../assets/icons/premeeting_home_icon_tab_contacts_hover.svg'
import contacts_normal from '../assets/icons/premeeting_home_icon_tab_contacts_normal.svg'
import contacts_select from '../assets/icons/premeeting_home_icon_tab_contacts_select.svg'
import home_deactivate_hover from '../assets/icons/premeeting_home_icon_tab_home_deactivate_hover.svg'
import home_hover from '../assets/icons/premeeting_home_icon_tab_home_hover.svg'
import home_normal from '../assets/icons/premeeting_home_icon_tab_home_normal.svg'
import home_select from '../assets/icons/premeeting_home_icon_tab_home_select.svg'
import quick_record_playing_hover from '../assets/icons/premeeting_home_icon_tab_quick_record_playing_hover.svg'
import quick_record_playing_normal from '../assets/icons/premeeting_home_icon_tab_quick_record_playing_normal.svg'
import quick_record_playing_select from '../assets/icons/premeeting_home_icon_tab_quick_record_playing_select.svg'
import quick_record_select from '../assets/icons/premeeting_home_icon_tab_quick_record_select.svg'
import setting_hover from '../assets/icons/home_navigation_bar_setting_hover.svg'
import setting_normal from '../assets/icons/home_navigation_bar_setting_normal.svg'
import TopBar from '../components/TopBar.vue'
import SysTopBar from '../components/SysTopBar.vue'
const userStore = useUserInfoStore()
const router = useRouter()
const route = useRoute()
const imgRefs = ref([])
const curSelectIndex = ref(0) // 当前选中的按钮的index
const btnItems = ref([
    {
        title: '会议',
        initIcon: home_normal,
        hoverIcon: home_hover,
        selectIcon: home_select,
        deativeHoverIcon: home_deactivate_hover,
        path: "/meetingMain"
    },
    {
        title: '通讯录',
        initIcon: contacts_normal,
        hoverIcon: contacts_hover,
        selectIcon: contacts_select,
        deativeHoverIcon: contacts_deactivate_hover,
        path: "/contacts"
    },
    {
        title: '录制',
        initIcon: quick_record_playing_normal,
        hoverIcon: quick_record_playing_hover,
        selectIcon: quick_record_select,
        deativeHoverIcon: quick_record_playing_select,
        path: "/recordings"
    }
])
const changeImg = (index, imgSrc, type) => {
    // type 操作类型 enter leave click
    // 如果操作的是被选中的按钮则屏蔽enter和leave事件
    if (index === curSelectIndex.value) {
        if (type === 'enter' || type === 'leave') {
            return
        }
    } else {
        imgRefs.value[index].src = imgSrc
    }

}
const handleBtnClick = (index, imgSrc, path) => {
    curSelectIndex.value = index
    imgRefs.value[index].src = imgSrc
    go(path)
}
// const circleUrl = userStore.getInfo()?.avatar
const circleUrl = ref("https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png")
const go = (path) => {
    if (route.path !== path) {
        router.push(path)
    }
}
onBeforeMount(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"))
    console.log('layout userInfo', userInfo)
    circleUrl.value = userInfo?.avatar
})
onMounted(() => {
    console.log("imgRefs", imgRefs)
})
const isActive = (path) => route.path === path
</script>

<style lang="scss" scoped>
.layout-container {
    display: flex;
    height: 100%;
    width: 100%;
    overflow: hidden;
    border-radius: 4px;
    .sidebar {
        width: 66px;
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
            height: 46px;
            padding: 8px 6px;
            cursor: pointer;
            transition: background-color 0.2s;
            -webkit-app-region: no-drag;

            &:hover {
                background-color: #eef5ff;
            }

            &.active {
                background-color: #e8f4ff;
            }

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

            &:hover {
                background: #eef5ff;
            }

            &.active {
                background: #e8f4ff;
            }
        }
    }

    .main-content {
        flex: 1;
        overflow: hidden;
        background: #fff;
        display: flex;
        flex-direction: column;

        .content-body {
            flex: 1;
            min-height: 0;
            overflow: hidden;
        }
    }
}
</style>