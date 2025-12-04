import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeDefaultData } from "./db/seedData";

// Inizializza dati predefiniti al primo avvio
initializeDefaultData();

createRoot(document.getElementById("root")!).render(<App />);
