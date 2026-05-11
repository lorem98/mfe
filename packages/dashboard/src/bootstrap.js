import { createApp } from "vue";
import App from "./App.vue";

/**
 * mount — the single integration point consumed by the container via
 * Module Federation.  It creates a fresh Vue 3 application and mounts it
 * into the supplied DOM element.
 *
 * Returning an object lets us add lifecycle hooks later (e.g. unmount,
 * onParentNavigate) without breaking the caller's interface.
 */
const mount = (el) => {
  const app = createApp(App);
  app.mount(el);

  return {
    // Placeholder — the dashboard currently has no sub-routing, but the
    // hook is exposed so the container can call it uniformly.
    onParentNavigate() {},
  };
};

// ─── Dev isolation ───────────────────────────────────────────────────────────
// When the dashboard package is run standalone (npm start inside
// packages/dashboard) the HTML page supplies a dedicated root element.
if (process.env.NODE_ENV === "development") {
  const devRoot = document.querySelector("#_dashboard-dev-root");

  if (devRoot) {
    mount(devRoot);
  }
}

// Exported and consumed by the container through the "dashboard/DashboardApp"
// Module Federation remote.
export { mount };
