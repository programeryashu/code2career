import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { SavedGigsProvider } from "./context/SavedGigsContext";
import { UserProvider } from "./context/UserContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <UserProvider>
        <SavedGigsProvider>
          <App />
        </SavedGigsProvider>
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
