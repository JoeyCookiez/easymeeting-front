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
        }]
    }]
})

export default router;