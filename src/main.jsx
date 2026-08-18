import React from "react";
import { createRoot } from "react-dom/client";
import Poort from "./Poort.jsx";
import "./stijl.css";

createRoot(document.getElementById("root")).render(<Poort />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
}
