/** Global hooks: default timeout and wait for the API to be available before the suite. */
import { BeforeAll, setDefaultTimeout } from '@cucumber/cucumber'
import { setTimeout as sleep } from 'node:timers/promises'
import { API_URL } from './http.ts'

setDefaultTimeout(15_000)

/** Waits until `/health` answers 200 (the Docker stack may still be starting). */
async function waitForHealth(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      if ((await fetch(`${API_URL}/health`)).ok) return
    } catch {
      // API not reachable yet
    }
    await sleep(1000) // NOSONAR S9382: polling is sequential by nature
  }
  throw new Error(`API injoignable sur ${API_URL}/health après ${timeoutMs / 1000} s`)
}

BeforeAll({ timeout: 90_000 }, async () => {
  await waitForHealth(60_000)
})
