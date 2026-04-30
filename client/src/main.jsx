import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google';

// Tu ID de cliente
const GOOGLE_CLIENT_ID = "696586117644-ded6fdn6sfefsoutitrouo0k93rjgc15.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {/* Sacamos el BrowserRouter de acá porque ya vive en App.jsx */}
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)