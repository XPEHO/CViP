/** CRUD router shared by the referentials, built from the handlers of a controller. */
import { Router } from 'express'
import type {
  MergeableReferentialController,
  ReferentialController,
} from '../controllers/referential.controller.ts'

/** Tells whether the controller also handles autocomplete and merge. */
const isMergeable = (
  controller: ReferentialController | MergeableReferentialController,
): controller is MergeableReferentialController => 'handleMergeReferential' in controller

/**
 * Creates the router of a referential. `extend` declares the specific routes, before `/:id`.
 * Items are never deleted: they are disabled or merged, which preserves the CVs.
 */
export const createReferentialRouter = (
  controller: ReferentialController | MergeableReferentialController,
  extend?: (router: Router) => void,
): Router => {
  const router = Router()

  extend?.(router)
  if (isMergeable(controller)) router.get('/suggest', controller.handleSuggestReferential)
  router.get('/', controller.handleListReferential)
  router.get('/:id', controller.handleGetReferential)
  router.post('/', controller.handleCreateReferential)
  router.patch('/:id', controller.handleUpdateReferential)
  if (isMergeable(controller)) router.post('/:id/merge', controller.handleMergeReferential)

  return router
}
