# language: fr
Fonctionnalité: Référentiels de secteurs et de certifications

  Scénario: Un secteur se retrouve par son libellé anglais
    Soit l'élément "banque" est créé sur "/sectors" avec le corps :
      """
      { "name_fr": "{tag} Banque", "name_en": "{tag} Banking" }
      """
    Quand je lis "/sectors/suggest?q={tag} Bankin"
    Alors la liste contient "banque"

  Scénario: Refuser un secteur en double
    Soit l'élément "banque" est créé sur "/sectors" avec le corps :
      """
      { "name_fr": "{tag} Assurance" }
      """
    Quand j’envoie une requête POST sur "/sectors" avec le corps :
      """
      { "name_fr": "{tag} ASSURANCE" }
      """
    Alors je reçois l’erreur "SECTOR_DUPLICATE" avec le statut 409

  Scénario: Fusionner deux secteurs
    Soit l'élément "banque" est créé sur "/sectors" avec le corps :
      """
      { "name_fr": "{tag} Banque" }
      """
    Et l'élément "finance" est créé sur "/sectors" avec le corps :
      """
      { "name_fr": "{tag} Finance" }
      """
    Quand j’envoie une requête POST sur "/sectors/{id:finance}/merge" avec le corps :
      """
      { "target_id": "{id:banque}" }
      """
    Alors je reçois le statut 200
    Quand je lis "/sectors/{id:finance}"
    Alors le champ "merged_into_id" vaut l’identifiant de "banque"
    Quand j’envoie une requête POST sur "/sectors/{id:finance}/merge" avec le corps :
      """
      { "target_id": "{id:banque}" }
      """
    Alors je reçois l’erreur "SECTOR_ALREADY_MERGED" avec le statut 409

  Scénario: Un secteur inconnu est introuvable
    Quand je lis "/sectors/3f2b8c1e-5d4a-4e7b-9c6a-1b2c3d4e5f60"
    Alors je reçois l’erreur "SECTOR_NOT_FOUND" avec le statut 404

  Scénario: Des certifications homonymes d'organismes différents coexistent
    Soit l'élément "aws" est créé sur "/certifications" avec le corps :
      """
      { "name": "{tag} Architect", "organization": "AWS" }
      """
    Et l'élément "azure" est créé sur "/certifications" avec le corps :
      """
      { "name": "{tag} Architect", "organization": "Azure" }
      """
    Quand j’envoie une requête POST sur "/certifications" avec le corps :
      """
      { "name": "{tag} architect", "organization": "aws" }
      """
    Alors je reçois l’erreur "CERTIFICATION_DUPLICATE" avec le statut 409

  Scénario: Fusionner une certification en double
    Soit l'élément "aws" est créé sur "/certifications" avec le corps :
      """
      { "name": "{tag} Architect", "organization": "AWS" }
      """
    Et l'élément "doublon" est créé sur "/certifications" avec le corps :
      """
      { "name": "{tag} AWS Architect" }
      """
    Quand j’envoie une requête POST sur "/certifications/{id:doublon}/merge" avec le corps :
      """
      { "target_id": "{id:aws}" }
      """
    Alors je reçois le statut 200
    Quand je lis "/certifications/{id:doublon}"
    Alors le champ "merged_into_id" vaut l’identifiant de "aws"
    Et le champ "active" vaut "false"
