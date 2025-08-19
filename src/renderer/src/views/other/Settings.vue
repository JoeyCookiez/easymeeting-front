<template>
    <div class="page-wrapper">
        <h3>设置</h3>
        <el-form label-width="100px" class="form-area">
            <el-form-item label="摄像头">
                <el-select placeholder="选择摄像头">
                    <el-option label="默认设备" value="default" />
                </el-select>
            </el-form-item>
            <el-form-item label="麦克风">
                <el-select placeholder="选择麦克风">
                    <el-option label="默认设备" value="default" />
                </el-select>
            </el-form-item>
        </el-form>
    </div>
</template>

<script setup>
</script>

<style lang="scss" scoped>
.page-wrapper { padding: 16px; background: #fff; height: 100%; box-sizing: border-box; }
.form-area { max-width: 520px; }
</style>


