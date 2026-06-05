import { bidStatusLabel } from "../constants";

function ScreenshotPill({ hasScreenshot }) {
  return (
    <span className={`meta-pill ${hasScreenshot ? "meta-pill--yes" : "meta-pill--no"}`}>
      {hasScreenshot ? "Screenshot added" : "No screenshot"}
    </span>
  );
}

export default function JobList({
  applications,
  variant = "worker",
  onRowClick,
  onEdit,
  onScreenshot,
  onDelete,
  deletingId,
}) {
  if (applications.length === 0) {
    return <div className="list-empty">No jobs yet.</div>;
  }

  return (
    <div className="job-list">
      {applications.map((app) => {
        const clickable = Boolean(onRowClick);
        const isDeleting = deletingId === app.id;

        return (
          <article
            key={app.id}
            className={`job-card${clickable ? " job-card--clickable" : ""}`}
            onClick={clickable ? () => onRowClick(app) : undefined}
          >
            <div className="job-card-main">
              <div className="job-card-title">{app.jobTitle}</div>
              <div className="job-card-meta">
                <span className="job-card-company">{app.companyName}</span>
                <a
                  href={app.jobLink}
                  target="_blank"
                  rel="noreferrer"
                  className="job-card-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  Open job ↗
                </a>
                {variant === "customer" && app.workerUsername && (
                  <span className="job-card-worker">
                    Registered by: {app.registeredByUsername || app.workerUsername}
                  </span>
                )}
              </div>
            </div>

            <div className="job-card-badges">
              <span className={`status status-${app.bidStatus}`}>
                {bidStatusLabel(app.bidStatus)}
              </span>
              <ScreenshotPill hasScreenshot={Boolean(app.screenshotLink)} />
            </div>

            {variant === "worker" && (
              <div className="job-card-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="btn-action btn-edit"
                  onClick={() => onEdit(app)}
                  disabled={isDeleting}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn-action btn-screenshot"
                  onClick={() => onScreenshot(app)}
                  disabled={isDeleting}
                >
                  Add Screenshot
                </button>
                <button
                  type="button"
                  className="btn-action btn-delete"
                  onClick={() => onDelete(app)}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
