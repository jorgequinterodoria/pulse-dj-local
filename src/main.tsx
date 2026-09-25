import React from 'react';
import ReactDOM from 'react-dom/client';
import { getCurrentWindow } from '@tauri-apps/api/window';
import App from './App';
import Settings from './Settings';
import './index.css';

const currentWindow = getCurrentWindow();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {/* Enrutamiento nativo: Si la ventana se llama 'settings', abre el panel, si no, abre el HUD */}
    {currentWindow.label === 'settings' ? <Settings /> : <App />}
  </React.StrictMode>
);