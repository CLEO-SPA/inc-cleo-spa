import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "@/components/ui/provider.jsx";
import { AuthProvider } from "@/hooks/AuthContext.jsx";
import App from "@/App.jsx";
import { Toaster } from "./components/ui/toaster";
import "@/index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider>
      <AuthProvider>
        <Toaster />
        <App />
      </AuthProvider>
    </Provider>
  </StrictMode>
);
