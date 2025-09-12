<template>
  <div class="common-panel">
    <div v-if="inputType === 'text'">
      <div class="common-title" :style="{ fontSize: fontSize + 'px' }">
        {{ title }}
      </div>
      <div class="common-input-area" :style="{ height: height + 'px' }">
        <!-- 绑定 ref -->
        <input ref="inputRef" :value="modelValue" @input="onInput" class="common-input" />
        <img v-if="clearable && modelValue" :src="dark_close" @click="clearInput" />
      </div>
    </div>

    <div v-if="inputType === 'checkbox'" class="common-check-area">
      <input type="checkbox" class="checkbox-input"></input>
      <div :style="{ fontSize: fontSize + 'px' }">{{ title }}</div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref } from 'vue'
import dark_close from '../assets/icons/dark_close_icon.svg'

const props = defineProps({
  modelValue: {
    type: [Number, String],
    default: ''
  },
  inputType: {
    type: String,
    default: 'text'
  },
  height: { type: Number, default: 26 },
  clearable: { type: Boolean, default: true },
  outlineColor: { type: String, default: 'rgb(128,179,255)' },
  fontSize: { type: Number, default: 14 },
  title: { type: String, default: '' },
  maxLen: {type: Number , default: 10}
})

const emit = defineEmits(['update:modelValue'])

const inputRef = ref(null)
function countSpaces(str) {
    return str.split(' ').length - 1;
}
const onInput = (event) => {
  let val = event.target.value
  if(val.replaceAll(' ','').length>props.maxLen){
    val = val.slice(0,maxLen+countSpaces(val)) 
    event.target.value = val
  }
  emit('update:modelValue', event.target.value)
}

const clearInput = () => {
  emit('update:modelValue', '')
  // 重新让 input 聚焦
  inputRef.value && inputRef.value.focus()
}
</script>

<style lang="scss" scoped>
.common-panel {
  display: flex;
  flex-direction: column;
  .common-input-area {
    border: 2px solid rgb(233, 235, 237);
    border-radius: 6px;
    display: flex;
    transition: all 0.2s ease;
    width: 100%;
    align-items: center;

    img {
      width: 22px;
      height: 22px;
    }

    &:focus-within {
      border: 2px solid rgb(128, 179, 255);
    }
  }
  .checkbox-input{
    margin-left: 0;
    width: 16px;
    height: 16px;
  }
  .common-input {
    width: calc(100% - 26px);
    border: none;
    outline: none;
  }

  .common-input:focus {
    border: none;
    outline: none;
  }

  .common-check-area {
    display: flex;
    align-items: center;
  }
  
}
</style>