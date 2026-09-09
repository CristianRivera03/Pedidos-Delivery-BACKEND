-- Existing values were produced and consumed as UTC. PostgreSQL needs the
-- explicit source time zone when converting timestamp without time zone.
ALTER TABLE "users"
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3)
    USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ(3)
    USING "updated_at" AT TIME ZONE 'UTC';
