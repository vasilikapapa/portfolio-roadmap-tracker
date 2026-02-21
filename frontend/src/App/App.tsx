import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

/**
 * App Component (default Vite + React starter example)
 *
 * Demonstrates:
 * - Basic React state management using useState
 * - Static asset imports (logos)
 * - Simple JSX rendering and event handling
 */
function App() {
  // Local state for demo counter
  const [count, setCount] = useState(0);

  return (
    <>
      {/* Logo links section */}
      <div>
        {/* Vite documentation link */}
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>

        {/* React documentation link */}
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      {/* Main heading */}
      <h1>Vite + React</h1>

      {/* Demo counter card */}
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>

        {/* Instructions text */}
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>

      {/* Footer informational text */}
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;