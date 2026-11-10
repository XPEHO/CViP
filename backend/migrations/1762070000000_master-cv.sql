-- Up Migration

-- Modèle relationnel du CV maître (CVIP-14).
-- Le CV est stocké uniquement sous forme structurée : aucun fichier Word/PDF
-- n'est conservé comme source (seule la photo est référencée dans le stockage objet).
-- Champs traduisibles : une colonne _fr et une colonne _en (cahier des charges, section 6).

-- Texte libre en Markdown limité (gras, listes) : le HTML est refusé.
-- La validation fine de la syntaxe autorisée est faite côté API.
CREATE DOMAIN markdown_text AS text
  CHECK (VALUE !~ '<[A-Za-z!/?]');

CREATE TYPE skill_kind AS ENUM ('technical', 'functional');

CREATE TYPE cefr_level AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

CREATE TYPE experience_source AS ENUM ('manual', 'missions');

CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Référentiels (gérés par CVIP-15)

CREATE TABLE skill (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (btrim(name) <> ''),
  kind skill_kind NOT NULL DEFAULT 'technical',
  category text,
  -- Fusion de doublons (« ReactJS » -> « React ») : l'élément fusionné pointe vers le canonique.
  merged_into_id uuid REFERENCES skill (id),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (merged_into_id <> id)
);
CREATE UNIQUE INDEX skill_name_key ON skill (lower(name));

