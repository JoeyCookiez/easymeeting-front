<!-- IconWithTitle.vue -->
<template>
  <div
    class="icon-with-title"
    :style="{
      '--icon-size': iconSizeCss,
      '--font-size': fontSizeCss
    }"
    :aria-label="title || undefined"
  >
    <!-- 建议传入已通过构建工具解析后的本地 SVG 路径（例如 import 得到的 URL） -->
    <img class="icon" :src="svgSrc" alt="" aria-hidden="true" />
    <span class="label" v-if="title">{{ title }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** 本地 svg 路径（建议：import xxx from '.../xxx.svg' 后传入）或可访问的 URL */
  svgSrc: { type: String, required: true },
  /** 展示文字 */
  title: { type: String, default: '' },
  /** 图标大小，数字按 px 处理，也可直接传入 '2rem'、'24px' 等 */
  iconSize: { type: [Number, String], default: 22 },
  /** 字体大小，数字按 px 处理，也可直接传入 '1rem'、'16px' 等 */
  fontSize: { type: [Number, String], default: 10 }
})

const toCssSize = (v) => (typeof v === 'number' ? `${v}px` : String(v))
const iconSizeCss = computed(() => toCssSize(props.iconSize))
const fontSizeCss = computed(() => toCssSize(props.fontSize))
</script>

<style scoped>
.icon-with-title {
  display: inline-flex;
  flex-direction: column;        /* 图标在上，文字在下 */
  align-items: center;           /* 水平居中 */
  justify-content: center;
  text-align: center;
  min-width: 40px;
  padding: 8px 10px;             /* 给悬停背景一些内边距 */
  border-radius: 6px;            /* 6px 圆角 */
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.icon-with-title:hover {
  background-color: rgb(229, 229, 229); /* 悬停背景色 */
}

.icon {
  width: var(--icon-size);
  height: var(--icon-size);
  display: block;
  object-fit: contain;
}

.label {
  font-size: var(--font-size);
  line-height: 1.2;
  margin-top: 6px;               /* 图标与文字的间距 */
}
</style>