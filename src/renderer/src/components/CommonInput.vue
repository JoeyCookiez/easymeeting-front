<template>
    <div class="common-panel">
        <div class="common-title" :style="{fontSize:fontSize}">
            {{ title }}
        </div>
        <div class="common-input-area">
            <input v-model="value" class="common-input"/>
        </div>
    </div>
</template>

<script setup>
import {ref, defineProps} from 'vue'
const props = defineProps({
    width:{
        type: Number,
        default: 200
    },
    height:{
        type: Number,
        default: 36
    },
    clearable:{
        type: Boolean,
        default: true
    },
    outlineColor:{
        type: String,
        default: 'rgb(128,179,255)'
    },
    key:{
        type: String,
        required: true
    },
    value:{
        type: [Number,String],
        default: ''
    },
    fontSize:{
        type: Number,
        default: 20
    },
    title:{
        type: String,
        default: ''
    }
})
</script>

<style lang="scss" scoped>
.common-panel{
    display: flex;
    flex-direction: column;
    .common-input-area{
        
    }
    .common-input{
        border: none;
        outline: none;
    }
    .common-input:focus{
        border: none;
        outline: none;
    }
}
</style>