-- Échelle de niveaux paramétrable.
CREATE TABLE skill_level (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label_fr text NOT NULL UNIQUE,
  label_en text,
  rank smallint NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE sector (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_fr text NOT NULL CHECK (btrim(name_fr) <> ''),
  name_en text,
  active boolean NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX sector_name_key ON sector (lower(name_fr));

CREATE TABLE certification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (btrim(name) <> ''),
  organization text,
  active boolean NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX certification_name_key ON certification (lower(name), lower(coalesce(organization, '')));

-- Consultant et CV maître

CREATE TABLE consultant (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX consultant_email_key ON consultant (lower(email));

-- Un seul CV maître par consultant. Pas de date de naissance, adresse ni situation familiale.
CREATE TABLE master_cv (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id uuid NOT NULL UNIQUE REFERENCES consultant (id) ON DELETE CASCADE,
  job_title_fr text,
  job_title_en text,
  years_of_experience smallint CHECK (years_of_experience >= 0),
  summary_fr markdown_text,
  summary_en markdown_text,
  interests_fr markdown_text,
  interests_en markdown_text,
  photo_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Date de dernière mise à jour du CV, rubriques comprises (voir touch_master_cv).
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cv_skill (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL REFERENCES master_cv (id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skill (id),
  level_id uuid REFERENCES skill_level (id),
  years smallint CHECK (years >= 0),
  position smallint NOT NULL DEFAULT 0,
  UNIQUE (cv_id, skill_id)
);
CREATE INDEX cv_skill_skill_id_idx ON cv_skill (skill_id);

CREATE TABLE cv_language (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL REFERENCES master_cv (id) ON DELETE CASCADE,
  -- Code ISO 639-1 (fr, en, de…).
  language_code char(2) NOT NULL CHECK (language_code ~ '^[a-z]{2}$'),
  level cefr_level NOT NULL,
  position smallint NOT NULL DEFAULT 0,
  UNIQUE (cv_id, language_code)
);

-- Secteurs d'activité mis en avant sur le CV.
CREATE TABLE cv_sector (
  cv_id uuid NOT NULL REFERENCES master_cv (id) ON DELETE CASCADE,
  sector_id uuid NOT NULL REFERENCES sector (id),
  position smallint NOT NULL DEFAULT 0,
  PRIMARY KEY (cv_id, sector_id)
);
CREATE INDEX cv_sector_sector_id_idx ON cv_sector (sector_id);

-- Formation initiale (diplômes).
CREATE TABLE cv_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL REFERENCES master_cv (id) ON DELETE CASCADE,
  degree_fr text NOT NULL,
  degree_en text,
  school text,
  year smallint CHECK (year BETWEEN 1950 AND 2100),
  position smallint NOT NULL DEFAULT 0
);

-- Formations continues.
CREATE TABLE cv_training (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL REFERENCES master_cv (id) ON DELETE CASCADE,
  title text NOT NULL,
  organization text,
  obtained_on date,
  expires_on date CHECK (expires_on >= obtained_on),
  position smallint NOT NULL DEFAULT 0
);

-- Certifications : liées au référentiel quand l'élément existe, sinon saisies librement.
-- Une certification est expirée quand expires_on < current_date.
CREATE TABLE cv_certification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL REFERENCES master_cv (id) ON DELETE CASCADE,
  certification_id uuid REFERENCES certification (id),
  title text NOT NULL,
  organization text,
  obtained_on date,
  expires_on date CHECK (expires_on >= obtained_on),
  position smallint NOT NULL DEFAULT 0
);
CREATE INDEX cv_certification_certification_id_idx ON cv_certification (certification_id);

CREATE TABLE cv_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL REFERENCES master_cv (id) ON DELETE CASCADE,
  company text NOT NULL,
  title_fr text NOT NULL,
  title_en text,
  start_date date NOT NULL,
  end_date date CHECK (end_date >= start_date),
  description_fr markdown_text,
  description_en markdown_text,
  sector_id uuid REFERENCES sector (id),
  -- Saisie manuelle au lot 1 ; alimentation par le module Missions au lot 2 (mission_ref = identifiant source).
  source experience_source NOT NULL DEFAULT 'manual',
  mission_ref text,
  position smallint NOT NULL DEFAULT 0,
  CHECK ((source = 'missions') = (mission_ref IS NOT NULL))
);
CREATE UNIQUE INDEX cv_experience_mission_ref_key ON cv_experience (mission_ref) WHERE mission_ref IS NOT NULL;

-- Environnement technique d'une expérience.
CREATE TABLE cv_experience_skill (
  experience_id uuid NOT NULL REFERENCES cv_experience (id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skill (id),
  PRIMARY KEY (experience_id, skill_id)
);
CREATE INDEX cv_experience_skill_skill_id_idx ON cv_experience_skill (skill_id);

-- Horodatage

CREATE TRIGGER skill_set_updated_at BEFORE UPDATE ON skill
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER consultant_set_updated_at BEFORE UPDATE ON consultant
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER master_cv_set_updated_at BEFORE UPDATE ON master_cv
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Toute modification d'une rubrique met à jour la date du CV maître.
CREATE FUNCTION touch_master_cv() RETURNS trigger AS $$
BEGIN
  UPDATE master_cv SET updated_at = now()
  WHERE id = (CASE WHEN TG_OP = 'DELETE' THEN OLD.cv_id ELSE NEW.cv_id END);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cv_skill_touch_master_cv AFTER INSERT OR UPDATE OR DELETE ON cv_skill
  FOR EACH ROW EXECUTE FUNCTION touch_master_cv();
CREATE TRIGGER cv_language_touch_master_cv AFTER INSERT OR UPDATE OR DELETE ON cv_language
  FOR EACH ROW EXECUTE FUNCTION touch_master_cv();
CREATE TRIGGER cv_sector_touch_master_cv AFTER INSERT OR UPDATE OR DELETE ON cv_sector
  FOR EACH ROW EXECUTE FUNCTION touch_master_cv();
CREATE TRIGGER cv_education_touch_master_cv AFTER INSERT OR UPDATE OR DELETE ON cv_education
  FOR EACH ROW EXECUTE FUNCTION touch_master_cv();
CREATE TRIGGER cv_training_touch_master_cv AFTER INSERT OR UPDATE OR DELETE ON cv_training
  FOR EACH ROW EXECUTE FUNCTION touch_master_cv();
CREATE TRIGGER cv_certification_touch_master_cv AFTER INSERT OR UPDATE OR DELETE ON cv_certification
  FOR EACH ROW EXECUTE FUNCTION touch_master_cv();
CREATE TRIGGER cv_experience_touch_master_cv AFTER INSERT OR UPDATE OR DELETE ON cv_experience
  FOR EACH ROW EXECUTE FUNCTION touch_master_cv();

-- Down Migration

DROP TABLE cv_experience_skill;
DROP TABLE cv_experience;
DROP TABLE cv_certification;
DROP TABLE cv_training;
DROP TABLE cv_education;
DROP TABLE cv_sector;
DROP TABLE cv_language;
DROP TABLE cv_skill;
DROP TABLE master_cv;
DROP TABLE consultant;
DROP TABLE certification;
DROP TABLE sector;
DROP TABLE skill_level;
DROP TABLE skill;
DROP FUNCTION touch_master_cv();
DROP FUNCTION set_updated_at();
DROP TYPE experience_source;
DROP TYPE cefr_level;
DROP TYPE skill_kind;
DROP DOMAIN markdown_text;
