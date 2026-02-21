import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// API layer abstraction + DTO type
import { api, type ProjectDto } from "../lib/api";

// Shared UI component for consistent page header
import PageHeader from "../components/PageHeader/PageHeader";

// Page-specific styling
import "../styles/projects.css";

/**
 * ==========================================
 * ProjectsPage
 * ==========================================
 *
 * Purpose:
 * - Displays all public projects
 * - Fetches project list from backend API
 * - Renders project cards in grid layout
 * - Links each project to its detailed view
 *
 * Architecture Notes:
 * - Uses API abstraction layer (lib/api)
 * - DTO ensures strong typing from backend
 * - Separated layout (PageHeader) from page logic
 */
export default function ProjectsPage() {
  // Stores fetched projects from backend
  const [projects, setProjects] = useState<ProjectDto[]>([]);

  // Loading state for UX feedback
  const [loading, setLoading] = useState(true);

  /**
   * Fetch projects once on component mount
   * - Calls backend via api.listProjects()
   * - Updates state with results
   * - Ensures loading stops even if request fails
   */
  useEffect(() => {
    api.listProjects()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* Page header section */}
      <PageHeader
        title="Projects"
        subtitle="Engineering roadmap tracker — public view"
      />

      <div className="container">
        {/* Loading state indicator */}
        {loading && <p className="muted">Loading…</p>}

        {/* Project grid layout */}
        <div className="projectGrid">
          {projects.map((p) => (
            <Link
              key={p.id} // React key for stable rendering
              to={`admin/projects/${p.slug}`} // Dynamic routing by slug
              className="projectCard"
            >
              {/* Card top section: title + tech stack */}
              <div className="projectTop">
                <h3>{p.name}</h3>
                <span className="pill">{p.techStack}</span>
              </div>

              {/* Optional project summary */}
              {p.summary && (
                <p className="projectSummary">{p.summary}</p>
              )}

              {/* Footer metadata */}
              <div className="projectFooter">
                <span className="muted2">
                  Created{" "}
                  {new Date(p.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}