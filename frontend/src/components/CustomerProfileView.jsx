import { CUSTOMER_PROFILE_FIELDS, formatProfileValue } from "../constants/customerProfile";

function LinkValue({ value }) {
  if (!value?.trim()) return <span>—</span>;
  const href = value.startsWith("http") ? value : `https://${value}`;
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {value}
    </a>
  );
}

export default function CustomerProfileView({ profile, extraRows = [] }) {
  return (
    <div className="customer-profile-view">
      {extraRows.map((row) => (
        <div key={row.label} className="profile-row">
          <span className="profile-label">{row.label}</span>
          <span>{row.value}</span>
        </div>
      ))}
      {CUSTOMER_PROFILE_FIELDS.map((field) => {
        const value = profile?.[field.key];
        const isLink = field.key === "linkedin" || field.key === "github" || field.key === "email";

        return (
          <div
            key={field.key}
            className={`profile-row${field.fullWidth ? " profile-row-stack" : ""}`}
          >
            <span className="profile-label">{field.label}</span>
            {field.key === "email" && value ? (
              <a href={`mailto:${value}`}>{value}</a>
            ) : isLink ? (
              <LinkValue value={value} />
            ) : (
              <span className={field.fullWidth ? "profile-tech-stack" : undefined}>
                {formatProfileValue(value)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
