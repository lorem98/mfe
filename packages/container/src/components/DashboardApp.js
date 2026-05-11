import { mount } from "dashboard/DashboardApp";
import React, { useRef, useEffect } from "react";

/**
 * DashboardApp
 *
 * Thin React wrapper that integrates the Dashboard micro-frontend
 * (packages/dashboard — Vue 3) into the container shell via Module
 * Federation.
 *
 * Key insight: the dashboard is written in Vue 3, but from React's point of
 * view it is just a function (mount) that renders into a DOM node.  No React-
 * Vue interop library is needed — Module Federation handles the boundary.
 */
export default () => {
  const ref = useRef(null);

  useEffect(() => {
    // mount() creates a Vue 3 app and mounts it to the ref div.
    // The returned object exposes hooks for future cross-app communication.
    mount(ref.current);
  }, []);

  // Give the Vue app a minimum height so charts are visible even before any
  // content is rendered.
  return <div ref={ref} style={{ minHeight: "calc(100vh - 64px)" }} />;
};
