<template>
    <div class="login-container">
        <div class="window-header">
            <div class="title">EasyMeeting</div>
            <div class="window-controls">
                <button class="control-btn min-btn" @click="minimizeWindow">─</button>
                <button class="control-btn close-btn" @click="handleClose">×</button>
            </div>
        </div>

        <div class="login-form">
            <h2>{{ isLogin ? '用户登录' : '用户注册' }}</h2>
            <el-form :model="formData" :rules="rules" ref="formDataRef" label-width="0px" @submit.prevent>
                <el-form-item prop="email">
                    <el-input clearable placeholder="请输入邮箱" v-model.trim="formData.email"
                        :prefix-icon="Message"></el-input>
                </el-form-item>

                <template v-if="!isLogin">
                    <el-form-item prop="nickName">
                        <el-input clearable placeholder="请输入昵称" v-model.trim="formData.nickName" maxLength="15"
                            :prefix-icon="User"></el-input>
                    </el-form-item>
                </template>

                <el-form-item prop="password">
                    <el-input clearable placeholder="请输入密码" v-model.trim="formData.password" type="password"
                        :prefix-icon="Lock"></el-input>
                </el-form-item>

                <template v-if="!isLogin">
                    <el-form-item prop="rePassword">
                        <el-input clearable placeholder="请再次输入密码" v-model.trim="formData.rePassword" type="password"
                            :prefix-icon="Lock"></el-input>
                    </el-form-item>
                </template>

                <div class="check-code-panel" v-if="!isLogin">
                    <el-form-item prop="checkCode" class="check-code-input">
                        <div class="check-code-input-wrapper">
                            <el-input clearable placeholder="请输入验证码" v-model.trim="formData.checkCode"
                                :prefix-icon="Key"></el-input>
                            <img :src="checkCodeUrl" class="check-code-img" @click="refreshCheckCode" />
                        </div>
                    </el-form-item>
                </div>

                <div class="login-btn">
                    <el-button type="primary" @click="handleSubmit">{{ isLogin ? "登录" : "注册" }}</el-button>
                </div>

                <div class="bottomLink">
                    <span @click="changeOpType">{{ isLogin ? "没有账号？立即注册" : "已有账号？立即登录" }}</span>
                </div>
            </el-form>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useRouter } from 'vue-router';
import { User, Lock, Message, Key } from '@element-plus/icons-vue'
import { getCheckCodeImg, getCheckCodeUUID } from '../../api/checkCode';
import { ElMessage } from 'element-plus';
import { login, register } from '../../api/user';
import { useUserInfoStore } from '../../stores/UserInfoStore';
const { proxy } = getCurrentInstance()
const router = useRouter()

const isLogin = ref(true)
const checkCodeUrl = ref("")
const formDataRef = ref()
const curCheckCodeUUID = ref(undefined)
const userInfoStore = useUserInfoStore()
const renderCheckCode = async () => {
    // 获取验证码的UUID
    const res = await getCheckCodeUUID()
    const { captchaId } = res
    console.log(captchaId)
    if (!captchaId) {
        ElMessage.error("获取验证码失败")
        return
    }
    curCheckCodeUUID.value = captchaId
    // 根据验证码的UUID获取验证码图片
    const blob = await getCheckCodeImg(captchaId)
    // const blob = await response.blob()
    const reader = new FileReader()
    reader.onload = () => {
        const base64Url = reader.result
        checkCodeUrl.value = base64Url
    }
    reader.readAsDataURL(blob)
}
onMounted(() => {
    // renderCheckCode()
})
const formData = ref({
    email: '',
    nickName: '',
    password: '',
    rePassword: '',
    checkCode: ''
})

const rules = {
    email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
    nickName: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
    rePassword: [{ required: true, message: '请再次输入密码', trigger: 'blur' }],
    checkCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

const changeOpType = async () => {
    console.log("点击了bottomLink")
    isLogin.value = !isLogin.value
    if (!isLogin.value) {
        renderCheckCode()
    }
    // 确保传递正确的参数
    await window.electron.ipcRenderer.invoke("onLoginOrRegister", isLogin.value)
}

const minimizeWindow = () => {
    window.electron.ipcRenderer.send('minimize-window');
};

const handleClose = () => {
    window.electron.ipcRenderer.send('show-close-dialog');
};

const handleSubmit = async() => {
    // 表单提交逻辑

    console.log('提交表单', formData.value);
    if (isLogin) {
        // 登录
        const { email, password } = formData.value
        const param = {
            email: email,
            password: password
        }
        const res = await login(param)
        // localStorage.setItem('userInfo',JSON.stringify(res.data))
        if(res.code != 200){
            ElMessage.error("登录失败:"+res.message)
            return
        }
        userInfoStore.setInfo(res.data)
        await window.electron.ipcRenderer.invoke("onLoginSuccess",res.data,import.meta.env.VITE_WS)
        router.push("/home")
        return
        
    } else {
        // 如果是注册
        const { rePassword, password } = formData.value
        if (rePassword !== password) {
            ElMessage.error("两次输入密码不一致！")
            return
        }
        const param = { ...formData.value, checkCodeKey: curCheckCodeUUID }
        // const res = await register(param)
        
    }

};

const refreshCheckCode = () => {
    // 刷新验证码逻辑
    renderCheckCode()
    console.log('刷新验证码');
};
</script>

<style lang="scss" scoped>
.login-container {
    width: 100%;
    min-height: 100%;
    /* 改为100%而不是100vh */
    border-radius: 10px;
    overflow: hidden;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

    .window-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        background: rgba(0, 0, 0, 0.2);
        -webkit-app-region: drag;

        .title {
            color: white;
            font-size: 16px;
            font-weight: bold;
        }

        .window-controls {
            display: flex;
            gap: 8px;
            -webkit-app-region: no-drag;

            .control-btn {
                width: 25px;
                height: 25px;
                border: none;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.2);
                color: white;
                cursor: pointer;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;

                &:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                &.close-btn:hover {
                    background: #ff5f56;
                }

                &.min-btn:hover {
                    background: #ffbd2e;
                }
            }
        }
    }

    .login-form {
        padding: 30px;
        min-height: calc(100% - 50px);
        /* 改为100%而不是100vh */

        h2 {
            text-align: center;
            color: white;
            margin-bottom: 30px;
        }

        :deep(.el-input__wrapper) {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 20px;

            .el-input__inner {
                &::placeholder {
                    color: #999;
                }
            }
        }

        :deep(.el-form-item) {
            margin-bottom: 20px;
        }

        .check-code-panel {
            .check-code-input-wrapper {
                display: flex;
                align-items: center;
                gap: 10px;

                :deep(.el-form-item) {
                    flex: 1;
                    margin-bottom: 0 !important;
                }

                .check-code-img {
                    height: 40px;
                    border-radius: 5px;
                    cursor: pointer;
                }
            }
        }

        .login-btn {
            margin-top: 20px;
            text-align: center;

            :deep(.el-button) {
                width: 100%;
                border-radius: 20px;
                height: 40px;
                font-size: 16px;
            }
        }

        .bottomLink {
            text-align: center;
            margin-top: 20px;

            span {
                color: rgba(255, 255, 255, 0.8);
                cursor: pointer;
                font-size: 14px;

                &:hover {
                    color: white;
                    text-decoration: underline;
                }
            }
        }
    }
}
</style>