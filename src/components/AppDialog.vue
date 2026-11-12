<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  width: { type: String, default: '560px' },
})

defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="show" class="dialog-mask" @click.self="$emit('close')">
        <div class="dialog" :style="{ maxWidth: width }">
          <header class="dialog-head">
            <h3>{{ title }}</h3>
            <button class="icon-btn" type="button" @click="$emit('close')">
              <AppIcon name="close" :size="18" />
            </button>
          </header>
          <div class="dialog-body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="dialog-foot">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
