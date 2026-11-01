"use strict";
// repaso espaciado con cajas, como las tarjetas de anki
// cada acierto sube la palabra de caja y la aleja, cada fallo la regresa a la primera
const Repaso = (() => {
    // dias hasta el siguiente repaso segun la caja
    const ESPERA = [0, 1, 2, 4, 8, 16];
    const ULTIMA = ESPERA.length - 1;
    // fecha local en texto, asi un repaso de las 11 de la noche no se cuenta para manana
    function dia(desfase = 0) {
        const d = new Date();
        d.setDate(d.getDate() + desfase);
        const dos = (n) => String(n).padStart(2, '0');
        return d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate());
    }
    function registrar(tarjetas, fr, bien) {
        const antes = tarjetas[fr]?.caja ?? 0;
        const caja = bien ? Math.min(antes + 1, ULTIMA) : 1;
        tarjetas[fr] = { caja, toca: dia(ESPERA[caja]) };
    }
    function pendientes(tarjetas) {
        const hoy = dia();
        return Object.keys(tarjetas)
            .filter(fr => tarjetas[fr].toca <= hoy)
            // primero las que mas cuestan
            .sort((a, b) => tarjetas[a].caja - tarjetas[b].caja);
    }
    // desde la caja 3 ya aguanto varios dias sin olvidarse
    const aprendidas = (tarjetas) => Object.values(tarjetas).filter(t => t.caja >= 3).length;
    // repasar gana sobre lo demas, aunque ya estuviera aprendida
    function estado(t) {
        if (!t)
            return 'nueva';
        if (t.toca <= dia())
            return 'repasar';
        return t.caja >= 3 ? 'aprendida' : 'aprendiendo';
    }
    return { dia, registrar, pendientes, aprendidas, estado };
})();
