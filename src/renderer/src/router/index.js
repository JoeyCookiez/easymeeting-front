import {createRouter,createWebHashHistory} from "vue-router"
const router = createRouter({
    mode:"hash",
    history:createWebHashHistory(import.meta.env.BASE_URL),
    routes:[{
        path: "/",
        name: "登录",
        component:()=> import ('@/views/login/Login.vue')
    },{
        path: "/home",
        name: "主页",
        component:()=> import ('@/views/Layout.vue'),
        redirect: "/meetingMain",
        children:[{
            path: "/meetingMain",
            name: "首页",
            component: ()=>import('@/views/meeting/MeetingMain.vue'),
            meta: {
                code: "meeting"
            }
        },{
            path: "/contacts",
            name: "通讯录",
            component: ()=>import('@/views/other/Contacts.vue')
        },{
            path: "/recordings",
            name: "录制",
            component: ()=>import('@/views/other/Recordings.vue')
        },{
            path: "/settings",
            name: "设置",
            component: ()=>import('@/views/other/Settings.vue')
        },{
            path: "/joinMeeting",
            name: "加入会议",
            component: ()=>import('@/views/meeting/JoinMeeting.vue')
        },{
            path: "/quickMeeting",
            name: "快速会议",
            component: ()=>import('@/views/meeting/QuickMeeting.vue')
        },{
            path: "/scheduleMeeting",
            name: "预定会议",
            component: ()=>import('@/views/meeting/ScheduleMeeting.vue')
        },{
            path: "/screenShare",
            name: "共享屏幕",
            component: ()=>import('@/views/meeting/ScreenShare.vue')
        }]
    }]
})

export default router;