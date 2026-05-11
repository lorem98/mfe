import React from "react";
import { Switch, Route, Router, Redirect } from "react-router-dom";
import { StylesProvider, createGenerateClassName } from "@material-ui/core";
import Signin from "./components/Signin";
import Signup from "./components/Signup";

// Unique prefix avoids Material-UI class-name collisions when the auth MFE
// and the container (prefix "co") are rendered on the same page.
const generateClassName = createGenerateClassName({
  productionPrefix: "au",
});

export default ({ history, onSignIn }) => {
  return (
    <StylesProvider generateClassName={generateClassName}>
      <Router history={history}>
        <Switch>
          <Route path="/auth/signup">
            <Signup onSignIn={onSignIn} />
          </Route>
          <Route path="/auth/signin">
            <Signin onSignIn={onSignIn} />
          </Route>
          <Route path="/auth">
            <Redirect to="/auth/signin" />
          </Route>
        </Switch>
      </Router>
    </StylesProvider>
  );
};
