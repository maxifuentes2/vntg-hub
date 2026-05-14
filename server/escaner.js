require('dotenv').config();

async function escanear() {
    console.log("🔌 Conectando escáner a Google...");
    console.log("Llave actual termina en:", process.env.GEMINI_API_KEY.slice(-4));
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.models) {
            console.log("✅ MOTORES HABILITADOS PARA ESTA LLAVE:");
            data.models.forEach(m => console.log(` - ${m.name}`));
        } else {
            console.log("❌ GOOGLE RECHAZA LA LLAVE. Motivo:", data);
        }
    } catch (error) {
        console.log("Error de conexión:", error.message);
    }
}

escanear();