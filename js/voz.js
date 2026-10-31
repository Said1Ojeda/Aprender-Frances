"use strict";
// pronunciacion con la voz que trae el navegador, sin archivos de audio
const Voz = (() => {
    let voz = null;
    const hay = 'speechSynthesis' in window;
    // primero frances de francia y si no cualquier frances, canada o belgica tambien sirven
    function buscarVoz() {
        if (!hay)
            return;
        const todas = speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith('fr'));
        voz = todas.find(v => v.lang === 'fr-FR' && v.localService)
            || todas.find(v => v.lang === 'fr-FR')
            || todas[0]
            || null;
        avisar();
    }
    // las voces llegan tarde en chrome, por eso hay que avisar cuando ya estan
    const oyentes = [];
    const avisar = () => oyentes.forEach(f => f());
    if (hay) {
        buscarVoz();
        speechSynthesis.addEventListener('voiceschanged', buscarVoz);
    }
    function puedeHablar() {
        return voz !== null;
    }
    function decir(texto, lento = false) {
        return new Promise(listo => {
            if (!voz)
                return listo();
            speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(texto);
            u.voice = voz;
            u.lang = voz.lang;
            u.rate = lento ? .6 : .92;
            u.onend = () => listo();
            u.onerror = () => listo();
            speechSynthesis.speak(u);
        });
    }
    function callar() {
        if (hay)
            speechSynthesis.cancel();
    }
    const ventana = window;
    const Reconocimiento = ventana.SpeechRecognition || ventana.webkitSpeechRecognition;
    function puedeOir() {
        return !!Reconocimiento;
    }
    let oyendo = null;
    // devuelve lo que entendio, varias opciones por si la primera no es la buena
    function oir() {
        return new Promise((listo, falla) => {
            if (!Reconocimiento)
                return falla(new Error('no-soportado'));
            callar();
            const r = new Reconocimiento();
            r.lang = 'fr-FR';
            r.interimResults = false;
            r.maxAlternatives = 5;
            let dicho = [];
            r.onresult = ev => {
                const primero = ev.results[0];
                dicho = Array.from({ length: primero.length }, (_, i) => primero[i].transcript);
            };
            r.onerror = ev => falla(new Error(ev.error));
            r.onend = () => {
                oyendo = null;
                if (dicho.length)
                    listo(dicho);
                else
                    falla(new Error('no-speech'));
            };
            oyendo = r;
            r.start();
        });
    }
    function dejarDeOir() {
        if (oyendo)
            oyendo.abort();
        oyendo = null;
    }
    return { puedeHablar, decir, callar, puedeOir, oir, dejarDeOir, alCambiar: (f) => oyentes.push(f) };
})();
