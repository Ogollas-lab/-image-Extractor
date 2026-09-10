import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { FileProvider } from './context/FileContext';
import { router } from './router';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FileProvider>
      <RouterProvider router={router} />
    </FileProvider>
  </React.StrictMode>,
);
