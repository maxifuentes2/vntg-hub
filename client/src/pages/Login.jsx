import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const API_URL = import.meta.env.VITE_API_URL || "http://kernelos-pc:5000";

export default function Login() {
    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credentialResponse.credential })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('vntg_user', JSON.stringify(data.user));
                navigate('/');
                window.location.reload();
            } else {
                alert("Error al iniciar sesión con Google");
            }
        } catch (error) { console.error("Error de red:", error); }
    };

    return (
        <div className="bg-white dark:bg-brand-dark min-h-screen flex items-center justify-center px-4 font-sans py-20 transition-colors">
            <div className="max-w-md w-full bg-zinc-50 dark:bg-[#111111] border border-zinc-200 dark:border-white/5 p-12 text-center relative shadow-2xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange transform rotate-45 translate-x-12 -translate-y-12"></div>
                <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2 text-zinc-900 dark:text-white">Login</h1>
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mb-10 italic tracking-[0.3em]">Access your profile</p>
                <form className="space-y-4 text-left" onSubmit={(e) => e.preventDefault()}>
                    <input type="email" placeholder="EMAIL" className="w-full bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 p-4 font-bold uppercase italic focus:border-brand-blue outline-none" />
                    <input type="password" placeholder="PASSWORD" className="w-full bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 p-4 font-bold uppercase italic focus:border-brand-blue outline-none" />
                    <button className="w-full bg-brand-blue text-white py-4 font-black uppercase italic tracking-widest hover:bg-brand-orange transition-all mt-4 shadow-lg shadow-blue-900/20">
                        Entrar
                    </button>
                </form>
                <div className="my-8 flex items-center gap-4 text-zinc-300 dark:text-zinc-700 font-black italic text-[10px]">
                    <div className="h-px flex-grow bg-zinc-200 dark:bg-white/5"></div> O <div className="h-px flex-grow bg-zinc-200 dark:bg-white/5"></div>
                </div>
                <div className="flex justify-center">
                    <GoogleLogin onSuccess={handleGoogleSuccess} theme="filled_black" shape="square" />
                </div>
                <p className="mt-10 text-[11px] font-bold uppercase italic text-zinc-500">
                    ¿No tienes cuenta? <Link to="/register" className="text-brand-orange hover:text-zinc-900 dark:hover:text-white transition-colors">Regístrate</Link>
                </p>
            </div>
        </div>
    );
}