# Cahier des charges – Application de gestion de CV (ESN)

Oct 27, 2026 · @baal

## 1. Contexte et objectifs

L'ESN a besoin d'un outil unique pour tenir à jour les CV de ses consultants, produire des versions adaptées à chaque appel d'offres et les partager aux clients par lien sécurisé. L'outil sert aussi de référentiel clients / projets / missions pour savoir qui travaille où. L'ESN compte aujourd'hui une cinquantaine de consultants et 2 à 3 commerciaux, sur une seule agence.

**Objectifs mesurables**

- Un CV à jour par consultant, maintenu par le consultant lui-même.
- Réduire le temps de préparation d'un CV adapté à une proposition commerciale (cible à fixer, ex. moins de 15 min).
- Partager un CV à un prospect sans envoi de fichier Word/PDF, avec contrôle d'accès et traçabilité des consultations.
- Alimenter automatiquement la rubrique « Expériences » des CV à partir des missions réalisées dans l'ESN.
- Disposer d'une vue fiable des missions en cours et de la disponibilité (intercontrat) des consultants.

**Hors périmètre (à confirmer)** : facturation, temps passés (CRA), paie, recrutement / ATS, gestion des congés.

## 2. Acteurs et rôles

Cinq profils d'utilisateurs internes, plus le client externe qui consulte un CV partagé sans compte dans l'application.

| Rôle | Peut faire | Ne peut pas faire |
| --- | --- | --- |
| Consultant (collaborateur) | Mettre à jour son CV maître ; voir ses missions ; voir les versions commerciales de son CV (à confirmer) | Voir les CV des autres ; partager son CV à un client |
| Commercial / Business manager | Rechercher des consultants ; créer et modifier des versions de CV ; générer des liens de partage ; gérer clients, projets, missions | Modifier le CV maître d'un consultant (à confirmer) |
| Manager / Responsable d'agence | Voir les CV et missions de son équipe ; valider les CV (si workflow de validation) | Administrer l'application |
| RH | Créer / désactiver les comptes collaborateurs ; voir tous les CV ; gérer les référentiels (compétences, diplômes) | Gérer les clients et missions (à confirmer) |
| Administrateur | Paramétrage, rôles, modèles de CV, charte graphique, journaux d'audit | — |
| Client / prospect (externe) | Consulter un CV partagé via URL + identifiant, pendant la durée de validité du lien ; télécharger en PDF (option) | Tout le reste |

## 3. Exigences fonctionnelles

L'application s'articule autour de cinq modules ; le principe central est un **CV maître** par consultant, dont les commerciaux dérivent des **versions** adaptées, qui sont ensuite **partagées** par lien.

### 3.1 CV maître du consultant

