CREATE TABLE IF NOT EXISTS task_type_options (
    id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    label VARCHAR(100) NOT NULL,
    sort_order INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE task_type_options
    ADD CONSTRAINT uk_task_type_options_code UNIQUE (code);

ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS type_code VARCHAR(50);

UPDATE tasks
SET type_code = type
WHERE type_code IS NULL;

ALTER TABLE tasks
    ALTER COLUMN type_code SET NOT NULL;

INSERT INTO task_type_options (id, code, label, sort_order, active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'FEATURE', 'Feature', 1, TRUE, NOW(), NOW()),
    (gen_random_uuid(), 'BUG', 'Bug', 2, TRUE, NOW(), NOW()),
    (gen_random_uuid(), 'REFACTOR', 'Refactor', 3, TRUE, NOW(), NOW()),
    (gen_random_uuid(), 'CHORE', 'Chore', 4, TRUE, NOW(), NOW()),
    (gen_random_uuid(), 'DOCUMENTATION', 'Documentation', 5, TRUE, NOW(), NOW()),
    (gen_random_uuid(), 'PERFORMANCE', 'Performance', 6, TRUE, NOW(), NOW()),
    (gen_random_uuid(), 'DESIGN', 'Design', 7, TRUE, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;