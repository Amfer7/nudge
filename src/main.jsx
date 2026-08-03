import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import AuthCallback from "./routes/AuthCallback";
import Providers from "./app/Providers";
import "./styles/globals.css";

// The existing app is the `/` route. `/auth/callback` handles the OAuth return.
// (`/add/:code` invite deep-link lands in Phase 2.) Providers wrap the router so
// auth/sync context is available on every route.
ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Providers>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<App />} />
      </Routes>
    </Providers>
  </BrowserRouter>
);
