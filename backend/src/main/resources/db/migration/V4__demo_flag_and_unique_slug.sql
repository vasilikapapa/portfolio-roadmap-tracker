-- 1) Add demo flag (default false)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS demo boolean NOT NULL DEFAULT false;

-- 2) Drop old unique constraint on slug (name may differ in your DB)
-- If this fails due to constraint name mismatch, check your DB constraint name.
ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS uk_projects_slug;

-- Some setups auto-name constraints differently, try also:
ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_slug_key;

-- 3) Add new unique constraint: (demo, slug)
ALTER TABLE projects
  ADD CONSTRAINT uk_projects_demo_slug UNIQUE (demo, slug);