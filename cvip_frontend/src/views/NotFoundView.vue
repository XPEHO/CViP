<script setup lang="ts">
/** Page displayed when the address matches no route of the application. */
import { RouterLink } from 'vue-router'
import { RouteName } from '@/router/route-name'
</script>

<template>
  <section class="not-found">
    <h1>Page introuvable</h1>
    <p>L'adresse demandée n'existe pas.</p>
    <RouterLink :to="{ name: RouteName.Home }">Retour à l'accueil</RouterLink>
  </section>
</template>

<style scoped lang="scss">
.not-found {
  max-width: 40rem;
  margin: 0 auto;
  padding: 2rem 1rem;
}
</style>
