import { Router } from 'express'
import skills from './skills.js'
import skillLevels from './skill-levels.js'
import sectors from './sectors.js'
import certifications from './certifications.js'

// Référentiels du CV maître (CVIP-15).
// Contrôle d'accès suivi par CVIP-12 : écritures réservées aux rôles RH et Administrateur ;
// l'autocomplétion (GET /suggest) et POST /skills/resolve restent ouverts à tout utilisateur connecté.
const router = Router()

router.use('/skills', skills)
router.use('/skill-levels', skillLevels)
router.use('/sectors', sectors)
router.use('/certifications', certifications)

export default router
