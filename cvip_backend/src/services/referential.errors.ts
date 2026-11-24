/** Business errors of the referentials, thrown by the services and translated into API codes by the controllers. */

/** Item not found. */
export class ReferentialNotFoundError extends Error {
  constructor(message = 'Élément introuvable') {
    super(message)
    this.name = 'ReferentialNotFoundError'
  }
}

/** An identical item already exists. */
export class ReferentialDuplicateError extends Error {
  constructor(message = 'Un élément identique existe déjà') {
    super(message)
    this.name = 'ReferentialDuplicateError'
  }
}

/** Update of an item already merged into another. */
export class ReferentialMergedError extends Error {
  constructor(message = "Élément fusionné : modifiez l'élément dans lequel il a été fusionné") {
    super(message)
    this.name = 'ReferentialMergedError'
  }
}

/** Merge of an item that has already been merged. */
export class ReferentialAlreadyMergedError extends Error {
  constructor(message = 'Cet élément a déjà été fusionné') {
    super(message)
    this.name = 'ReferentialAlreadyMergedError'
  }
}

/** Merge into a target that has itself been merged. */
export class ReferentialTargetMergedError extends Error {
  constructor(message = "L'élément cible a lui-même été fusionné") {
    super(message)
    this.name = 'ReferentialTargetMergedError'
  }
}

/** Merge into a disabled target. */
export class ReferentialTargetInactiveError extends Error {
  constructor(message = "L'élément cible est désactivé") {
    super(message)
    this.name = 'ReferentialTargetInactiveError'
  }
}

/** Use of a disabled skill. */
export class SkillDisabledError extends Error {
  constructor(name: string) {
    super(`La compétence « ${name} » est désactivée`)
    this.name = 'SkillDisabledError'
  }
}
