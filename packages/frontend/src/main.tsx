import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AppKitProvider } from './AppKitProvider.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppKitProvider>
      <App />
    </AppKitProvider>
  </React.StrictMode>,
);

if (import.meta.env.PROD) {
  void import('./insights.ts').then(({ scheduleInsights }) => {
    scheduleInsights();
  });
}
