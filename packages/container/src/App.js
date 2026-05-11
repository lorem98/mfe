import React, { useState, Suspense } from "react";
import { BrowserRouter, Switch, Route, Redirect } from "react-router-dom";
import { StylesProvider, createGenerateClassName } from "@material-ui/core";
import Header from "./components/Header";
import MarketingApp from "./components/MarketingApp";
import AuthApp from "./components/AuthApp";
import DashboardApp from "./components/DashboardApp";

const generateClassName = createGenerateClassName({
  productionPrefix: "co",
});

export default () => {
  const [signedIn, setSignedIn] = useState(false);

  return (
    <BrowserRouter>
      <StylesProvider generateClassName={generateClassName}>
        <div>
          <Header
            signedIn={signedIn}
            onSignOut={() => setSignedIn(false)}
          />
          <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
            <Switch>
              {/* Auth MFE — sign-in / sign-up */}
              <Route path="/auth">
                <AuthApp onSignIn={() => setSignedIn(true)} />
              </Route>

              {/* Dashboard MFE (Vue 3) — protected route */}
              <Route path="/dashboard">
                {signedIn ? (
                  <DashboardApp />
                ) : (
                  <Redirect to="/auth/signin" />
                )}
              </Route>

              {/* Marketing MFE — public landing & pricing pages */}
              <Route path="/">
                <MarketingApp />
              </Route>
            </Switch>
          </Suspense>
        </div>
      </StylesProvider>
    </BrowserRouter>
  );
};
