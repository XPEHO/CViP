/** Steps specific to the skill level scale. */
import { Then } from '@cucumber/cucumber'
import type { DataTable } from '@cucumber/cucumber'
import assert from 'node:assert/strict'
import type { CvipWorld } from '../support/world.ts'

// Other scenarios create high-rank levels: only the default scale (ranks 1 to 5) is compared.
Then(
  'les libellés des niveaux de rang 1 à 5 sont, dans l’ordre :',
  function (this: CvipWorld, table: DataTable) {
    assert.ok(Array.isArray(this.response.body), 'Une liste est attendue')
    const levels = this.response.body as { rank: number; label_fr: string }[]
    assert.deepEqual(
      levels.filter((level) => level.rank <= 5).map((level) => level.label_fr),
      table.raw().map(([label]) => label),
    )
  },
)
