# language: fr
Fonctionnalité: Référentiel de compétences

  Scénario: Créer une compétence en normalisant les espaces
    Quand j’envoie une requête POST sur "/skills" avec le corps :
      """
      { "name": "  {tag}   Vue  3 ", "category": "Front" }
      """
    Alors je reçois le statut 201
    Et le champ "name" vaut "{tag} Vue 3"
    Et le champ "kind" vaut "technical"
    Et le champ "category" vaut "Front"
    Et le champ "active" vaut "true"
    Et le champ "merged_into_id" vaut "null"

  Scénario: Refuser un doublon sans tenir compte de la casse
    Soit l'élément "angular" est créé sur "/skills" avec le corps :
      """
      { "name": "{tag} Angular" }
      """
    Quand j’envoie une requête POST sur "/skills" avec le corps :
      """
      { "name": "{tag} ANGULAR" }
      """
    Alors je reçois l’erreur "SKILL_DUPLICATE" avec le statut 409

  Plan du Scénario: Refuser une saisie invalide
    Quand j’envoie une requête POST sur "/skills" avec le corps :
      """
      <corps>
      """
    Alors je reçois l’erreur "VALIDATION_ERROR" avec le statut 400

    Exemples:
      | corps                                    |
      | {}                                       |
      | { "name": "   " }                        |
      | { "name": "{tag} X", "kind": "autre" }   |
      | { "name": "{tag} X", "inconnu": 1 }      |

  Scénario: Un identifiant mal formé est refusé et un identifiant inconnu est introuvable
    Quand je lis "/skills/pas-un-uuid"
    Alors je reçois l’erreur "VALIDATION_ERROR" avec le statut 400
    Quand je lis "/skills/3f2b8c1e-5d4a-4e7b-9c6a-1b2c3d4e5f60"
    Alors je reçois l’erreur "SKILL_NOT_FOUND" avec le statut 404
    Quand j’envoie une requête PATCH sur "/skills/3f2b8c1e-5d4a-4e7b-9c6a-1b2c3d4e5f60" avec le corps :
      """
      { "name": "X" }
      """
    Alors je reçois l’erreur "SKILL_NOT_FOUND" avec le statut 404

  Scénario: Modifier puis désactiver une compétence
    Soit l'élément "cobol" est créé sur "/skills" avec le corps :
      """
      { "name": "{tag} Cobol" }
      """
    Quand j’envoie une requête PATCH sur "/skills/{id:cobol}" avec le corps :
      """
      { "name": "{tag} COBOL", "kind": "functional" }
      """
    Alors je reçois le statut 200
    Et le champ "name" vaut "{tag} COBOL"
    Et le champ "kind" vaut "functional"
    Quand j’envoie une requête PATCH sur "/skills/{id:cobol}" avec le corps :
      """
      { "active": false }
      """
    Alors le champ "active" vaut "false"
    Quand je lis "/skills?active=false&q={tag}"
    Alors la liste contient "cobol"
    Quand je lis "/skills/suggest?q={tag} COBOL"
    Alors la liste est vide

  Scénario: L'autocomplétion propose d'abord les noms qui commencent par la saisie
    Soit l'élément "javascript" est créé sur "/skills" avec le corps :
      """
      { "name": "{tag}-JavaScript" }
      """
    Et l'élément "java" est créé sur "/skills" avec le corps :
      """
      { "name": "{tag}-Java" }
      """
    Et l'élément "core" est créé sur "/skills" avec le corps :
      """
      { "name": "Core {tag}-Java" }
      """
    Quand je lis "/skills/suggest?q={tag}-java"
    Alors je reçois le statut 200
    Et les valeurs du champ "name" de la liste sont, dans l’ordre :
      | {tag}-Java       |
      | {tag}-JavaScript |
      | Core {tag}-Java  |
    Quand je lis "/skills/suggest?q={tag}-java&limit=1"
    Alors la liste contient 1 élément
    Quand je lis "/skills/suggest?q="
    Alors la liste est vide
    Quand je lis "/skills/suggest?q=a&limit=500"
    Alors je reçois l’erreur "VALIDATION_ERROR" avec le statut 400

  Scénario: Fusionner un doublon dans l'élément canonique
    Soit l'élément "react" est créé sur "/skills" avec le corps :
      """
      { "name": "{tag} React" }
      """
    Et l'élément "reactjs" est créé sur "/skills" avec le corps :
      """
      { "name": "{tag} ReactJS" }
      """
    Quand j’envoie une requête POST sur "/skills/{id:reactjs}/merge" avec le corps :
      """
      { "target_id": "{id:react}" }
      """
    Alors je reçois le statut 200
    Et le champ "id" vaut l’identifiant de "react"
    Quand je lis "/skills/{id:reactjs}"
    Alors le champ "merged_into_id" vaut l’identifiant de "react"
    Et le champ "active" vaut "false"
    Quand je lis "/skills?q={tag} React"
    Alors la liste contient "react"
    Et la liste ne contient pas "reactjs"
    Quand je lis "/skills?q={tag} React&include_merged=true"
    Alors la liste contient 2 éléments
    Quand je lis "/skills/suggest?q={tag} ReactJS"
    Alors la liste contient "react"

  Scénario: Refuser les fusions incohérentes
    Soit l'élément "a" est créé sur "/skills" avec le corps :
      """
      { "name": "{tag} Merge A" }
      """
    Et l'élément "b" est créé sur "/skills" avec le corps :
      """
      { "name": "{tag} Merge B" }
      """
    Et l'élément "c" est créé sur "/skills" avec le corps :
      """
      { "name": "{tag} Merge C" }
      """
    Et l'élément "off" est créé sur "/skills" avec le corps :
      """
      { "name": "{tag} Merge Off", "active": false }
      """
    Quand j’envoie une requête POST sur "/skills/{id:a}/merge" avec le corps :
      """
      { "target_id": "{id:a}" }
      """
    Alors je reçois l’erreur "VALIDATION_ERROR" avec le statut 400
    Quand j’envoie une requête POST sur "/skills/{id:a}/merge" avec le corps :
      """
      {}
      """
    Alors je reçois l’erreur "VALIDATION_ERROR" avec le statut 400
    Quand j’envoie une requête POST sur "/skills/{id:a}/merge" avec le corps :
      """
      { "target_id": "3f2b8c1e-5d4a-4e7b-9c6a-1b2c3d4e5f60" }
      """
    Alors je reçois l’erreur "SKILL_NOT_FOUND" avec le statut 404
    Quand j’envoie une requête POST sur "/skills/{id:a}/merge" avec le corps :
      """
      { "target_id": "{id:off}" }
      """
    Alors je reçois l’erreur "SKILL_TARGET_INACTIVE" avec le statut 409
    Quand j’envoie une requête POST sur "/skills/{id:a}/merge" avec le corps :
      """
      { "target_id": "{id:b}" }
      """
    Alors je reçois le statut 200
    Quand j’envoie une requête POST sur "/skills/{id:a}/merge" avec le corps :
      """
      { "target_id": "{id:c}" }
      """
    Alors je reçois l’erreur "SKILL_ALREADY_MERGED" avec le statut 409
    Quand j’envoie une requête POST sur "/skills/{id:c}/merge" avec le corps :
      """
      { "target_id": "{id:a}" }
      """
    Alors je reçois l’erreur "SKILL_TARGET_MERGED" avec le statut 409
    Quand j’envoie une requête PATCH sur "/skills/{id:a}" avec le corps :
      """
      { "active": true }
      """
    Alors je reçois l’erreur "SKILL_MERGED" avec le statut 409

  Scénario: Les fusions successives sont aplaties
    Soit l'élément "a" est créé sur "/skills" avec le corps :
      """
      { "name": "{tag} Chain A" }
      """
    Et l'élément "b" est créé sur "/skills" avec le corps :
      """
      { "name": "{tag} Chain B" }
      """
    Et l'élément "c" est créé sur "/skills" avec le corps :
      """
      { "name": "{tag} Chain C" }
      """
    Quand j’envoie une requête POST sur "/skills/{id:a}/merge" avec le corps :
      """
      { "target_id": "{id:b}" }
      """
    Et j’envoie une requête POST sur "/skills/{id:b}/merge" avec le corps :
      """
      { "target_id": "{id:c}" }
      """
    Et je lis "/skills/{id:a}"
    Alors le champ "merged_into_id" vaut l’identifiant de "c"

  Scénario: La saisie libre réutilise la compétence existante ou la crée
    Quand j’envoie une requête POST sur "/skills/resolve" avec le corps :
      """
      { "name": "{tag}  Kotlin" }
      """
    Alors je reçois le statut 201
    Et le champ "name" vaut "{tag} Kotlin"
    Soit l'élément "kotlin" est créé sur "/skills" avec le corps :
      """
      { "name": "{tag} Kotlin/JVM" }
      """
    Quand j’envoie une requête POST sur "/skills/resolve" avec le corps :
      """
      { "name": "{tag} kotlin/jvm" }
      """
    Alors je reçois le statut 200
    Et le champ "id" vaut l’identifiant de "kotlin"

  Scénario: Une compétence désactivée ne peut pas être réutilisée
    Soit l'élément "go" est créé sur "/skills" avec le corps :
      """
      { "name": "{tag} Go", "active": false }
      """
    Quand j’envoie une requête POST sur "/skills/resolve" avec le corps :
      """
      { "name": "{tag} go" }
      """
    Alors je reçois l’erreur "SKILL_DISABLED" avec le statut 409
    Quand j’envoie une requête POST sur "/skills/resolve" avec le corps :
      """
      { "name": "" }
      """
    Alors je reçois l’erreur "VALIDATION_ERROR" avec le statut 400
