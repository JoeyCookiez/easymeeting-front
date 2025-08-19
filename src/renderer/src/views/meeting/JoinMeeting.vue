<template>
    <div class="page-wrapper">
        <h3>加入会议</h3>
        <el-form label-width="80px" class="form-area">
            <el-form-item label="会议号">
                <el-input v-model="meetingId" placeholder="请输入会议号或链接" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary">加入</el-button>
            </el-form-item>
        </el-form>
    </div>
</template>

<script setup>
import { ref } from 'vue'
const meetingId = ref('')
</script>

<style lang="scss" scoped>
.page-wrapper {
    padding: 16px;
}
.form-area { max-width: 420px; }
</style>


