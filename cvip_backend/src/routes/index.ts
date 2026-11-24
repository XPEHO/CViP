/** Main router: mounts the master CV referentials (the `/api` prefix is stripped by the proxy). */
import { Router } from 'express'
import { certificationRouter } from './certification.routes.ts'
import { sectorRouter } from './sector.routes.ts'
import { skillLevelRouter } from './skill-level.routes.ts'
import { skillRouter } from './skill.routes.ts'

// No access control yet: writes will be restricted to the HR and Administrator roles;
// autocomplete (GET /suggest) and POST /skills/resolve will stay open to any signed-in user.

/** Referentials router. */
export const router = Router()

router.use('/skills', skillRouter)
router.use('/skill-levels', skillLevelRouter)
router.use('/sectors', sectorRouter)
router.use('/certifications', certificationRouter)
