import type { ReactNode } from "react";

interface FeaturedProjectProps {
  title: string;
  description: string;
  preview: ReactNode;
  demoHref: string;
  demoLabel: string;
  sourceHref: string;
}

export default function FeaturedProject({
  title, description, preview, demoHref, demoLabel, sourceHref,
}: FeaturedProjectProps) {
  return (
    <article className="portfolio-feature">
      <figure className="portfolio-feature-preview">{preview}</figure>
      <div className="portfolio-feature-copy">
        <h3 className="portfolio-heading">{title}</h3>
        <p>{description}</p>
        <div className="portfolio-actions">
          <a className="portfolio-button portfolio-button-primary" href={demoHref}>{demoLabel}</a>
          <a href={sourceHref} target="_blank" rel="noreferrer">Source on GitHub</a>
        </div>
      </div>
    </article>
  );
}
