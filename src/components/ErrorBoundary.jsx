import React from "react";

// Catches runtime errors anywhere below it and renders a visible fallback
// instead of producing a blank page.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("[pulse] uncaught error:", error, info);
    this.setState({ info });
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px",
          background: "#f5f7ff",
        }}
      >
        <div
          style={{
            maxWidth: 720,
            width: "100%",
            background: "white",
            border: "1px solid #e6e8ef",
            borderRadius: 14,
            padding: 28,
            boxShadow: "0 4px 16px rgba(15,18,34,0.06)",
            fontFamily:
              'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            color: "#0f1222",
          }}
        >
          <div style={{ fontSize: 13, color: "#4751e8", fontWeight: 600 }}>
            Pulse hit a snag
          </div>
          <h1 style={{ margin: "8px 0 12px", fontSize: 22 }}>
            Something prevented the app from rendering.
          </h1>
          <p style={{ color: "#5b6177", marginBottom: 12 }}>
            The error is below. This is most often caused by stale build state —
            try{" "}
            <code style={{ background: "#ebefff", padding: "1px 6px", borderRadius: 4 }}>
              npm install
            </code>{" "}
            followed by{" "}
            <code style={{ background: "#ebefff", padding: "1px 6px", borderRadius: 4 }}>
              npm run dev
            </code>
            .
          </p>
          <pre
            style={{
              background: "#0f1222",
              color: "#e6e8ef",
              padding: 16,
              borderRadius: 10,
              overflow: "auto",
              fontSize: 12,
              lineHeight: 1.5,
              maxHeight: 320,
            }}
          >
            {String(this.state.error?.stack || this.state.error)}
          </pre>
        </div>
      </div>
    );
  }
}
