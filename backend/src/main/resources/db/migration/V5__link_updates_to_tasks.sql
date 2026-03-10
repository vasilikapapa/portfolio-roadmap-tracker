-- =========================================================
-- V5__link_updates_to_tasks.sql
-- =========================================================
-- Goal:
-- Allow a project update to optionally reference a task.
--
-- Why optional?
-- - Some updates are tied to a task
-- - Some updates are general project updates
-- =========================================================

ALTER TABLE updates
ADD COLUMN task_id uuid NULL;

ALTER TABLE updates
ADD CONSTRAINT fk_updates_task
FOREIGN KEY (task_id)
REFERENCES tasks(id)
ON DELETE SET NULL;

CREATE INDEX idx_updates_task_id ON updates(task_id);
CREATE INDEX idx_updates_project_id_created_at ON updates(project_id, created_at DESC);