import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// IMPORTAMOS TU NUEVA PÁGINA REAL
import Inicio from './pages/Inicio';

// Dejamos Login y Registro de relleno solo por ahora
const Login = () => (
  <div className="py-20 flex justify-center text-3xl font-bold text-black dark:text-white transition-colors duration-300">
    Página de Login
  </div>
);

const Registro = () => (
  <div className="py-20 flex justify-center text-3xl font-bold text-black dark:text-white transition-colors duration-300">
    Página de Registro
  </div>
);

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-neutral-900 transition-colors duration-300">
        
        <Navbar />

        <main className="flex-grow">
          <Routes>
            {/* AHORA CARGA EL ARCHIVO Inicio.jsx QUE CREASTE */}
            <Route path="/" element={<Inicio />} />
            
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Registro />} />
          </Routes>
        </main>

        <Footer />
        
      </div>
    </Router>
  );
}

export default App;