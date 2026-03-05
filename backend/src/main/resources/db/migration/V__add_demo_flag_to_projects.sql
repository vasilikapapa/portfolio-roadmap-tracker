-- Adds demo sandbox flag to projects
ALTER TABLE projects
ADD COLUMN demo boolean NOT NULL DEFAULT false;

-- Optional helpful index if you filter by demo often
CREATE INDEX IF NOT EXISTS idx_projects_demo ON projects(demo);