<template>
  <div class="layout">
    <div class="layout__sidebar">
      <slot name="sidebar" />
    </div>
    <main class="layout__main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template: 'sidebar main' 1fr / 240px 1fr;
  height: 100vh;
}

.layout__sidebar {
  grid-area: sidebar;
  border-right: 1px solid var(--silex-border-color);
  background: var(--silex-bg-main);
}

.layout__main {
  grid-area: main;
  overflow: auto;
  padding: var(--silex-space-8) var(--silex-space-8) 96px;
  scroll-padding-bottom: 96px;
}
</style>
