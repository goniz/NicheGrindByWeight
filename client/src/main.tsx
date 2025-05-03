import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add custom global CSS for the font-mono class to use Roboto Mono
const style = document.createElement('style');
style.innerHTML = `
  .font-mono {
    font-family: 'Roboto Mono', monospace;
  }
  
  .scale-icon {
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .animate-pulse {
    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;
document.head.appendChild(style);

createRoot(document.getElementById("root")!).render(<App />);
