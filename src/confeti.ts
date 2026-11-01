// confeti en un canvas que se pone encima de todo y se quita solo al terminar
const Confeti = (() => {
    const COLORES = ['#2F5BEA', '#E5484D', '#F5B83D', '#20925E', '#9B51E0', '#FFFFFF'];

    interface Papel { x: number; y: number; vx: number; vy: number; giro: number; vgiro: number; ancho: number; alto: number; color: string; vida: number; }

    function lanzar(cantidad = 120) {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const lienzo = document.createElement('canvas');
        lienzo.className = 'confeti';
        lienzo.setAttribute('aria-hidden', 'true');
        document.body.appendChild(lienzo);
        const ctx = lienzo.getContext('2d');
        if (!ctx) return lienzo.remove();

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = innerWidth, h = innerHeight;
        lienzo.width = w * dpr;
        lienzo.height = h * dpr;
        ctx.scale(dpr, dpr);

        // salen de dos lados de abajo, como cañoncitos
        const papeles: Papel[] = Array.from({ length: cantidad }, (_, i) => {
            const izquierda = i % 2 === 0;
            const ang = (izquierda ? -60 : -120) * Math.PI / 180 + (Math.random() - .5) * .6;
            const fuerza = 9 + Math.random() * 8;
            return {
                x: izquierda ? w * .1 : w * .9,
                y: h * .85,
                vx: Math.cos(ang) * fuerza,
                vy: Math.sin(ang) * fuerza,
                giro: Math.random() * Math.PI,
                vgiro: (Math.random() - .5) * .3,
                ancho: 6 + Math.random() * 6,
                alto: 8 + Math.random() * 8,
                color: COLORES[i % COLORES.length],
                vida: 1
            };
        });

        let previo = performance.now();
        function cuadro(ahora: number) {
            // en cel lento el paso se ajusta al tiempo real, asi no cae en camara lenta
            const f = Math.min((ahora - previo) / 16.7, 3);
            previo = ahora;
            ctx!.clearRect(0, 0, w, h);
            let vivos = 0;
            for (const p of papeles) {
                p.vy += .32 * f;
                p.vx *= Math.pow(.985, f);
                p.x += p.vx * f;
                p.y += p.vy * f;
                p.giro += p.vgiro * f;
                if (p.vy > 0) p.vida -= .008 * f;
                if (p.vida <= 0 || p.y > h + 20) continue;
                vivos++;
                ctx!.save();
                ctx!.translate(p.x, p.y);
                ctx!.rotate(p.giro);
                ctx!.globalAlpha = Math.min(1, p.vida * 2);
                ctx!.fillStyle = p.color;
                // el seno hace que el papelito parezca que da vueltas
                ctx!.fillRect(-p.ancho / 2, -p.alto / 2, p.ancho, p.alto * Math.abs(Math.cos(p.giro * 2)));
                ctx!.restore();
            }
            if (vivos) requestAnimationFrame(cuadro);
            else lienzo.remove();
        }
        requestAnimationFrame(cuadro);
    }

    return { lanzar };
})();
