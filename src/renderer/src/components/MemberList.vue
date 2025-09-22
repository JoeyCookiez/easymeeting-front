<template>
    <div class="member-container">
        <div class="top-panel">
            <el-input v-model="input2" style="width: calc(100% - 40px)" placeholder="输入成员昵称" :prefix-icon="Search" />
            <div class="nav-btn">
                <img :src="invite_normal" />
            </div>
        </div>
        <div class="member-list-panel">
            <div v-for="item in meetingMemberList" class="member-line">
                <div class="flex-item">
                    <img class="avatar-img" :src="item?.avatar" />
                    <div>{{ item?.nickName }}</div>
                </div>
                <div class="flex-item">
                    <div class="nav-btn">
                        <img :src="item?.openMicro ? mic_on : mic_off" />
                    </div>
                    <div class="nav-btn">
                        <img :src="item?.openVideo ? video_on : video_off" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { Search } from '@element-plus/icons-vue'
import invite_normal from '../assets/icons/invite_normal_d.svg'
import mic_off from '../assets/icons/mic_off.svg'
import mic_on from '../assets/icons/mic_on.svg'
import video_off from '../assets/icons/video_icon_off.svg'
import video_on from '../assets/icons/video_icon_on.svg'
import { nextTick, onMounted, ref, watch } from 'vue';
const props = defineProps({
    memberList: { type: Array, required: true, default: [] }
})
const meetingMemberList = ref([])
// const meetingMemberList = ref([
//     {
//         "userId": "915445853510",
//         "nickName": "王皓",
//         "avatar": null,
//         "joinTime": 1758453962202,
//         "memberType": 0,
//         "status": 1,
//         "openMicro": false,
//         "openVideo": false,
//         "sex": null
//     },
//     {
//         "userId": "877951079146",
//         "nickName": "马琳",
//         "avatar": null,
//         "joinTime": 1758460116646,
//         "memberType": 0,
//         "status": 1,
//         "openMicro": false,
//         "openVideo": false,
//         "sex": null
//     }
// ])
// const meetingMemberList = props.memberList
onMounted(() => {
    meetingMemberList.value = props.memberList
    console.log("成员列表组件收到的参数:", props.memberList)
})
watch(() => props.memberList, async () => {
    await nextTick()
    meetingMemberList.value = props.memberList
})
</script>

<style lang="scss" scoped>
.member-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: rgb(222, 229, 244);

    .top-panel {
        margin: 10px;
        display: flex;
    }

    .nav-btn {
        margin-left: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;

        &:hover {
            background-color: rgb(196, 196, 196);
            border-radius: 4px;
        }

        img {
            width: 26px;
            height: 26px;
        }
    }

    .member-list-panel {
        display: flex;
        flex-direction: column;
        flex: 1;
        background-color: #fff;
        border-top: 2px solid rgb(175, 175, 175);

    }

    .member-line {
        display: flex;
        height: 42px;
        // width: 100%;
        margin: 6px;
        color: #000;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgb(175, 175, 175);



    }
}

.flex-item {
    display: flex;
    align-items: center;

    .avatar-img {
        width: 36px;
        height: 36px;
        border-radius: 50%;
    }
}
</style>