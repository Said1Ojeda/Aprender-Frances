// las unidades del nivel a1, en el orden en que se desbloquean
// la pista es como suena escrito a la espanola, no es exacta pero ayuda al inicio

const UNIDADES: Unidad[] = [
    {
        id: 'saludos',
        titulo: 'Saludos',
        tituloFr: 'Les salutations',
        descripcion: 'Saludar, despedirte, dar las gracias y presentarte.',
        color: '#2F5BEA',
        palabras: [
            { fr: 'bonjour', es: 'hola / buenos días', pista: 'bon-yur' },
            { fr: 'bonsoir', es: 'buenas noches, al llegar', pista: 'bon-suar' },
            { fr: 'salut', es: 'hola, entre amigos', pista: 'salü' },
            { fr: 'au revoir', es: 'adiós', pista: 'o-revuar' },
            { fr: 'merci', es: 'gracias', pista: 'mersí' },
            { fr: 'merci beaucoup', es: 'muchas gracias', pista: 'mersí bocú' },
            { fr: "s'il vous plaît", es: 'por favor', pista: 'sil vu plé' },
            { fr: 'oui', es: 'sí', pista: 'uí' },
            { fr: 'non', es: 'no', pista: 'non, por la nariz' },
            { fr: 'excusez-moi', es: 'disculpe', pista: 'ekskü-sé muá' },
            { fr: "je m'appelle", es: 'me llamo', pista: 'yö ma-pél' },
            { fr: 'comment ça va ?', es: '¿cómo estás?', pista: 'ko-mán sa va' },
            { fr: 'ça va bien', es: 'estoy bien', pista: 'sa va bián' }
        ],
        tip: {
            titulo: 'Bonsoir no es bonne nuit',
            texto: 'Bonsoir se dice al llegar a un lugar en la noche. Bonne nuit es solo para cuando alguien se va a dormir, como nuestro "que descanses".'
        }
    },
    {
        id: 'numeros',
        titulo: 'Números',
        tituloFr: 'Les nombres',
        descripcion: 'Contar del uno al diez, y el veinte y el cien.',
        color: '#E5484D',
        palabras: [
            { fr: 'un', es: 'uno', pista: 'an, por la nariz' },
            { fr: 'deux', es: 'dos', pista: 'dö' },
            { fr: 'trois', es: 'tres', pista: 'truá' },
            { fr: 'quatre', es: 'cuatro', pista: 'katr' },
            { fr: 'cinq', es: 'cinco', pista: 'sank' },
            { fr: 'six', es: 'seis', pista: 'sis' },
            { fr: 'sept', es: 'siete', pista: 'set' },
            { fr: 'huit', es: 'ocho', pista: 'uít' },
            { fr: 'neuf', es: 'nueve', pista: 'nöf' },
            { fr: 'dix', es: 'diez', pista: 'dis' },
            { fr: 'vingt', es: 'veinte', pista: 'van' },
            { fr: 'cent', es: 'cien', pista: 'san' }
        ],
        tip: {
            titulo: 'El francés cuenta raro después del 60',
            texto: '70 es soixante-dix, sesenta y diez. 80 es quatre-vingts, cuatro veintes. 90 es quatre-vingt-dix, cuatro veintes y diez. En Bélgica y Suiza dicen septante y nonante, mucho más fácil.'
        }
    },
    {
        id: 'colores',
        titulo: 'Colores',
        tituloFr: 'Les couleurs',
        descripcion: 'Los colores más comunes y dónde van en la oración.',
        color: '#20925E',
        palabras: [
            { fr: 'rouge', es: 'rojo', pista: 'rush' },
            { fr: 'bleu', es: 'azul', pista: 'blö' },
            { fr: 'vert', es: 'verde', pista: 'ver' },
            { fr: 'jaune', es: 'amarillo', pista: 'yon' },
            { fr: 'noir', es: 'negro', pista: 'nuar' },
            { fr: 'blanc', es: 'blanco', pista: 'blan' },
            { fr: 'orange', es: 'anaranjado', pista: 'o-ransh' },
            { fr: 'rose', es: 'rosado', pista: 'ros' },
            { fr: 'gris', es: 'gris', pista: 'grí' },
            { fr: 'violet', es: 'morado', pista: 'vio-lé' },
            { fr: 'marron', es: 'café, el color', pista: 'ma-rón' }
        ],
        tip: {
            titulo: 'El color va después y cambia con el femenino',
            texto: 'Igual que en español, el color va después de la cosa, une fleur jaune. Con palabras femeninas muchos cambian, vert pasa a verte, noir a noire y blanc a blanche.'
        }
    },
    {
        id: 'familia',
        titulo: 'Familia',
        tituloFr: 'La famille',
        descripcion: 'Hablar de tu familia y de tus amigos.',
        color: '#C98A0A',
        palabras: [
            { fr: 'la mère', es: 'la mamá', pista: 'la mer' },
            { fr: 'le père', es: 'el papá', pista: 'lö per' },
            { fr: 'le frère', es: 'el hermano', pista: 'lö frer' },
            { fr: 'la sœur', es: 'la hermana', pista: 'la sör' },
            { fr: 'le fils', es: 'el hijo', pista: 'lö fis' },
            { fr: 'la fille', es: 'la hija', pista: 'la fiy' },
            { fr: 'les parents', es: 'los papás', pista: 'le pa-rán' },
            { fr: 'le grand-père', es: 'el abuelo', pista: 'lö gran-per' },
            { fr: 'la grand-mère', es: 'la abuela', pista: 'la gran-mer' },
            { fr: "l'ami", es: 'el amigo', pista: 'la-mí' },
            { fr: "l'amie", es: 'la amiga', pista: 'la-mí' },
            { fr: 'la femme', es: 'la esposa / la mujer', pista: 'la fam' }
        ],
        tip: {
            titulo: 'Le, la, l y les',
            texto: 'Le es el, la es la y les es los o las. Si la palabra empieza con vocal se junta, l\'ami. Fille sirve para hija y también para muchacha, depende de la frase.'
        }
    },
    {
        id: 'comida',
        titulo: 'Comida',
        tituloFr: 'La nourriture',
        descripcion: 'Pedir en un café y lo básico de la mesa.',
        color: '#9B51E0',
        palabras: [
            { fr: 'le pain', es: 'el pan', pista: 'lö pan' },
            { fr: 'le fromage', es: 'el queso', pista: 'lö fro-mash' },
            { fr: "l'eau", es: 'el agua', pista: 'lo' },
            { fr: 'le café', es: 'el café', pista: 'lö ka-fé' },
            { fr: 'le lait', es: 'la leche', pista: 'lö lé' },
            { fr: 'la pomme', es: 'la manzana', pista: 'la pom' },
            { fr: 'le poulet', es: 'el pollo', pista: 'lö pu-lé' },
            { fr: 'le riz', es: 'el arroz', pista: 'lö rí' },
            { fr: 'les œufs', es: 'los huevos', pista: 'le-sö' },
            { fr: 'le gâteau', es: 'el pastel', pista: 'lö ga-tó' },
            { fr: 'je voudrais un café', es: 'quisiera un café', pista: 'yö vu-dré an ka-fé' },
            { fr: "l'addition, s'il vous plaît", es: 'la cuenta, por favor', pista: 'la-di-sión sil vu plé' }
        ],
        tip: {
            titulo: 'Je voudrais, la palabra mágica',
            texto: 'Je voudrais es quisiera, y suena mucho más amable que je veux, que es quiero. Y ojo, la papa es pomme de terre, la manzana de la tierra.'
        }
    },
    {
        id: 'etre-avoir',
        titulo: 'Ser, estar y tener',
        tituloFr: 'Être et avoir',
        descripcion: 'Los dos verbos que más vas a usar.',
        color: '#0E8FC9',
        palabras: [
            { fr: 'je suis', es: 'yo soy / yo estoy', pista: 'yö suí' },
            { fr: 'tu es', es: 'tú eres / tú estás', pista: 'tü é' },
            { fr: 'il est', es: 'él es / él está', pista: 'il é' },
            { fr: 'nous sommes', es: 'nosotros somos', pista: 'nu som' },
            { fr: 'vous êtes', es: 'ustedes son / usted es', pista: 'vu-sét' },
            { fr: 'ils sont', es: 'ellos son', pista: 'il són, con s' },
            { fr: "j'ai", es: 'yo tengo', pista: 'yé' },
            { fr: 'tu as', es: 'tú tienes', pista: 'tü a' },
            { fr: 'il a', es: 'él tiene', pista: 'il a' },
            { fr: 'nous avons', es: 'nosotros tenemos', pista: 'nu-sa-vón' },
            { fr: 'vous avez', es: 'ustedes tienen', pista: 'vu-sa-vé' },
            { fr: 'ils ont', es: 'ellos tienen', pista: 'il-són, con z' }
        ],
        tip: {
            titulo: 'En francés la edad y el hambre se tienen',
            texto: 'Être sirve para ser y estar. Para la edad se usa avoir, j\'ai vingt ans es tengo veinte años, y lo mismo con j\'ai faim, tengo hambre. Cuidado con ils sont, que suena con s, e ils ont, que suena con z.'
        }
    },
    {
        id: 'viaje',
        titulo: 'De viaje',
        tituloFr: 'En voyage',
        descripcion: 'Moverte por la ciudad y sobrevivir el primer día.',
        color: '#E8701A',
        palabras: [
            { fr: 'la gare', es: 'la estación de tren', pista: 'la gar' },
            { fr: "l'aéroport", es: 'el aeropuerto', pista: 'la-e-ro-por' },
            { fr: "l'hôtel", es: 'el hotel', pista: 'lo-tél' },
            { fr: 'la rue', es: 'la calle', pista: 'la rü' },
            { fr: 'le billet', es: 'el boleto', pista: 'lö bi-yé' },
            { fr: 'à gauche', es: 'a la izquierda', pista: 'a gosh' },
            { fr: 'à droite', es: 'a la derecha', pista: 'a druat' },
            { fr: 'tout droit', es: 'todo recto', pista: 'tu druá' },
            { fr: 'où sont les toilettes ?', es: '¿dónde está el baño?', pista: 'u son le tua-lét' },
            { fr: 'combien ça coûte ?', es: '¿cuánto cuesta?', pista: 'kom-bián sa kut' },
            { fr: 'je ne comprends pas', es: 'no entiendo', pista: 'yö nö kom-prán pa' },
            { fr: 'parlez-vous espagnol ?', es: '¿habla español?', pista: 'par-lé vu es-pa-ñól' }
        ],
        tip: {
            titulo: 'La h no suena y casi nunca la s final',
            texto: 'Hôtel se dice otél, igual que en español la h es muda. Muchas letras del final tampoco suenan, por eso toilettes suena tualét y comprends suena komprán.'
        }
    },
    {
        id: 'falsos-amigos',
        titulo: 'Falsos amigos',
        tituloFr: 'Les faux amis',
        descripcion: 'Palabras que parecen español pero significan otra cosa.',
        color: '#D12C5A',
        palabras: [
            { fr: 'attendre', es: 'esperar, no atender', pista: 'a-tándr' },
            { fr: 'rester', es: 'quedarse, no restar', pista: 'res-té' },
            { fr: 'sale', es: 'sucio, no sale', pista: 'sal' },
            { fr: 'large', es: 'ancho, no largo', pista: 'larsh' },
            { fr: 'la robe', es: 'el vestido, no robo', pista: 'la rob' },
            { fr: 'embrasser', es: 'besar, no abrazar', pista: 'am-bra-sé' },
            { fr: 'enceinte', es: 'embarazada', pista: 'an-sánt' },
            { fr: 'constipé', es: 'resfriado, no estreñido', pista: 'kons-ti-pé' },
            { fr: 'le crayon', es: 'el lápiz, no crayón', pista: 'lö kre-yón' },
            { fr: 'la cave', es: 'el sótano, no cueva', pista: 'la kav' }
        ],
        tip: {
            titulo: 'Embarazada y embarrassé',
            texto: 'El clásico, si dices je suis embarrassée no estás embarazada, estás apenada. Embarazada se dice enceinte. Ante la duda, mejor pregunta antes de usarla.'
        }
    }
];
