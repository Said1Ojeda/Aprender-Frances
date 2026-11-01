// medallas, cada una revisa el progreso y dice si ya se gano
// se revisan al terminar cada leccion, nunca se quitan aunque luego baje la racha
const MEDALLAS: Medalla[] = [
    { id: 'primera', icono: '🌱', nombre: 'Primer paso', como: 'Termina tu primera lección', ganada: p => Object.keys(p.unidades).length > 0 },
    { id: 'perfecta', icono: '💯', nombre: 'Impecable', como: 'Termina una lección sin errores', ganada: p => p.perfectas >= 1 },
    { id: 'perfectas10', icono: '🎯', nombre: 'Puntería fina', como: 'Diez lecciones sin errores', ganada: p => p.perfectas >= 10 },
    { id: 'repaso', icono: '🔁', nombre: 'Buena memoria', como: 'Termina tu primer repaso', ganada: p => p.repasos >= 1 },
    { id: 'racha3', icono: '🔥', nombre: 'Encendido', como: 'Racha de 3 días', ganada: p => p.racha >= 3 },
    { id: 'racha7', icono: '📅', nombre: 'Una semana', como: 'Racha de 7 días', ganada: p => p.racha >= 7 },
    { id: 'racha30', icono: '🏆', nombre: 'Un mes entero', como: 'Racha de 30 días', ganada: p => p.racha >= 30 },
    { id: 'unidades5', icono: '🗺️', nombre: 'A medio camino', como: 'Practica 5 unidades', ganada: p => Object.keys(p.unidades).length >= 5 },
    { id: 'todas', icono: '🇫🇷', nombre: 'Todo el A1', como: 'Practica todas las unidades', ganada: p => UNIDADES.every(u => p.unidades[u.id]) },
    { id: 'palabras25', icono: '📚', nombre: 'Vocabulario', como: 'Aprende 25 palabras', ganada: p => Object.values(p.tarjetas).filter(t => t.caja >= 3).length >= 25 },
    { id: 'palabras100', icono: '🧠', nombre: 'Diccionario andante', como: 'Aprende 100 palabras', ganada: p => Object.values(p.tarjetas).filter(t => t.caja >= 3).length >= 100 },
    { id: 'nivel5', icono: '⭐', nombre: 'Nivel 5', como: 'Llega a 400 XP', ganada: p => p.xp >= 400 }
];
