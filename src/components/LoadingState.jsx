export default function LoadingState({ message = "Loading..." }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f7f7f8",
        color: "#191b2a",
        fontFamily: '"Jersey 15", system-ui, sans-serif',
        fontSize: "24px",
      }}
    >
      {message}
    </div>
  );
}
