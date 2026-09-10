import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@fontsource-variable/dm-sans";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./style.css";
import "./research.css";
import "./comparison.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
