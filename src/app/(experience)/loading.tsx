export default function ExperienceLoading() {
  return (
    <div
      aria-label="Opening the private archive"
      className="page-container py-10 sm:py-14"
      role="status"
    >
      <div className="archive-loading" aria-hidden="true">
        <span />
        <strong>V&amp;G</strong>
        <p>Opening archive</p>
      </div>
    </div>
  );
}
