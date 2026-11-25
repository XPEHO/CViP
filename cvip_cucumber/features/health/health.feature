# language: fr
Fonctionnalité: Santé de l'API

  Scénario: Le contrôle de santé est public et signale la base connectée
    Quand je lis "/health"
    Alors je reçois le statut 200
    Et le champ "status" vaut "ok"
    Et le champ "db" vaut "connected"

  Scénario: Une route inconnue renvoie une erreur structurée
    Quand je lis "/inconnue"
    Alors je reçois l’erreur "NOT_FOUND" avec le statut 404

  Scénario: Un corps JSON mal formé renvoie BAD_REQUEST
    Quand j’envoie une requête POST sur "/skills" avec le corps brut "{pas du json"
    Alors je reçois l’erreur "BAD_REQUEST" avec le statut 400
