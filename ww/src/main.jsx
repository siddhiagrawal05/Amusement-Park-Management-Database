import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth';
import { loadData } from './api';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
const box = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center', fontFamily: 'Quicksand, sans-serif', fontSize: 20, fontWeight: 700, color: '#1E44A8' };

root.render(<div style={box}>Loading WonderWorld...</div>);

loadData()
  .then(() =>
    root.render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    )
  )
  .catch(() =>
    root.render(<div style={box}>Cannot reach the server. Start the backend (node --watch server.js in the srv folder) and refresh.</div>)
  );