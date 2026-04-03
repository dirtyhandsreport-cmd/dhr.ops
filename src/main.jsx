import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import DHRFactory from './OilGasHeadlines.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DHRFactory />
  </StrictMode>
);
