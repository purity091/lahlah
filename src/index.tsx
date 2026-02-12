
import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './AppRouter';
import { ErrorBoundary } from "react-error-boundary";

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <AppRouter />
    </ErrorBoundary>
  </React.StrictMode>
);
