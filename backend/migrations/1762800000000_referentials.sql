-- Up Migration

-- Gestion des référentiels (CVIP-15) : compléments au modèle posé par CVIP-14.

-- Fusion de doublons étendue aux secteurs et aux certifications (déjà possible pour les compétences).
-- Un élément fusionné pointe directement vers l'élément canonique (pas de chaîne) et reste
-- en base pour que son nom continue à être reconnu à la saisie (« ReactJS » -> « React »).
ALTER TABLE sector
  ADD COLUMN merged_into_id uuid REFERENCES sector (id),
  ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now(),
  ADD CHECK (merged_into_id <> id);

ALTER TABLE certification
  ADD COLUMN merged_into_id uuid REFERENCES certification (id),
  ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now(),
  ADD CHECK (merged_into_id <> id);

-- Un élément fusionné n'est plus proposé.
ALTER TABLE skill ADD CONSTRAINT skill_merged_inactive CHECK (merged_into_id IS NULL OR NOT active);
ALTER TABLE sector ADD CONSTRAINT sector_merged_inactive CHECK (merged_into_id IS NULL OR NOT active);
ALTER TABLE certification ADD CONSTRAINT certification_merged_inactive CHECK (merged_into_id IS NULL OR NOT active);

CREATE INDEX skill_merged_into_id_idx ON skill (merged_into_id);
CREATE INDEX sector_merged_into_id_idx ON sector (merged_into_id);
CREATE INDEX certification_merged_into_id_idx ON certification (merged_into_id);

CREATE TRIGGER sector_set_updated_at BEFORE UPDATE ON sector
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER certification_set_updated_at BEFORE UPDATE ON certification
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Échelle de niveaux : rang strictement positif, et unicité vérifiée en fin d'instruction
-- pour pouvoir réordonner l'échelle en une seule mise à jour.
ALTER TABLE skill_level
  DROP CONSTRAINT skill_level_rank_key,
  ADD CONSTRAINT skill_level_rank_key UNIQUE (rank) DEFERRABLE INITIALLY IMMEDIATE,
  ADD CHECK (rank > 0);

-- Échelle par défaut de 1 à 5 (question ouverte du cahier des charges : modifiable depuis l'API).
INSERT INTO skill_level (label_fr, label_en, rank) VALUES
  ('Notions', 'Basic knowledge', 1),
  ('Débutant', 'Beginner', 2),
  ('Intermédiaire', 'Intermediate', 3),
  ('Confirmé', 'Advanced', 4),
  ('Expert', 'Expert', 5);

-- Down Migration

DELETE FROM skill_level WHERE (label_fr, rank) IN
  (('Notions', 1), ('Débutant', 2), ('Intermédiaire', 3), ('Confirmé', 4), ('Expert', 5));

ALTER TABLE skill_level
  DROP CONSTRAINT skill_level_rank_check,
  DROP CONSTRAINT skill_level_rank_key,
  ADD CONSTRAINT skill_level_rank_key UNIQUE (rank);

DROP TRIGGER certification_set_updated_at ON certification;
DROP TRIGGER sector_set_updated_at ON sector;

DROP INDEX certification_merged_into_id_idx;
DROP INDEX sector_merged_into_id_idx;
DROP INDEX skill_merged_into_id_idx;

ALTER TABLE certification DROP CONSTRAINT certification_merged_inactive;
ALTER TABLE sector DROP CONSTRAINT sector_merged_inactive;
ALTER TABLE skill DROP CONSTRAINT skill_merged_inactive;

ALTER TABLE certification
  DROP COLUMN updated_at,
  DROP COLUMN created_at,
  DROP COLUMN merged_into_id;

ALTER TABLE sector
  DROP COLUMN updated_at,
  DROP COLUMN created_at,
  DROP COLUMN merged_into_id;
