-- =========================================================
-- V6__create_planning_items.sql
-- =========================================================
-- Planning board items for each project.
--
-- Each row represents one task placed in the planning queue.
-- sort_order controls the display order.
-- is_current marks the task currently being worked on.
-- =========================================================

CREATE TABLE planning_items (
    id uuid PRIMARY KEY,
    project_id uuid NOT NULL,
    task_id uuid NOT NULL,
    sort_order integer NOT NULL,
    is_current boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,

    CONSTRAINT fk_planning_items_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_planning_items_task
        FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_planning_items_project_task
        UNIQUE (project_id, task_id)
);

CREATE INDEX idx_planning_items_project_order
    ON planning_items(project_id, sort_order);

CREATE INDEX idx_planning_items_task
    ON planning_items(task_id);