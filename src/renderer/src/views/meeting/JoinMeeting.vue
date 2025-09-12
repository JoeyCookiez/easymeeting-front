<template>
    <div class="page-wrapper">
        <!-- <h3>加入会议</h3> -->
        <TopBar title="加入会议" :isMax="false"></TopBar>
        <div class="main-content">
            <CommonInput title="会议号" key="meetingNo" v-model="formData.meetingNo"
                @update:modelValue="val => handleCurrentChange('meetingNo', val)" />
            <CommonInput title="入会昵称" key="nickName" v-model="formData.nickName" />
            <div>
                <p>会议设置</p>
            </div>
            <CommonInput title="自动连接音频" key="audioOn" inputType="checkbox" v-model="formData.audioOn" />
            <CommonInput title="入会开启摄像头" key="videoOpen" inputType="checkbox" v-model="formData.videoOpen" />
            <CommonInput title="入会开启麦克风" key="microOpen" inputType="checkbox" v-model="formData.microOpen" />
            <!-- <el-button :class="['common-btn', isActive ? 'btn-active' : 'btn-inactive']">加入会议</el-button> -->

            <div :class="['common-btn', isActive ? 'btn-active' : 'btn-inactive']">加入会议</div>

        </div>
        <!-- <el-form label-width="80px" class="form-area">
            <el-form-item label="会议号">
                <el-input v-model="meetingId" placeholder="请输入会议号或链接" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :disabled="!meetingId" @click="goMeeting">加入</el-button>
            </el-form-item>
        </el-form> -->
    </div>
</template>
<!-- 130,184,255   141,190,255    3,113,255 27,125,255 -->
<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import TopBar from '../../components/TopBar.vue'
import CommonInput from '../../components/CommonInput.vue'
const router = useRouter()
const meetingId = ref('')
const meetingNoMaxLen = 9
const isActive = ref(false)
const meetingNo = ref()
const nickName = ref()
const formData = reactive({
    meetingId: '',
    meetingNo: '',
    nickName: '',
    audioOn: '',
    videoOpen: '',
    microOpen: ''
})
const handleCurrentChange = (param, val) => {
    console.log(param, val)
    if (val.replaceAll(' ', '').length % 3 === 0 && val.length !== 0 && param === 'meetingNo') {
        formData.meetingNo += ' '
    }
    if (param === 'meetingNo' && val.replaceAll(' ', '').length >= meetingNoMaxLen) {
        isActive.value = true
    }
    if (param === 'meetingNO' && val.replaceAll(' ', '').length < meetingNoMaxLen) {
        isActive.value = false
    }
}
const goMeeting = async () => {
    const id = (meetingId.value || '').trim()
    if (!id) return
    try {
        if (window.api?.openMeetingWindow) {
            await window.api.openMeetingWindow({ meetingId: id, nickName: '我', video: false })
        } else {
            router.push({ path: `/meetingRoom/${encodeURIComponent(id)}`, query: { nickName: '我', video: '0' } })
        }
    } catch (e) {
        router.push({ path: `/meetingRoom/${encodeURIComponent(id)}`, query: { nickName: '我', video: '0' } })
    }
}
</script>

<style lang="scss" scoped>
.page-wrapper {
    display: flex;
    flex-direction: column;
    background-color: white;
    height: 100vh;
}

.main-content {
    display: flex;
    flex-direction: column;
    margin: var(--panel-margin);
    height: calc(100% - var(--top-bar-height));
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
    &>* {
        margin-bottom: var(--panel-margin-bottom);
    }
}

.form-area {
    max-width: 420px;
}

.common-btn {
    height: 36px;
    margin-top: auto;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
}

.btn-inactive {
    background-color: rgb(178, 209, 255);
    color: rgb(228, 247, 255);
}

.btn-active {
    background-color: rgb(0, 102, 255);
    color: white;

    &:hover {
        background-color: rgb(0, 85, 232);
    }
}
</style>
