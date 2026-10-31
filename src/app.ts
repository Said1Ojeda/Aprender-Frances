// la app completa, pantallas, lecciones y progreso guardado en el navegador
(() => {
    function $<T extends HTMLElement = HTMLElement>(id: string): T {
        const el = document.getElementById(id);
        if (!el) throw new Error('falta #' + id + ' en el html');
        return el as T;
    }

    function crear<K extends keyof HTMLElementTagNameMap>(tag: K, clase = '', texto?: string): HTMLElementTagNameMap[K] {
        const el = document.createElement(tag);
        if (clase) el.className = clase;
        if (texto !== undefined) el.textContent = texto;
        return el;
    }

    const azar = <T>(lista: T[]): T => lista[Math.floor(Math.random() * lista.length)];

    function revolver<T>(lista: T[]): T[] {
        const r = lista.slice();
        for (let i = r.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [r[i], r[j]] = [r[j], r[i]];
        }
        return r;
    }

    // progreso guardado

    const CLAVE = 'allez';

    function leerProgreso(): Progreso {
        const base: Progreso = { unidades: {} };
        try {
            const guardado = JSON.parse(localStorage.getItem(CLAVE) || '{}');
            return Object.assign(base, guardado);
        } catch (e) {
            return base;
        }
    }

    const progreso = leerProgreso();

    function guardar() {
        try { localStorage.setItem(CLAVE, JSON.stringify(progreso)); } catch (e) {}
    }

    // pantallas

    type Pantalla = 'inicio' | 'leccion' | 'fin';

    function mostrar(p: Pantalla) {
        document.querySelectorAll<HTMLElement>('.pantalla').forEach(s => s.classList.toggle('activa', s.id === 'p-' + p));
        document.body.dataset.pantalla = p;
        window.scrollTo(0, 0);
    }

    document.querySelectorAll<HTMLElement>('[data-ir]').forEach(b => b.addEventListener('click', () => {
        if (b.dataset.ir === 'inicio') irInicio();
    }));

    // inicio

    const desbloqueada = (i: number) => i === 0 || (progreso.unidades[UNIDADES[i - 1].id]?.veces ?? 0) > 0;

    function estrellas(mejor: number | undefined): HTMLElement {
        const cuantas = mejor === undefined ? 0 : mejor >= 1 ? 3 : mejor >= .8 ? 2 : 1;
        const caja = crear('span', 'estrellas');
        caja.setAttribute('aria-label', cuantas + ' de 3 estrellas');
        for (let k = 0; k < 3; k++) caja.appendChild(crear('span', k < cuantas ? '' : 'apagada', '★'));
        return caja;
    }

    function irInicio() {
        const hora = new Date().getHours();
        $('saludo').textContent = hora >= 18 || hora < 5 ? 'Bonsoir' : 'Bonjour';

        const camino = $('camino');
        camino.replaceChildren(...UNIDADES.map((u, i) => {
            const li = crear('li');
            const b = crear('button', 'unidad');
            b.type = 'button';
            b.style.setProperty('--c', u.color);
            const abierta = desbloqueada(i);
            b.disabled = !abierta;

            b.appendChild(crear('span', 'unidad-num', String(i + 1)));
            b.appendChild(crear('h2', '', u.titulo));
            b.appendChild(crear('span', 'fr', u.tituloFr));
            b.appendChild(crear('p', '', abierta ? u.descripcion : 'Termina la unidad anterior para abrirla.'));

            const pie = crear('span', 'unidad-pie');
            const avance = progreso.unidades[u.id];
            pie.appendChild(crear('span', '', avance ? 'Practicada ' + avance.veces + (avance.veces === 1 ? ' vez' : ' veces') : u.palabras.length + ' palabras'));
            pie.appendChild(estrellas(avance?.mejor));
            b.appendChild(pie);

            b.addEventListener('click', () => empezar(u));
            li.appendChild(b);
            return li;
        }));
        pintarIndicadores();
        mostrar('inicio');
    }

    function pintarIndicadores() {
        const hechas = UNIDADES.filter(u => progreso.unidades[u.id]).length;
        const caja = $('indicadores');
        const t = crear('span', '', hechas + ' / ' + UNIDADES.length);
        t.title = 'Unidades practicadas';
        caja.replaceChildren(t);
    }

    // armado de ejercicios

    const LARGO = 10;
    const MAX_ESCRIBIR = 22;

    // las opciones salen de la misma unidad, si no alcanzan se completan con otras
    function distractores(correcta: Palabra, unidad: Unidad, campo: 'fr' | 'es'): string[] {
        const vistos = new Set([correcta[campo]]);
        const salida: string[] = [];
        const fuentes = [revolver(unidad.palabras), revolver(UNIDADES.flatMap(u => u.palabras))];
        for (const fuente of fuentes) {
            for (const p of fuente) {
                if (salida.length === 3) return salida;
                if (vistos.has(p[campo])) continue;
                vistos.add(p[campo]);
                salida.push(p[campo]);
            }
        }
        return salida;
    }

    function ejercicio(tipo: TipoEjercicio, palabra: Palabra, unidad: Unidad): Ejercicio {
        if (tipo === 'escribir' && palabra.fr.length > MAX_ESCRIBIR) tipo = 'inverso';
        const campo = tipo === 'elegir' ? 'es' : 'fr';
        const opciones = tipo === 'escribir' ? [] : revolver([palabra[campo], ...distractores(palabra, unidad, campo)]);
        return { tipo, palabra, opciones };
    }

    // la primera vez cada palabra se presenta para reconocerla y luego se pide al reves
    function armarLeccion(unidad: Unidad): Ejercicio[] {
        const nueva = !progreso.unidades[unidad.id];
        const palabras = revolver(unidad.palabras).slice(0, nueva ? 7 : LARGO);
        if (nueva) {
            const presentar = palabras.map(p => ejercicio('elegir', p, unidad));
            const repasar = revolver(palabras).slice(0, LARGO - presentar.length)
                .map(p => ejercicio(azar<TipoEjercicio>(['inverso', 'escribir']), p, unidad));
            return [...presentar.slice(0, 4), ...repasar.slice(0, 1), ...presentar.slice(4), ...repasar.slice(1)];
        }
        return palabras.map(p => ejercicio(azar<TipoEjercicio>(['elegir', 'inverso', 'escribir']), p, unidad));
    }

    // leccion

    interface Sesion {
        unidad: Unidad;
        cola: Ejercicio[];
        total: number;
        hechos: number;
        aciertos: number;
        intentos: number;
        repetidos: Set<Ejercicio>;
    }

    let sesion: Sesion | null = null;
    let actual: Ejercicio | null = null;
    let respuesta = '';
    let revisado = false;

    const caja = $('ejercicio');
    const boton = $<HTMLButtonElement>('comprobar');
    const pie = $('pie');
    const veredicto = $('veredicto');

    function empezar(unidad: Unidad) {
        const cola = armarLeccion(unidad);
        sesion = { unidad, cola, total: cola.length, hechos: 0, aciertos: 0, intentos: 0, repetidos: new Set() };
        mostrar('leccion');
        siguiente();
    }

    function pintarAvance() {
        if (!sesion) return;
        const pct = Math.round(100 * sesion.hechos / sesion.total);
        const barra = $('avance');
        barra.setAttribute('aria-valuenow', String(pct));
        (barra.firstElementChild as HTMLElement).style.width = pct + '%';
    }

    function siguiente() {
        if (!sesion) return;
        pintarAvance();
        const e = sesion.cola.shift();
        if (!e) return terminar();
        actual = e;
        respuesta = '';
        revisado = false;
        pie.classList.remove('bien', 'mal');
        veredicto.replaceChildren();
        boton.textContent = 'Comprobar';
        boton.disabled = true;
        pintarEjercicio(e);
    }

    const CONSIGNA: Record<TipoEjercicio, string> = {
        elegir: '¿Qué significa?',
        inverso: '¿Cómo se dice en francés?',
        escribir: 'Escríbelo en francés'
    };

    function pintarEjercicio(e: Ejercicio) {
        const partes: HTMLElement[] = [crear('p', 'consigna', CONSIGNA[e.tipo])];
        const enFrances = e.tipo === 'elegir';

        const palabra = crear('div', 'palabra');
        palabra.lang = enFrances ? 'fr' : 'es';
        palabra.appendChild(crear('span', '', enFrances ? e.palabra.fr : e.palabra.es));
        partes.push(palabra);
        partes.push(crear('p', 'pista', enFrances && e.palabra.pista ? 'Suena como ' + e.palabra.pista : ''));

        if (e.tipo === 'escribir') partes.push(...campoEscribir());
        else partes.push(pintarOpciones(e));

        caja.replaceChildren(...partes);
        const primero = caja.querySelector<HTMLElement>('textarea, .opcion');
        if (primero && matchMedia('(pointer: fine)').matches) primero.focus();
    }

    function pintarOpciones(e: Ejercicio): HTMLElement {
        const lista = crear('div', 'opciones');
        lista.setAttribute('role', 'group');
        e.opciones.forEach((texto, i) => {
            const b = crear('button', 'opcion');
            b.type = 'button';
            b.dataset.valor = texto;
            if (e.tipo !== 'elegir') b.lang = 'fr';
            b.appendChild(crear('kbd', '', String(i + 1)));
            b.appendChild(crear('span', '', texto));
            b.addEventListener('click', () => elegir(texto));
            lista.appendChild(b);
        });
        return lista;
    }

    function elegir(texto: string) {
        if (revisado) return;
        respuesta = texto;
        caja.querySelectorAll<HTMLElement>('.opcion').forEach(o => o.classList.toggle('elegida', o.dataset.valor === texto));
        boton.disabled = false;
    }

    function campoEscribir(): HTMLElement[] {
        const area = crear('textarea', 'escribe');
        area.lang = 'fr';
        area.rows = 3;
        area.placeholder = 'Escribe en francés';
        area.setAttribute('aria-label', 'Tu respuesta en francés');
        area.autocapitalize = 'off';
        area.spellcheck = false;
        area.addEventListener('input', () => {
            respuesta = area.value;
            boton.disabled = !area.value.trim();
        });

        // en muchos teclados no salen estas letras, asi se ponen con un toque
        const acentos = crear('div', 'acentos');
        for (const letra of ['é', 'è', 'ê', 'à', 'ç', 'ô', 'û', 'î', 'ï', 'œ', "'"]) {
            const b = crear('button', '', letra);
            b.type = 'button';
            b.setAttribute('aria-label', 'Escribir ' + letra);
            b.addEventListener('click', () => {
                const ini = area.selectionStart, fin = area.selectionEnd;
                area.setRangeText(letra, ini, fin, 'end');
                area.dispatchEvent(new Event('input'));
                area.focus();
            });
            acentos.appendChild(b);
        }
        return [area, acentos];
    }

    // revision de respuestas

    const sinAcentos = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '');

    function limpiar(t: string): string {
        return t.toLowerCase()
            .replace(/[’`´]/g, "'")
            .replace(/[¿?¡!.,;:…]/g, ' ')
            .replace(/\s*-\s*/g, '-')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function distancia(a: string, b: string): number {
        const fila = Array.from({ length: b.length + 1 }, (_, j) => j);
        for (let i = 1; i <= a.length; i++) {
            let previo = fila[0];
            fila[0] = i;
            for (let j = 1; j <= b.length; j++) {
                const guardado = fila[j];
                fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, previo + (a[i - 1] === b[j - 1] ? 0 : 1));
                previo = guardado;
            }
        }
        return fila[b.length];
    }

    type Resultado = { bien: boolean; nota?: string };

    function revisarEscrito(escrito: string, correcto: string): Resultado {
        const a = limpiar(escrito), b = limpiar(correcto);
        if (a === b) return { bien: true };
        if (sinAcentos(a) === sinAcentos(b)) return { bien: true, nota: 'Ojo con los acentos, se escribe ' + correcto };
        if (b.length > 4 && distancia(sinAcentos(a), sinAcentos(b)) === 1) return { bien: true, nota: 'Casi exacto, se escribe ' + correcto };
        return { bien: false };
    }

    function revisar() {
        if (!sesion || !actual) return;
        const e = actual;
        const correcto = e.tipo === 'elegir' ? e.palabra.es : e.palabra.fr;
        const r: Resultado = e.tipo === 'escribir' ? revisarEscrito(respuesta, correcto) : { bien: respuesta === correcto };

        revisado = true;
        sesion.intentos++;
        caja.querySelectorAll<HTMLButtonElement>('.opcion').forEach(o => {
            o.disabled = true;
            if (o.dataset.valor === correcto) o.classList.add('bien');
            else if (o.dataset.valor === respuesta) o.classList.add('mal');
        });
        const area = caja.querySelector('textarea');
        if (area) area.readOnly = true;

        if (r.bien) {
            sesion.aciertos++;
            sesion.hechos++;
        } else if (!sesion.repetidos.has(e)) {
            // lo que fallas regresa al final de la leccion, una sola vez
            sesion.repetidos.add(e);
            sesion.cola.push(e);
            sesion.total++;
            sesion.hechos++;
        } else {
            sesion.hechos++;
        }

        pie.classList.add(r.bien ? 'bien' : 'mal');
        const titulo = crear('b', '', r.bien ? azar(['¡Muy bien!', '¡Exacto!', 'Parfait !', '¡Eso!']) : 'Respuesta correcta');
        const detalle = crear('span', '', r.bien ? r.nota ?? '' : correcto);
        if (!r.bien && e.tipo !== 'elegir') detalle.lang = 'fr';
        veredicto.replaceChildren(titulo, detalle);
        boton.textContent = 'Continuar';
        boton.disabled = false;
        boton.focus();
    }

    boton.addEventListener('click', () => revisado ? siguiente() : revisar());

    function terminar() {
        if (!sesion) return;
        const s = sesion;
        const pct = s.intentos ? s.aciertos / s.intentos : 0;
        const antes = progreso.unidades[s.unidad.id];
        progreso.unidades[s.unidad.id] = { veces: (antes?.veces ?? 0) + 1, mejor: Math.max(antes?.mejor ?? 0, pct) };
        guardar();

        $('fin-frase').textContent = pct === 1 ? 'Sin un solo error, impecable.' : pct >= .8 ? 'Muy bien, ya casi la dominas.' : 'Vas bien, repítela para afianzar.';

        const dato = (n: string, t: string) => {
            const d = crear('div', 'dato');
            d.append(crear('b', '', n), crear('span', '', t));
            return d;
        };
        $('resumen').replaceChildren(
            dato(Math.round(pct * 100) + '%', 'de aciertos'),
            dato(String(s.unidad.palabras.length), 'palabras en la unidad')
        );

        const tip = $('tip');
        tip.replaceChildren(crear('b', '', s.unidad.tip.titulo), crear('span', '', s.unidad.tip.texto));
        sesion = null;
        actual = null;
        mostrar('fin');
    }

    $('salir').addEventListener('click', irInicio);

    // teclado, numeros para elegir y enter para seguir

    document.addEventListener('keydown', ev => {
        if (document.body.dataset.pantalla !== 'leccion' || !actual) return;
        const enTexto = ev.target instanceof HTMLTextAreaElement;
        if (ev.key === 'Enter' && !ev.shiftKey) {
            // en el cuadro de texto el enter nunca hace salto de linea
            if (enTexto) ev.preventDefault();
            if (!boton.disabled) {
                ev.preventDefault();
                boton.click();
            }
            return;
        }
        if (ev.key === 'Escape') return irInicio();
        if (enTexto || revisado) return;
        const n = Number(ev.key);
        if (n >= 1 && n <= actual.opciones.length) elegir(actual.opciones[n - 1]);
    });

    irInicio();
})();
