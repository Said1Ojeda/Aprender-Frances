// tipos que comparten todos los archivos de la app

interface Palabra {
    fr: string;
    es: string;
    // como suena escrito a la espanola, es solo una ayuda
    pista?: string;
}

interface Unidad {
    id: string;
    titulo: string;
    tituloFr: string;
    descripcion: string;
    color: string;
    palabras: Palabra[];
    tip: { titulo: string; texto: string };
}

type TipoEjercicio = 'elegir' | 'inverso' | 'escribir' | 'escuchar' | 'hablar';

interface Ejercicio {
    tipo: TipoEjercicio;
    palabra: Palabra;
    opciones: string[];
}

interface AvanceUnidad {
    veces: number;
    // mejor porcentaje de aciertos
    mejor: number;
}

interface Progreso {
    unidades: Record<string, AvanceUnidad>;
    // si la palabra se pronuncia sola al aparecer
    voz: boolean;
}
