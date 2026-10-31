// repaso espaciado con cajas, como las tarjetas de anki
// cada acierto sube la palabra de caja y la aleja, cada fallo la regresa a la primera
const Repaso = (() => {
    // dias hasta el siguiente repaso segun la caja
    const ESPERA = [0, 1, 2, 4, 8, 16];
    const ULTIMA = ESPERA.length - 1;

    // fecha local en texto, asi un repaso de las 11 de la noche no se cuenta para manana
    function dia(desfase = 0): string {
        const d = new Date();
        d.setDate(d.getDate() + desfase);
        const dos = (n: number) => String(n).padStart(2, '0');
        return d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate());
    }

    function registrar(tarjetas: Record<string, Tarjeta>, fr: string, bien: boolean) {
        const antes = tarjetas[fr]?.caja ?? 0;
        const caja = bien ? Math.min(antes + 1, ULTIMA) : 1;
        tarjetas[fr] = { caja, toca: dia(ESPERA[caja]) };
    }

    function pendientes(tarjetas: Record<string, Tarjeta>): string[] {
        const hoy = dia();
        return Object.keys(tarjetas)
            .filter(fr => tarjetas[fr].toca <= hoy)
            // primero las que mas cuestan
            .sort((a, b) => tarjetas[a].caja - tarjetas[b].caja);
    }

    // desde la caja 3 ya aguanto varios dias sin olvidarse
    const aprendidas = (tarjetas: Record<string, Tarjeta>) =>
        Object.values(tarjetas).filter(t => t.caja >= 3).length;

    return { dia, registrar, pendientes, aprendidas };
})();
