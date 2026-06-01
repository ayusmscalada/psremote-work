import { CUSTOMER_PROFILE_FIELDS, displayValue } from "../customerProfile";

function LinkValue({ value }) {
  if (!value?.trim()) return <span>—</span>;
  const href = value.startsWith("http") ? value : `https://${value}`;
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {value}
    </a>
  );
}

export default function CustomerProfileDetails({ profile }) {
  if (!profile) return null;

  const linkFields = new Set(["linkedin", "github", "email"]);

  return (
    <div className="customer-profile-details">
      <div className="profile-row">
        <span className="profile-label">Username</span>
        <span>{profile.username}</span>
      </div>
      {CUSTOMER_PROFILE_FIELDS.map(({ key, label }) => (
        <div
          key={key}
          className={`profile-row${key === "techStack" ? " profile-row-stack" : ""}`}
        >
          <span className="profile-label">{label}</span>
          {linkFields.has(key) ? (
            <span className="profile-value">
              <LinkValue value={profile[key]} />
            </span>
          ) : (
            <span className={`profile-value${key === "techStack" ? " profile-tech-stack" : ""}`}>
              {displayValue(profile[key])}
            </span>
          )}
        </div>
      ))}
      {profile.applicationCount != null && (
        <div className="profile-row">
          <span className="profile-label">Job applications</span>
          <span>{profile.applicationCount}</span>
        </div>
      )}
    </div>
  );
}
