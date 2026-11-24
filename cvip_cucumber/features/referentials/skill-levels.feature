# language: fr
Fonctionnalité: Échelle de niveaux de compétence

  Scénario: Une échelle de 1 à 5 est proposée par défaut
    Quand je lis "/skill-levels?active=true"
    Alors je reçois le statut 200
    Et les libellés des niveaux de rang 1 à 5 sont, dans l’ordre :
      | Notions       |
      | Débutant      |
      | Intermédiaire |
      | Confirmé      |
      | Expert        |

  Scénario: Créer, réordonner et désactiver des niveaux
    Soit l'élément "bas" est créé sur "/skill-levels" avec le corps :
      """
      { "label_fr": "{tag} Bas", "rank": {rank} }
      """
    Et l'élément "haut" est créé sur "/skill-levels" avec le corps :
      """
      { "label_fr": "{tag} Haut", "label_en": "High", "rank": {rank+1} }
      """
    Quand j’envoie une requête PUT sur "/skill-levels/order" avec le corps :
      """
      { "ids": ["{id:haut}", "{id:bas}"] }
      """
    Alors je reçois le statut 200
    Et dans la liste, "haut" a pour "rank" la valeur "{rank}"
    Et dans la liste, "bas" a pour "rank" la valeur "{rank+1}"
    Quand j’envoie une requête PATCH sur "/skill-levels/{id:bas}" avec le corps :
      """
      { "active": false }
      """
    Alors le champ "active" vaut "false"

  Scénario: Refuser un rang invalide ou déjà pris
    Soit l'élément "bas" est créé sur "/skill-levels" avec le corps :
      """
      { "label_fr": "{tag} Bas", "rank": {rank} }
      """
    Et l'élément "haut" est créé sur "/skill-levels" avec le corps :
      """
      { "label_fr": "{tag} Haut", "rank": {rank+1} }
      """
    Quand j’envoie une requête POST sur "/skill-levels" avec le corps :
      """
      { "label_fr": "{tag} Zéro", "rank": 0 }
      """
    Alors je reçois l’erreur "VALIDATION_ERROR" avec le statut 400
    Quand j’envoie une requête PATCH sur "/skill-levels/{id:bas}" avec le corps :
      """
      { "rank": {rank+1} }
      """
    Alors je reçois le statut 409

  Scénario: Refuser un réordonnancement invalide
    Soit l'élément "bas" est créé sur "/skill-levels" avec le corps :
      """
      { "label_fr": "{tag} Bas", "rank": {rank} }
      """
    Quand j’envoie une requête PUT sur "/skill-levels/order" avec le corps :
      """
      { "ids": [] }
      """
    Alors je reçois l’erreur "VALIDATION_ERROR" avec le statut 400
    Quand j’envoie une requête PUT sur "/skill-levels/order" avec le corps :
      """
      { "ids": ["{id:bas}", "{id:bas}"] }
      """
    Alors je reçois l’erreur "VALIDATION_ERROR" avec le statut 400
    Quand j’envoie une requête PUT sur "/skill-levels/order" avec le corps :
      """
      { "ids": ["3f2b8c1e-5d4a-4e7b-9c6a-1b2c3d4e5f60"] }
      """
    Alors je reçois l’erreur "SKILL_LEVEL_NOT_FOUND" avec le statut 404
