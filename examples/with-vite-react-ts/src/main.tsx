import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  return <div>Hello React + Vite + TS</div>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

