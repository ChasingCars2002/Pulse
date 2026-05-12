import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AppProvider } from "./context/AppContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./index.css";

// Surface any otherwise-silent global errors into the boot fallback so a
// "blank page" can never happen without a visible explanation.
window.addEventListener("error", (e) => {
  console.error("[pulse] window error:", e.error || e.message);
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("[pulse] unhandled rejection:", e.reason);
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
