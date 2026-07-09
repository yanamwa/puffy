export default function LandingFooter() {
  return (
    <footer
      style={{
        width: "100%",
        padding: "2rem 1.5rem",
        background: "rgba(255, 255, 255, 0.95)",
        textAlign: "center",
        color: "#4b2bd9",
        fontWeight: 600,
        marginTop: "2rem",
      }}
    >
      <p style={{ margin: 0 }}>
        © {new Date().getFullYear()} PuffyBrain. Built for study happiness.
      </p>
    </footer>
  );
}
