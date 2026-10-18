<script setup lang="ts">
import { TooltipProvider } from 'reka-ui'
import AppLayout from './components/AppLayout.vue'
import AppSidebar from './components/AppSidebar.vue'
import AppDialogs from './components/AppDialogs.vue'
import AppToasts from './components/AppToasts.vue'
</script>

<template>
  <TooltipProvider :delay-duration="400">
    <AppLayout>
      <template #sidebar>
        <AppSidebar />
      </template>
      <RouterView />
    </AppLayout>
  </TooltipProvider>
  <AppDialogs />
  <AppToasts />
</template>
