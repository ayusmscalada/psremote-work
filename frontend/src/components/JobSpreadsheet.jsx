import { bidStatusLabel } from "../constants";

export default function JobSpreadsheet({
  applications,
  onRowClick,
  onEdit,
  onScreenshot,
  onDelete,
  deletingId,
}) {
  if (applications.length === 0) {
    return <div className="spreadsheet-empty">No jobs yet. Click Add New Job to create a row.</div>;
  }

  return (
    <div className="spreadsheet-wrap">
      <table className="spreadsheet">
        <thead>
          <tr>
            <th className="sheet-corner" aria-label="Row index" />
            <th className="col-title">Title</th>
            <th className="col-company">Company</th>
            <th className="col-link">Job Link</th>
            <th className="col-status">Bid Status</th>
            <th className="col-screenshot">Screenshot</th>
            <th className="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app, index) => {
            const isDeleting = deletingId === app.id;

            return (
              <tr
                key={app.id}
                className={isDeleting ? "sheet-row-active" : undefined}
                onClick={() => onRowClick(app)}
              >
                <td className="row-num">{index + 1}</td>
                <td className="cell-text" title={app.jobTitle}>
                  {app.jobTitle}
                </td>
                <td className="cell-text" title={app.companyName}>
                  {app.companyName}
                </td>
                <td className="cell-link">
                  <a
                    href={app.jobLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open link
                  </a>
                </td>
                <td>
                  <span className={`sheet-status sheet-status-${app.bidStatus}`}>
                    {bidStatusLabel(app.bidStatus)}
                  </span>
                </td>
                <td className={app.screenshotLink ? "sheet-yes" : "sheet-no"}>
                  {app.screenshotLink ? "Yes" : "—"}
                </td>
                <td className="action-cell" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="sheet-btn"
                    onClick={() => onEdit(app)}
                    disabled={isDeleting}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="sheet-btn sheet-btn-primary"
                    onClick={() => onScreenshot(app)}
                    disabled={isDeleting}
                  >
                    Add Screenshot
                  </button>
                  <button
                    type="button"
                    className="sheet-btn sheet-btn-danger"
                    onClick={() => onDelete(app)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "..." : "Delete"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
