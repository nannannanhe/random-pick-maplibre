<script setup lang="ts">
import { ja } from './locales/ja'
</script>

<template>
  <!-- レイアウトは後続ステップで実装する -->
  <h1 class="title">
    {{ ja.app.titleParts.before }}<span class="accent">{{ ja.app.titleParts.accent }}</span
    >{{ ja.app.titleParts.after }}
  </h1>
</template>

<style scoped>
.title {
  margin: 0;
  padding: 16px;
}

.accent {
  color: var(--accent);
}
</style>
