<script setup lang="ts">
/** Home page: application title and API status. */
import { computed, onMounted } from 'vue'
import { getHealth } from '@/api/health/health.api'
import ApiStatus from '@/components/ApiStatus.vue'
import { useLoadState } from '@/composables/useLoadState'
import { errorMessage } from '@/utils/errors/error-message'

const { data: health, error, load } = useLoadState(getHealth)
const message = computed(() => (error.value ? errorMessage(error.value) : null))

onMounted(load)
</script>

<template>
  <section class="home">
    <h1>CViP</h1>
    <p>Gestion des CV des consultants.</p>
    <ApiStatus :health="health" :error="message" />
  </section>
</template>

<style scoped lang="scss">
.home {
  max-width: 40rem;
  margin: 0 auto;
  padding: 2rem 1rem;
}
</style>
