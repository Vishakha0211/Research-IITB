import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ReportProvider } from './context/ReportContext';
import { BASENAME } from './lib/paths';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={BASENAME}>
      <ReportProvider>
        <App />
      </ReportProvider>
    </BrowserRouter>
  </React.StrictMode>
);
