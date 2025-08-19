<template>
    <div class="page-wrapper">
        <h3>预定会议</h3>
        <el-form label-width="90px" class="form-area">
            <el-form-item label="会议主题">
                <el-input v-model="title" placeholder="请输入会议主题" />
            </el-form-item>
            <el-form-item label="开始时间">
                <el-date-picker v-model="start" type="datetime" placeholder="选择开始时间" />
            </el-form-item>
            <el-form-item label="结束时间">
                <el-date-picker v-model="end" type="datetime" placeholder="选择结束时间" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary">创建</el-button>
            </el-form-item>
        </el-form>
    </div>
</template>

<script setup>
import { ref } from 'vue'
const title = ref('')
const start = ref('')
const end = ref('')
</script>

<style lang="scss" scoped>
.page-wrapper { padding: 16px; }
.form-area { max-width: 520px; }
</style>


