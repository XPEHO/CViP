<script setup lang="ts">
/** API status message: checking, available, database unreachable or error. */
import type { Health } from '@/api/health/health.api'

defineProps<{
  health: Health | null
  /** Error message to display instead of the state; `null` when there is no error. */
  error: string | null
}>()
</script>

<template>
  <!-- <output> implicitly has the "status" role: announced by screen readers. -->
  <output class="api-status">
    <template v-if="error">{{ error }}</template>
    <template v-else-if="!health">Vérification de l'API…</template>
    <template v-else-if="health.status === 'ok'">API et base de données disponibles.</template>
    <template v-else>API disponible, base de données injoignable.</template>
  </output>
</template>

<style scoped lang="scss">
.api-status {
  display: block;
  color: var(--color-muted);
}
</style>
