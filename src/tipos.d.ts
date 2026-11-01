// tipos que comparten todos los archivos de la app

interface Palabra {
    fr: string;
    es: string;
    // como suena escrito a la espanola, es solo una ayuda
    pista?: string;
}

// una oracion completa para armar con fichas
interface Frase {
    fr: string;
    es: string;
}

interface Unidad {
    id: string;
    titulo: string;
    tituloFr: string;
    descripcion: string;
    color: string;
    palabras: Palabra[];
    frases?: Frase[];
    tip: { titulo: string; texto: string };
}

type TipoEjercicio = 'elegir' | 'inverso' | 'escribir' | 'escuchar' | 'hablar' | 'armar';

interface Ejercicio {
    tipo: TipoEjercicio;
    palabra: Palabra;
    // en armar son las fichas revueltas, en los demas las respuestas para escoger
    opciones: string[];
}

interface AvanceUnidad {
    veces: number;
    // mejor porcentaje de aciertos
    mejor: number;
}

// una palabra en el repaso espaciado
interface Tarjeta {
    caja: number;
    // dia en que toca repasarla, como 2026-10-30
    toca: string;
}

interface Progreso {
    unidades: Record<string, AvanceUnidad>;
    tarjetas: Record<string, Tarjeta>;
    // si la palabra se pronuncia sola al aparecer
    voz: boolean;
    xp: number;
    racha: number;
    ultimoDia: string;
    xpHoy: { dia: string; xp: number };
}
