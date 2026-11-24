<script setup lang="ts">
/** Shared layout: skip link, header and content area where the current view is displayed. */
import { RouterLink, RouterView } from 'vue-router'
import { RouteName } from '@/router/route-name'
</script>

<template>
  <a class="skip-link" href="#contenu">Aller au contenu</a>
  <header class="app-header">
    <RouterLink :to="{ name: RouteName.Home }" class="app-header__brand">CViP</RouterLink>
  </header>
  <main id="contenu">
    <RouterView />
  </main>
</template>

<style scoped lang="scss">
.skip-link {
  position: absolute;
  left: 0.5rem;
  top: -4rem;
  padding: 0.5rem 1rem;
  background: var(--color-surface);
  color: var(--color-text);
  border: 2px solid var(--color-primary);
  z-index: 10;

  &:focus {
    top: 0.5rem;
  }
}

.app-header {
  padding: 1rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);

  &__brand {
    font-weight: 700;
    font-size: 1.25rem;
    color: var(--color-primary);
    text-decoration: none;
  }
}
</style>
