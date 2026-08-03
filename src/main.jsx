import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import AuthCallback from "./routes/AuthCallback";
import AddFriend from "./routes/AddFriend";
import Providers from "./app/Providers";
import "./styles/globals.css";

// The existing app is the `/` route. `/auth/callback` handles the OAuth return
// and `/add/:code` redeems a shared friend invite. Providers wrap the router so
// auth/sync context is available on every route.
ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Providers>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/add/:code" element={<AddFriend />} />
        <Route path="*" element={<App />} />
      </Routes>
    </Providers>
  </BrowserRouter>
);
