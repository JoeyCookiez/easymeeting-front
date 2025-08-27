import axios from "axios";
import { ElLoading, ElMessage } from "element-plus";
import { useUserInfoStore } from "../stores/UserInfoStore";

let loading = null;
// console.log(import.meta.env.PROD,import.meta.env.VITE_DOMAIN)
const instance = axios.create({
    withCredentials: true,
    baseURL: (import.meta.env.PROD ? import.meta.env.VITE_DOMAIN : "") + "/api",
    timeout: 10 * 1000
});

// 请求拦截器
instance.interceptors.request.use(
    (config) => {
        // 优先从 Pinia 获取 userInfo，其次从 localStorage 兜底
        try {
            const userStore = useUserInfoStore?.()
            const piniaUserInfo = userStore?.userInfo
            let token = piniaUserInfo?.token
            if (!token) {
                const cached = localStorage.getItem("userInfo")
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached)
                        token = parsed?.token
                    } catch (e) {
                        // ignore json parse error
                    }
                }
            }
            if (token) {
                config.headers = config.headers || {}
                // 常见写法：Bearer <token>；可按后端要求调整
                if (!config.headers.Authorization) {
                    config.headers.Authorization = token
                }
            }
        } catch (e) {
            // 在非组件上下文或 Pinia 未初始化时，try/catch 防御
        }
        if (config.showLoading) {
            loading = ElLoading.service({
                lock: true,
                text: '加载中···',
                background: 'rgba(0,0,0,0.7)'
            });
        }
        return config;
    },
    (error) => {
        if (error.config?.showLoading && loading) {
            loading.close();
        }
        ElMessage.error("请求发送失败");
        return Promise.reject("请求发送失败");
    }
);

// 响应拦截器
instance.interceptors.response.use(
    (response) => {
        if (response.config?.showLoading && loading) {
            loading.close();
        }
        return response.data;
    },
    (error) => {
        if (error.config?.showLoading && loading) {
            loading.close();
        }
        if (error.response) {
            const status = error.response.status;
            switch (status) {
                case 401:
                    ElMessage.error("未授权，请登录");
                    break;
                case 403:
                    ElMessage.error("拒绝访问");
                    break;
                case 404:
                    ElMessage.error("请求资源不存在");
                    break;
                case 500:
                    ElMessage.error("服务器错误");
                    break;
                default:
                    ElMessage.error(error.response.data?.message || "请求失败");
            }
        } else {
            ElMessage.error("网络错误");
        }
        return Promise.reject(error);
    }
);

const request = (options) => {
    return instance({
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
};

export default request;