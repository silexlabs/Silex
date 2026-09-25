<script setup lang="ts">
import AppLayout from './components/AppLayout.vue'
import AppSidebar from './components/AppSidebar.vue'
import AppDialogs from './components/AppDialogs.vue'
import AppToasts from './components/AppToasts.vue'
</script>

<template>
  <AppLayout>
    <template #sidebar>
      <AppSidebar />
    </template>
    <RouterView />
  </AppLayout>
  <AppDialogs />
  <AppToasts />
</template>
