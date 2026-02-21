import "./pageHeader.css";

/**
 * Props for PageHeader component
 *
 * title    → Main page title (required)
 * subtitle → Optional secondary description text
 * right    → Optional React node (e.g., buttons, filters, actions)
 */
interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

/**
 * PageHeader Component
 *
 * Purpose:
 * - Provides a consistent header layout for pages
 * - Displays title + optional subtitle
 * - Supports optional right-side content (actions, buttons, etc.)
 */
export default function PageHeader({ title, subtitle, right }: Props) {
  return (
    <div className="pageHeader">
      
      {/* Left section: title + optional subtitle */}
      <div>
        <h1 className="pageTitle">{title}</h1>

        {/* Render subtitle only if provided */}
        {subtitle && <p className="pageSubtitle">{subtitle}</p>}
      </div>

      {/* Optional right-side content (buttons, controls, etc.) */}
      {right && <div className="pageHeaderRight">{right}</div>}
    </div>
  );
}