const header = document.querySelector(".site-header");

window.addEventListener("scroll", () => {
  const compact = window.scrollY > 24;
  header.style.boxShadow = compact
    ? "0 10px 30px rgba(23, 32, 29, 0.08)"
    : "none";
});

if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
  const live = new EventSource("/__live-reload");
  live.addEventListener("reload", () => location.reload());
}
