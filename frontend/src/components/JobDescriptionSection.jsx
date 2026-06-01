export default function JobDescriptionSection({ description }) {
  const text = description?.trim() || "No description provided.";

  return (
    <section className="job-description-section" aria-labelledby="job-description-heading">
      <h2 id="job-description-heading" className="job-description-heading">
        Job description
      </h2>
      <div className="job-description-body">{text}</div>
    </section>
  );
}
