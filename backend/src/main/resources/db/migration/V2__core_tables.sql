-- =========================================
-- PostgreSQL Database Schema
-- Portfolio Roadmap Tracker
-- =========================================
--
-- This script:
-- 1. Enables UUID generation support
-- 2. Creates core domain tables:
--    - projects
--    - tasks
--    - updates
-- 3. Adds indexes for performance
--
-- Designed for:
-- - Portfolio project tracking
-- - Development roadmap management
-- - Public project display + admin editing
-- =========================================


-- -----------------------------------------
-- Enable UUID extension
-- -----------------------------------------
-- Provides functions like:
--   uuid_generate_v4()
-- Used for primary keys instead of numeric IDs.
-- Safer for distributed systems and public APIs.


CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------
-- Projects table
-- -----------------------------------------
-- Stores portfolio projects.
-- Each project can have many tasks and updates.
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique project ID
  slug VARCHAR(120) UNIQUE NOT NULL,              -- URL-friendly identifier (e.g., portfolio-tracker)
  name VARCHAR(200) NOT NULL,                     -- Project name
  summary VARCHAR(500),                           -- Short project summary
  description TEXT,                               -- Detailed description
  tech_stack TEXT,                                -- Technologies used
  repo_url TEXT,                                  -- Git repository link
  live_url TEXT,                                  -- Live deployment link
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),    -- Creation timestamp
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()     -- Last update timestamp
);

-- -----------------------------------------
-- Tasks table
-- -----------------------------------------
-- Represents roadmap items per project:
-- - Features
-- - Bugs
-- - Improvements
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique task ID
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, -- Parent project
  title VARCHAR(200) NOT NULL,                    -- Task title
  description TEXT,                               -- Task details
  status VARCHAR(20) NOT NULL,                    -- BACKLOG / IN_PROGRESS / DONE
  type VARCHAR(20) NOT NULL,                      -- FEATURE / BUG / REFACTOR
  priority VARCHAR(20) NOT NULL,                  -- LOW / MEDIUM / HIGH
  target_version VARCHAR(40),                     -- Planned release version
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),    -- Creation timestamp
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()     -- Last update timestamp
);

-- -----------------------------------------
-- Updates table
-- -----------------------------------------
-- Stores development updates:
-- - Release notes
-- - Progress logs
-- - Feature announcements

CREATE TABLE IF NOT EXISTS updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique update ID
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, -- Associated project
  title VARCHAR(200) NOT NULL,                    -- Update title
  body TEXT NOT NULL,                             -- Update content / dev log
  created_at TIMESTAMP NOT NULL DEFAULT NOW()     -- Creation timestamp
);


-- -----------------------------------------
-- Performance Indexes
-- -----------------------------------------
-- Improve lookup performance when:
-- - Fetching project tasks
-- - Fetching project updates

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);     -- Faster task lookup by project
CREATE INDEX IF NOT EXISTS idx_updates_project_id ON updates(project_id); -- Faster update lookup by project