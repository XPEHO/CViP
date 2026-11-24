/** Loading state composable: runs an asynchronous call and exposes data, error and pending state. */
import { ref, type Ref } from 'vue'

/** State returned by `useLoadState`. */
export interface LoadState<T> {
  data: Ref<T | null>
  error: Ref<unknown>
  loading: Ref<boolean>
  load: () => Promise<void>
}

/** Wraps `loader`: `load()` fills `data` or `error` and never throws. */
export function useLoadState<T>(loader: () => Promise<T>): LoadState<T> {
  const data = ref<T | null>(null) as Ref<T | null>
  const error = ref<unknown>(null)
  const loading = ref(false)

  /** Runs the load; a failure is stored in `error`, it does not throw. */
  async function load(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      data.value = await loader()
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  return { data, error, loading, load }
}
