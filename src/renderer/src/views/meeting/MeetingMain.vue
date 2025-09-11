<template>
    <div class="home-container">
        <div class="content">
            <div class="left-panel">
                <div class="features-grid">
                    <div class="feature-card" v-for="item in featureItems" :key="item.route"
                        @click="handleFeatureClick(item)">
                        <div class="feature-card-panel" 
                        @mouseenter="changeImg(item?.route, item?.enterIcon)"
                        @mouseleave="changeImg(item?.route, item?.exitIcon)"
                        >
                            <div class="feature-card-icon">
                                <img :src="item?.initIcon" :id="item?.route + '-img'" class="feature-card-img" />
                            </div>
                            <p>{{ item?.label }}</p>
                        </div>
                        <!-- <div class="feature-title">{{ item.label }}</div> -->
                        <!-- <div class="feature-desc">{{ item.desc }}</div> -->
                    </div>
                </div>
            </div>

            <div class="right-panel">
                <div class="date-panel">
                    <div class="date-text">{{ month }}月{{ day }}日 {{ weekText }}</div>
                </div>
                <div class="meeting-section">
                    <div class="section-title">进行中的会议</div>
                    <div v-if="runningMeetings.length === 0" class="empty">暂无进行中的会议</div>
                    <div v-for="m in runningMeetings" :key="m.id" class="meeting-item running">
                        <div class="name">{{ m.title }}</div>
                        <div class="time">{{ m.time }}</div>
                    </div>
                </div>
                <div class="meeting-section">
                    <div class="section-title">未开始的会议</div>
                    <div v-if="upcomingMeetings.length === 0" class="empty">暂无未开始的会议</div>
                    <div v-for="m in upcomingMeetings" :key="m.id" class="meeting-item upcoming">
                        <div class="name">{{ m.title }}</div>
                        <div class="time">{{ m.time }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 加入会议对话框 -->
    <el-dialog v-model="showJoinDialog" width="520px" :show-close="false" append-to-body class="join-meeting-dialog">
        <template #header>
            <div class="dialog-header">
                <div class="title">加入会议</div>
                <div class="window-controls">
                    <button class="control-btn min-btn" @click="minimizeJoinDialog">─</button>
                    <button class="control-btn close-btn" @click="closeJoinDialog">×</button>
                </div>
            </div>
        </template>

        <div class="dialog-body">
            <el-form label-width="86px" class="form-area">
                <el-form-item label="会议号">
                    <el-input v-model="joinForm.meetingNo" placeholder="请输入会议号或链接" />
                </el-form-item>
                <el-form-item label="入会名称">
                    <el-input v-model="joinForm.nickName" placeholder="请输入您的名称" />
                </el-form-item>
                <el-form-item label="会议密码">
                    <el-input v-model="joinForm.password" placeholder="请输入您的会议密码" />
                </el-form-item>
            </el-form>

            <div class="meeting-settings">
                <div class="setting-item">
                    <span class="label">入会时开始摄像头</span>
                    <el-switch v-model="joinForm.videoOpen" />
                </div>
            </div>

            <div class="meeting-settings">
                <div class="setting-item">
                    <span class="label">入会时开始麦克风</span>
                    <el-switch v-model="joinForm.microOpen" />
                </div>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button type="primary" @click="confirmJoinMeeting"
                    :disabled="!joinForm.meetingNo || !joinForm.nickName">加入会议</el-button>
            </div>
        </template>
    </el-dialog>

</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { joinMeeting, preJoinMeeting } from '../../api/meeting'
import { ElMessage } from 'element-plus'
import { getUserInfo, saveMeetingInfo } from '../../utils/presist'
import join_normal_new from '../../assets/icons/main_view_join_normal_new.svg'
import quick_normal from '../../assets/icons/main_view_quick_normal.svg'
import schedule_normal from '../../assets/icons/main_view_schedule_normal.svg'
import share_normal from '../../assets/icons/main_view_share_normal.svg'
import back_hover_enter from '../../assets/apng/main_view_back_hover_enter_1.apng'
import back_hover_exit from '../../assets/apng/main_view_back_hover_exit_1.apng'
import join_hover_enter from '../../assets/apng/main_view_join_hover_enter_1.apng'
import join_hover_exit from '../../assets/apng/main_view_join_hover_exit_1.apng'
import quick_hover_enter from '../../assets/apng/main_view_quick_hover_enter_1.apng'
import quick_hover_exit from '../../assets/apng/main_view_quick_hover_exit_1.apng'
import schedule_hover_enter from '../../assets/apng/main_view_schedule_hover_enter_1.apng'
import schedule_hover_exit from '../../assets/apng/main_view_schedule_hover_exit_1.apng'
import schedule_select from '../../assets/apng/main_view_schedule_select_1.apng'
import share_hover_enter from '../../assets/apng/main_view_share_hover_enter_1.apng'
import share_hover_exit from '../../assets/apng/main_view_share_hover_exit_1.apng'
const featureItems = ref([
    {
        label: '加入会议',
        route: '/joinMeeting',
        desc: '通过会议号或链接加入',
        initIcon: join_normal_new,
        enterIcon: join_hover_enter,
        exitIcon: join_hover_exit
    },
    {
        label: '快速会议',
        route: '/quickMeeting',
        desc: '立即发起一个会议',
        initIcon: quick_normal,
        enterIcon: quick_hover_enter,
        exitIcon: quick_hover_exit
    },
    {
        label: '预定会议',
        route: '/scheduleMeeting',
        desc: '设定时间并邀请参会人',
        initIcon: schedule_normal,
        enterIcon: schedule_hover_enter,
        exitIcon: schedule_hover_exit
    },
    {
        label: '共享屏幕',
        route: '/screenShare',
        desc: '快速共享当前屏幕',
        initIcon: share_normal,
        enterIcon: share_hover_enter,
        exitIcon: share_hover_exit
    }
])
const router = useRouter()

const showJoinDialog = ref(false)
const joinForm = ref({
    meetingNo: '123456789',
    nickName: '',
    videoOpen: false,
    password: '',
    microOpen: false
})
const changeImg = (key, newIcon) => {
    const imgDom = document.getElementById(key+'-img')
    imgDom.src = newIcon
}
const handleFeatureClick = async(item) => {
    if (item.route === '/joinMeeting') {
        // 弹出加入会议的窗口
        showJoinDialog.value = true
        await window.electron.ipcRenderer.invoke("onShowJoinMeetingWindow", {
            nickName: getUserInfo()?.nickName
        })
        return
    }
    router.push(item.route)
}

const minimizeJoinDialog = () => {
    showJoinDialog.value = false
}

const closeJoinDialog = () => {
    showJoinDialog.value = false
}

const confirmJoinMeeting = async () => {
    // TODO: 接入实际加入会议逻辑
    showJoinDialog.value = false
    const preJoinRes = await preJoinMeeting(joinForm.value)
    if (preJoinRes.code != 200) {
        ElMessage.error(preJoinRes?.message)
        return
    }
    const joinRes = await joinMeeting({
        videoOpen: joinForm.value?.videoOpen ? '1' : '0',
        microOpen: joinForm.value?.microOpen ? '1' : '0'
    })
    if (joinRes.code != 200) {
        ElMessage.error(joinRes?.message)
        return
    }
    saveMeetingInfo(joinRes?.data)
    // 打开会议室新窗口（不可用则回退到路由导航）
    // try {
    //     if (window.api?.openMeetingWindow) {
    //         await window.api.openMeetingWindow({
    //             meetingId: joinForm.value.meetingNo,
    //             nickName: joinForm.value.nickName,
    //             video: joinForm.value.videoOpen
    //         })
    //     } else {
    //         router.push({
    //             path: `/meetingRoom/${encodeURIComponent(joinForm.value.meetingNo)}`,
    //             query: {
    //                 nickName: joinForm.value.nickName,
    //                 video: joinForm.value.videoOpen ? '1' : '0'
    //             }
    //         })
    //     }
    // } catch (e) {
    //     ElMessage.error('打开会议窗口失败，已回退到当前窗口显示')
    //     router.push({
    //         path: `/meetingRoom/${encodeURIComponent(joinForm.value.meetingNo)}`,
    //         query: {
    //             nickName: joinForm.value.nickName,
    //             video: joinForm.value.videoOpen ? '1' : '0'
    //         }
    //     })
    // }
    await window.electron.ipcRenderer.invoke("openMeetingWindow", {
        meetingId: joinForm.value.meetingNo,
        nickName: joinForm.value.nickName,
        video: joinForm.value.videoOpen,
        micro: joinForm.value.microOpen
    })
}



const now = ref(new Date())
onMounted(() => {
    // 可在此处接入真实会议数据
    const userInfo = JSON.parse(localStorage.getItem("userInfo"))
    console.log("userInfo", userInfo)
    joinForm.value.nickName = userInfo?.nickName
})

const month = computed(() => now.value.getMonth() + 1)
const day = computed(() => now.value.getDate())
const weekText = computed(() => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.value.getDay()])

