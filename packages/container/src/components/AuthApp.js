import { mount } from "auth/AuthApp";
import React, { useRef, useEffect } from "react";
import { useHistory } from "react-router-dom";

/**
 * AuthApp
 *
 * Thin React wrapper that integrates the Auth micro-frontend (packages/auth)
 * into the container shell.
 *
 * Responsibilities
 * ─────────────────
 * 1. Call mount() from the auth remote so the auth React tree is rendered
 *    into the ref'd div.
 * 2. Pass onSignIn so the container knows when the user authenticated.
 * 3. Sync routing bidirectionally between the container's BrowserHistory and
 *    the auth app's MemoryHistory:
 *      • onNavigate — auth navigates → update container history.
 *      • onParentNavigate — container navigates → update auth history.
 */
export default ({ onSignIn }) => {
  const ref = useRef(null);
  const history = useHistory();

  useEffect(() => {
    const { onParentNavigate } = mount(ref.current, {
      onSignIn,
      initialPath: history.location.pathname,
      onNavigate: ({ pathname: nextPathname }) => {
        const { pathname } = history.location;

        if (pathname !== nextPathname) {
          history.push(nextPathname);
        }
      },
    });

    return history.listen(onParentNavigate);
  }, []);

  return <div ref={ref} />;
};