1. Rubriques du CV :
   1. Identité et titre (prénom, nom ou initiales, intitulé de poste, années d'expérience, photo optionnelle).
   2. Résumé / accroche.
   3. Compétences techniques et fonctionnelles, avec niveau (ex. 1 à 5) et années de pratique.
   4. Langues avec niveau (CECRL A1–C2).
   5. Formation initiale (diplôme, établissement, année).
   6. Formations continues et certifications (organisme, date d'obtention, date d'expiration).
   7. Expériences : missions ESN (alimentées depuis le module Missions) et expériences antérieures saisies librement.
   8. Secteurs d'activité, centres d'intérêt (option).
2. Saisie assistée : référentiel de compétences avec autocomplétion pour éviter les doublons (« React » / « ReactJS »).
3. Import d'un CV existant (Word / PDF) pour l'amorçage, avec extraction automatique à relire (option, lot 2).
4. Indicateur de complétude et date de dernière mise à jour ; relance automatique par e-mail si le CV n'a pas été mis à jour depuis X mois.
5. Historique des modifications du CV maître.
6. Workflow de validation par le manager avant publication (à confirmer).

### 3.2 Versions commerciales du CV

1. Un commercial crée une version à partir du CV maître d'un consultant, éventuellement rattachée à une opportunité ou un client.
2. Dans une version, il peut : masquer ou réordonner des rubriques et des expériences, réécrire le résumé et le titre, mettre en avant des compétences, anonymiser (initiales à la place du nom, pas de photo).
3. Choix de la langue (FR / EN) et du modèle de mise en page.
4. Une version est un instantané : si le CV maître change ensuite, la version n'est pas modifiée automatiquement ; un indicateur signale l'écart et propose de resynchroniser.
5. Statuts d'une version : brouillon, prête, envoyée, archivée.
6. Duplication d'une version existante.

### 3.3 Génération HTML et partage client

1. Rendu HTML du CV (maître ou version) selon un modèle à la charte de l'ESN, responsive, imprimable.
2. Export PDF depuis le rendu HTML ; téléchargement activable ou non pour chaque lien ; filigrane portant l'e-mail du lecteur et la date.
3. Création d'un lien de partage : URL unique non devinable, rattachée à un client, avec un mode d'accès choisi par le commercial :
   - **Domaine (par défaut)** : toute adresse du domaine du client (ex. @client.fr) obtient l'accès par un code à usage unique envoyé par e-mail. Mode indisponible pour les messageries grand public (gmail, outlook…).
   - **Nominatif** : accès réservé à une liste d'adresses, toujours par code e-mail.
   - **Mot de passe (secours)** : URL + mot de passe transmis par un autre canal, pour les cas où les destinataires sont inconnus (plateformes d'achat).
4. Durées : code valable 10 minutes ; accès maintenu quelques jours sur le même appareil ; expiration du lien à la date fixée par le commercial (30 jours par défaut, à confirmer).
5. Transfert interne chez le client : le destinataire transfère le lien à un collègue de son domaine, qui obtient son propre code ; un bouton « Partager avec un collègue » sur la page envoie l'invitation. Une adresse hors domaine déclenche une demande d'accès, validée ou refusée par le commercial.
6. Révocation globale du lien ou ciblée sur un lecteur.
7. Traçabilité : chaque consultation est nominative (e-mail, date, téléchargement). Notifications au commercial : première consultation, nouveau lecteur, demande d'accès hors domaine.
8. Possibilité de partager plusieurs CV dans un même lien (dossier de candidature pour un appel d'offres) — à confirmer.
9. Mention de confidentialité sur le rendu partagé.

### 3.4 Clients, projets et missions

1. **Clients** : raison sociale, SIRET, secteur, adresse, contacts (nom, fonction, e-mail, téléphone).
2. **Projets** : rattachés à un client ; intitulé, description, contexte technique, dates.
3. **Missions** : rattachées à un projet ; un ou plusieurs consultants, chacun avec son rôle, sa date de début, sa date de fin (prévue et réelle), ses tâches réalisées et l'environnement technique.
4. Une mission terminée alimente automatiquement l'expérience correspondante dans le CV maître du consultant, que celui-ci peut compléter.
5. Vue « missions en cours » par consultant, par client et globale ; vue des consultants en intercontrat ou dont la mission se termine dans les N semaines.
6. Recherche multicritère de consultants : compétences, niveau, disponibilité, localisation, langues, secteur déjà pratiqué.

#### Import d'appels d'offres et rapprochement avec les profils

1. Import d'un appel d'offres rattaché à un client (et, le cas échéant, à un projet) : PDF, Word, texte collé ou e-mail — format à définir.
2. Extraction des exigences : compétences techniques et fonctionnelles, niveau ou années d'expérience attendus, certifications, langues, secteur, localisation, date de démarrage, durée, nombre de profils. Extraction assistée (analyse automatique, éventuellement par IA), puis relecture et correction par le commercial.
3. Chaque exigence est rattachée au référentiel de compétences et marquée obligatoire ou souhaitable, avec un poids.
4. Rapprochement : score d'adéquation par consultant (couverture des exigences obligatoires, puis souhaitables), filtrable par disponibilité à la date de démarrage.
5. Vue comparative exigences × consultants présélectionnés : exigence couverte, partielle ou manquante, avec l'écart (ex. 2 ans demandés, 1 an déclaré).
6. Depuis un consultant retenu, création directe d'une version de CV adaptée à l'appel d'offres (compétences demandées mises en avant), puis partage au client.
7. Suivi : statut (en analyse, répondu, gagné, perdu) et consultants proposés ; un appel d'offres gagné se transforme en projet et missions.

### 3.5 Administration

1. Gestion des comptes et des rôles ; authentification SSO de l'entreprise (Microsoft 365 / Google) à confirmer.
2. Gestion des référentiels : compétences, niveaux, certifications, secteurs.
3. Gestion des modèles de CV (HTML/CSS) et de la charte graphique.
4. Désactivation d'un consultant qui quitte l'ESN, avec règles de conservation et d'anonymisation.
5. Journal d'audit des actions sensibles (partages, consultations, exports, suppressions).

## 4. Modèle de données

Le CV maître est l'entité pivot : il appartient à un consultant, se décompose en rubriques et sert de source aux versions commerciales, elles-mêmes partagées par des liens dont chaque consultation est tracée.

&#91;embedded content: modèle de données · 14 entités\]

L'affectation est la table de liaison qui permet d'avoir plusieurs consultants sur une mission et plusieurs missions (successives ou simultanées) par consultant. Un lien de partage contenant plusieurs CV impliquerait une relation n – n entre liens et versions (voir points à éclaircir).

Un appel d'offres, rattaché à un client, porte ses exigences, chacune liée au référentiel de compétences. Une proposition associe un consultant à un appel d'offres, avec son score d'adéquation et la version de CV envoyée ; un appel d'offres gagné donne naissance à un projet.

## 5. Exigences non fonctionnelles

Les CV sont des données personnelles : la sécurité des liens de partage et la conformité RGPD sont les deux exigences structurantes.

**Sécurité**

- Authentification SSO (OIDC) pour les utilisateurs internes, MFA recommandée.
- Contrôle d'accès par rôle (RBAC) appliqué côté serveur sur chaque requête.
- Liens de partage : jeton aléatoire d'au moins 128 bits, mot de passe haché, limitation des tentatives, expiration par défaut (ex. 30 jours), pas d'indexation par les moteurs de recherche (`noindex`).
- HTTPS partout, chiffrement des données au repos, sauvegardes quotidiennes chiffrées.

**RGPD**

- Base légale du traitement et information des collaborateurs (mention dans la politique de confidentialité interne, registre des traitements).
- Minimisation : pas de date de naissance, d'adresse personnelle ni de situation familiale dans le CV par défaut ; photo facultative.
- Le consultant voit à qui son CV a été partagé (à confirmer) ; droits d'accès, de rectification et de suppression.
- Durées de conservation définies : CV d'un collaborateur parti, liens expirés, journaux de consultation.
- Hébergement en UE.

**Performance et disponibilité**

- Affichage d'un CV partagé en moins de 2 s ; génération PDF en moins de 5 s.
- Disponibilité cible 99,5 % en heures ouvrées.
- Volumétrie de référence : environ 50 consultants, 2 à 3 commerciaux, 1 agence ; nombre de versions et de partages par mois à confirmer. Ce volume ne pose aucune contrainte de performance particulière.

**Ergonomie et accessibilité**

- Interface en français, CV générés en français et en anglais.
- Utilisable sur mobile pour la mise à jour du CV par le consultant.
- Rendu partagé conforme RGAA / WCAG 2.1 AA pour la lecture.

## 6. Architecture technique proposée

Une application web classique suffit : une API unique, une interface interne derrière le SSO et des pages de CV partagés rendues côté serveur, isolées du reste.

&#91;embedded content: architecture cible · web interne, page publique, API, 4 services\]

- **Stack indicative** : front React ou Vue ; back-end Node.js (NestJS), Java (Spring) ou PHP (Symfony) selon les compétences internes ; PostgreSQL ; stockage objet S3-compatible ; génération PDF par navigateur headless (Playwright / Puppeteer).
- **Modèles de CV** : gabarits HTML/CSS versionnés, un même gabarit sert au rendu web et au PDF.
- **Pages partagées** : sous-domaine dédié, sans accès à l'interface interne, en-tête `noindex`, limitation de débit.
- **Hébergement** : cloud en UE (OVHcloud, Scaleway, Azure France…), environnements recette et production séparés.

### Format de stockage du CV maître

Le CV maître est stocké en données structurées dans la base ; aucun fichier Word ou PDF n'est conservé comme source. Le HTML et le PDF sont des sorties générées à la demande à partir des gabarits.

| Donnée | Format de stockage | Raison |
| --- | --- | --- |
| Consultant, compétences (liées au référentiel, avec niveau), langues, formations, certifications, expériences | Tables relationnelles PostgreSQL | Recherche multicritère, liens avec les missions, cohérence du référentiel |
| Versions commerciales | Instantané en JSONB (sélection, ordre, textes réécrits) | Version figée, comparable au maître pour signaler un écart |
| Textes libres (résumé, description de mission) | Markdown simple ou texte enrichi limité (gras, listes) | Pas de HTML libre, qui casserait les gabarits |
| Champs traduisibles | Une valeur FR et une valeur EN par champ | CV bilingues sans dupliquer le CV |
| Échange et portabilité | Export / import au format JSON Resume | Droit à la portabilité RGPD, intégrations futures |

Les CV Word / PDF existants servent uniquement à l'amorçage : import, extraction, relecture par le consultant, puis suppression du fichier après une courte période de vérification (durée à fixer).

## 7. Lotissement proposé

Un MVP centré sur le CV maître, les versions et le partage permet de mettre l'outil entre les mains des commerciaux rapidement ; les missions et la recherche avancée viennent ensuite. Les durées ci-dessous sont indicatives pour une petite équipe (2 développeurs) et à recaler après chiffrage.

| Lot | Contenu | Durée indicative |
| --- | --- | --- |
| Lot 1 – MVP | Comptes et rôles, SSO ; CV maître ; versions commerciales ; rendu HTML + PDF ; liens de partage (accès par code e-mail en mode domaine ou nominatif, mot de passe en secours, transfert interne, révocation) ; un modèle de CV | 9 à 11 semaines |
| Lot 2 – Missions | Clients, projets, missions multi-consultants ; alimentation automatique des expériences ; vue missions en cours et intercontrats | 4 à 6 semaines |
| Lot 3 – Productivité | Recherche multicritère ; import d'appels d'offres et rapprochement avec les profils ; import de CV Word/PDF ; CV en anglais ; plusieurs modèles ; dossiers multi-CV ; statistiques de consultation | 9 à 12 semaines |
| Lot 4 – Options | Workflow de validation ; relances automatiques ; intégrations (CRM, SIRH) ; aide à la rédaction par IA | À définir |

## 8. Points à éclaircir

Ces questions conditionnent le modèle de données ou le chiffrage ; les cocher au fur et à mesure qu'une décision est prise.

**Périmètre et volumétrie**

- [ ] Croissance attendue sur 3 ans (aujourd'hui une cinquantaine de consultants, 2 à 3 commerciaux, 1 agence) ? Ouverture d'autres agences envisagée ? pas de croissance à prendre en compte (pas d'ouverture d'agence)
- [x] Construire en interne ou évaluer d'abord les solutions du marché (logiciels de dossiers de compétences pour ESN) ? **Décision : développement en interne.**
- [ ] Budget et date de mise en service souhaitée ?
- [ ] Faut-il reprendre les CV existants (format, nombre) ?

**CV maître**

- [ ] Le consultant peut-il tout modifier seul, ou faut-il une validation manager / RH avant usage commercial ?
- [ ] Liste définitive des rubriques ; photo autorisée ou non ?
- [ ] Référentiel de compétences imposé (liste fermée) ou saisie libre normalisée a posteriori ?
- [ ] Échelle des niveaux de compétence (1–5, débutant / confirmé / expert…) ?
- [ ] CV bilingue FR/EN : traduction saisie par le consultant, par le commercial, ou assistée ?

**Versions commerciales**

- [ ] Un commercial peut-il modifier le contenu factuel (dates, compétences) ou seulement sélectionner, réordonner et reformuler ?
- [ ] Le consultant doit-il voir, voire valider, les versions faites à partir de son CV ?
- [ ] Une version doit-elle se mettre à jour quand le CV maître change, ou rester figée (instantané) ?
- [ ] Faut-il rattacher une version à une opportunité / un appel d'offres ? Existe-t-il un CRM à connecter ?

**Partage client**

- [ ] Valider le mode d'accès par défaut (domaine du client + code e-mail) et les cas où le mode mot de passe est autorisé ?
- [ ] Durée de validité par défaut et maximale d'un lien, durée de maintien de l'accès sur un appareil, durée de conservation des journaux de consultation ?
- [ ] Le client peut-il télécharger le PDF, ou seulement consulter en ligne ?
- [ ] Anonymisation par défaut pour les prospects (initiales, sans photo) ?
- [ ] Partager plusieurs CV dans un même lien (dossier de réponse) ?
- [ ] Quelles notifications le commercial veut-il recevoir (première consultation, nouveau lecteur, demande hors domaine) ?

**Clients, projets, missions**

- [ ] Ces données existent-elles déjà ailleurs (CRM, ERP, outil de CRA) ? Si oui, laquelle fait foi et faut-il synchroniser ?
- [ ] Une mission = un bon de commande, ou une affectation d'un consultant ? Un consultant peut-il être sur deux missions en même temps (temps partiel) ?
- [ ] Faut-il gérer le taux d'occupation (%), le TJM ou d'autres données financières ? (sensibles : à cloisonner)
- [ ] Les missions d'un client confidentiel doivent-elles être anonymisées dans les CV (« grand compte bancaire ») ?
- [ ] Faut-il gérer les sous-traitants / freelances en plus des salariés ?
- [ ] Appels d'offres : sous quels formats arrivent-ils (PDF, Word, plateformes d'achat public, portails clients) et en quel volume par mois ?
- [ ] Une extraction automatique par IA est-elle acceptable au regard de la confidentialité des documents clients ? Si oui, avec quel hébergement ?
- [ ] Règles du score d'adéquation : poids des exigences obligatoires et souhaitables, prise en compte des formations en cours et de l'auto-évaluation du consultant ?

**Technique et conformité**

- [ ] Fournisseur d'identité existant (Microsoft Entra ID, Google Workspace) ?
- [ ] Contraintes d'hébergement (cloud UE, on-premise, SecNumCloud) ?
- [ ] Charte graphique et modèles de CV existants à reproduire ?
- [ ] Durées de conservation des CV des collaborateurs partis et des journaux de consultation ? Avis du DPO ?
- [ ] Qui maintiendra l'application après livraison (équipe interne, prestataire) ?
