<template>
  <div class="common-panel">
    <div v-if="inputType === 'text'">
      <div class="common-title" :style="{ fontSize: fontSize + 'px' }">
        {{ title }}
      </div>
      <div class="common-input-area" :style="{ height: height + 'px' }">
        <!-- 绑定 ref -->
        <input ref="inputRef" v-bind:onfocus="handleClick" v-on:focusout="()=>isFocus = false" :value="modelValue" @input="onInput" class="common-input" />
        <img v-if="clearable && modelValue &&isFocus" :src="dark_close" @mousedown.prevent="clearInput" />
      </div>
    </div>

    <div v-if="inputType === 'checkbox'" class="common-check-area">
      <!-- <input type="checkbox" class="checkbox-input"></input> -->
      <div :class="['checkbox', checked ? 'box-checked' : 'box-unchecked']" @click="handleCheck">
        <img v-if="checked" :src="check_icon" />
      </div>
      <div :style="{ fontSize: fontSize + 'px' }">{{ title }}</div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed } from 'vue'
import dark_close from '../assets/icons/dark_close_icon.svg'
import check_icon from '../assets/icons/meeting_control_checked.svg'
// const isChecked = ref(false)
const isFocus = ref(false)
const props = defineProps({
  modelValue: {
    type: [Number, String, Boolean],
    default: '0'
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
  maxLen: { type: Number, default: 10 }
})

const emit = defineEmits(['update:modelValue', 'change'])
const checked = computed({
  get: () => props.modelValue === '1' || props.modelValue === 1 || props.modelValue === true,
  set: (v) => {
    const out = v ? '1' : '0'          // ✅ setter：往父组件发 '1' / '0'
    emit('update:modelValue', out)
    emit('change', out)
  }
})
const handleClick = ()=>{
  isFocus.value = true
}
const handleCheck = () => {
  checked.value = !checked.value
}
const inputRef = ref(null)
function countSpaces(str) {
  return str.split(' ').length - 1;
}
const onInput = (e) => {
  let val = e.target.value
  const noSpaces = val.replaceAll(' ', '')
  if (noSpaces.length > props.maxLen) {
    // 截断到 maxLen（这里简单处理，不补空格）
    val = noSpaces.slice(0, props.maxLen)
    e.target.value = val
  }
  emit('update:modelValue', val)
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

  .checkbox-input {
    margin-left: 0;
    width: 16px;
    height: 16px;
  }

  .common-input {
    width: calc(100% - 32px);
    border: none;
    outline: none;
    padding-left: 6px;
  }

  .common-input:focus {
    border: none;
    outline: none;
  }

  .common-check-area {
    display: flex;
    align-items: center;
  }

  .checkbox {
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--checkbox-size);
    width: var(--checkbox-size);
    border: 2px solid rgb(188, 193, 204);
    border-radius: 3px;
    user-select: none;
    margin-right: 8px;
  }

  .box-checked {
    background-color: rgb(25, 140, 255);
    border: 2px solid rgb(25, 140, 255);

    &:hover {
      background-color: rgb(25, 140, 255);
      border: 2px solid rgb(25, 140, 255);
    }
  }

  .box-unchecked {
    background-color: white;

    &:hover {
      border: 2px solid rgb(0, 111, 255);
    }
  }
}
</style>