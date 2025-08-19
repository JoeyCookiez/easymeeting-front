<template>
    <div class="home-container">
        <div class="content">
            <div class="left-panel">
                <div class="features-grid">
                    <div class="feature-card" v-for="item in featureItems" :key="item.route" @click="go(item.route)">
                        <div class="feature-title">{{ item.label }}</div>
                        <div class="feature-desc">{{ item.desc }}</div>
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
    
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const go = (routePath) => {
    router.push(routePath)
}

const featureItems = ref([
    { label: '加入会议', route: '/joinMeeting', desc: '通过会议号或链接加入' },
    { label: '快速会议', route: '/quickMeeting', desc: '立即发起一个会议' },
    { label: '预定会议', route: '/scheduleMeeting', desc: '设定时间并邀请参会人' },
    { label: '共享屏幕', route: '/screenShare', desc: '快速共享当前屏幕' }
])

const now = ref(new Date())
onMounted(() => {
    // 可在此处接入真实会议数据
})

const month = computed(() => now.value.getMonth() + 1)
const day = computed(() => now.value.getDate())
const weekText = computed(() => ['周日','周一','周二','周三','周四','周五','周六'][now.value.getDay()])

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

                &:hover { background: rgba(0, 0, 0, 0.12); }
                &.close-btn:hover { background: #ff5f56; color: #fff; }
                &.min-btn:hover { background: #ffbd2e; color: #fff; }
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

        .features-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-gap: 12px;
        }

        .feature-card {
            border-radius: 12px;
            background: #f7f9fc;
            padding: 16px;
            cursor: pointer;
            transition: transform .15s ease, box-shadow .15s ease;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 12px rgba(0,0,0,0.08);
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
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
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
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            & + .meeting-section { margin-top: 12px; }

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
                &:last-child { border-bottom: none; }
                .name { font-size: 13px; color: #303133; }
                .time { font-size: 12px; color: #909399; }
                &.running .name { color: #67c23a; }
            }
        }
    }
}
</style>