const meetingList = ref([
    { id: 1, title: '团队例会', time: '10:00 - 11:00', status: '进行中' },
    { id: 2, title: '产品评审', time: '14:00 - 15:00', status: '未开始' }
])

const runningMeetings = computed(() => meetingList.value.filter(m => m.status === '进行中'))
const upcomingMeetings = computed(() => meetingList.value.filter(m => m.status !== '进行中'))
</script>

<style lang="scss" scoped>
.home-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

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

                &:hover {
                    background: rgba(0, 0, 0, 0.12);
                }

                &.close-btn:hover {
                    background: #ff5f56;
                    color: #fff;
                }

                &.min-btn:hover {
                    background: #ffbd2e;
                    color: #fff;
                }
            }
        }
    }

    .content {
        display: flex;
        flex: 1;
        overflow: hidden;
        background: #fff;
    }

    .left-panel {
        flex: 1;
        padding: 12px 16px 16px 16px;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        border-right: solid #e2e2e2 1px;

        .features-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-gap: 12px;
        }

        .feature-card {

            /*border-radius: 12px;
            background: #f7f9fc;
            padding: 16px;
            cursor: pointer;
            transition: transform .15s ease, box-shadow .15s ease;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
            }

            .feature-title {
                font-size: 16px;
                font-weight: 600;
                color: #1f2d3d;
                margin-bottom: 6px;
            }

            .feature-desc {
                font-size: 12px;
                color: #606266;
            }*/
        }

        .feature-card-panel {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            // margin: 15px;
            padding: 18px;
            p{
                margin-top: 10px;
                margin-bottom: 0;
            }
            .feature-card-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 64px;
                height: 64px;
                // background-color: rgb(26, 125, 255);
                background: linear-gradient(to right bottom,
                    rgb(3,113,255) 0%,
                    rgb(15,119,255) 50%,
                    rgb(27,125,255) 100%
                );
                border-radius: 14px;
                transition: all 0.2s ease;

                .feature-card-img {
                    width: 46px;
                    height: 46px;
                }

                &:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 10px rgba(0, 0, 0, 0.2);
                }
            }
        }
    }

    .right-panel {
        width: 260px;
        padding: 12px 12px 12px 0;
        box-sizing: border-box;
        overflow-y: auto;

        .date-panel {
            background: #fff;
            border-radius: 10px;
            padding: 14px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            margin-bottom: 12px;

            .date-text {
                font-size: 18px;
                font-weight: 700;
                color: #303133;
            }
        }

        .meeting-section {
            background: #fff;
            border-radius: 10px;
            padding: 12px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

            &+.meeting-section {
                margin-top: 12px;
            }

            .section-title {
                font-size: 14px;
                font-weight: 600;
                color: #409eff;
                margin-bottom: 8px;
            }

            .empty {
                font-size: 12px;
                color: #909399;
            }

            .meeting-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px dashed #eee;

                &:last-child {
                    border-bottom: none;
                }

                .name {
                    font-size: 13px;
                    color: #303133;
                }

                .time {
                    font-size: 12px;
                    color: #909399;
                }

                &.running .name {
                    color: #67c23a;
                }
            }
        }
    }
}

.join-meeting-dialog {
    :deep(.el-dialog__header) {
        padding: 0 0 12px 0;
    }

    :deep(.el-dialog__headerbtn) {
        display: none;
    }
}

.dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-bottom: 1px solid #f0f0f0;

    .title {
        font-size: 14px;
        font-weight: 600;
        color: #333;
    }

    .window-controls {
        display: flex;
        gap: 6px;

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

            &:hover {
                background: rgba(0, 0, 0, 0.12);
            }

            &.close-btn:hover {
                background: #ff5f56;
                color: #fff;
            }

            &.min-btn:hover {
                background: #ffbd2e;
                color: #fff;
            }
        }
    }
}

.dialog-body {
    padding: 12px 8px 0 8px;
}

.form-area {
    max-width: 100%;
}

.meeting-settings {
    margin-top: 8px;
    padding: 10px 12px;
    background: #f7f9fc;
    border-radius: 8px;

    .setting-item {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .label {
            font-size: 13px;
            color: #303133;
        }
    }
}

.dialog-footer {
    padding-top: 0;
}
</style>