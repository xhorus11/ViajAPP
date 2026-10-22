/* Recetario base.
   Ingredientes: "alias[/Variante][:cantidad unidad]" separados por ";".
   - La cantidad es POR PERSONA (g, ml, un, lata, pq, fr, bot, bolsa).
   - Sin cantidad = se compra una vez (sal, aceite, especias...).
   - Los alias apuntan a productos del catálogo del súper (js/data.js). */
(function () {
  const A = {
    tomate: 'verduras|Tomate', lechuga: 'verduras|Lechuga', cebolla: 'verduras|Cebolla', papa: 'verduras|Papa',
    zanahoria: 'verduras|Zanahoria', ajo: 'verduras|Ajo', pimenton: 'verduras|Pimentón', choclo: 'verduras|Choclo',
    pepino: 'verduras|Pepino', zapallito: 'verduras|Zapallo italiano', zapallo: 'verduras|Zapallo', brocoli: 'verduras|Brócoli',
    champi: 'verduras|Champiñón', espinaca: 'verduras|Espinaca', repollo: 'verduras|Repollo', hierbas: 'verduras|Cilantro / Perejil',
    aji: 'verduras|Ají', porverdes: 'verduras|Porotos verdes', apio: 'verduras|Apio', jengibre: 'verduras|Jengibre',
    berenjena: 'verduras|Berenjena', betarraga: 'verduras|Betarraga',
    limon: 'frutas|Limón', palta: 'frutas|Palta', platano: 'frutas|Plátano', frutilla: 'frutas|Frutilla', manzana: 'frutas|Manzana',
    naranja: 'frutas|Naranja', uva: 'frutas|Uva', durazno: 'frutas|Durazno', kiwi: 'frutas|Kiwi', arandano: 'frutas|Arándanos', mango: 'frutas|Mango',
    vacuno: 'carnes|Vacuno', molida: 'carnes|Carne molida', pollo: 'carnes|Pollo', cerdo: 'carnes|Cerdo', embutido: 'carnes|Embutidos',
    fiambre: 'carnes|Fiambres', burger: 'carnes|Hamburguesas', tocino: 'carnes|Tocino',
    salmon: 'pescados|Salmón', reineta: 'pescados|Reineta', merluza: 'pescados|Merluza', atun: 'pescados|Atún', camaron: 'pescados|Camarones',
    choritos: 'pescados|Choritos', almejas: 'pescados|Machas / Almejas', mariscos: 'pescados|Mix de mariscos',
    leche: 'lacteos|Leche', huevo: 'lacteos|Huevos', queso: 'lacteos|Queso', mantequilla: 'lacteos|Mantequilla', yogurt: 'lacteos|Yogurt',
    crema: 'lacteos|Crema', condensada: 'lacteos|Leche condensada',
    pan: 'panaderia|Pan', pancompleto: 'panaderia|Pan de completo', panburger: 'panaderia|Pan de hamburguesa', tortilla: 'panaderia|Tortillas',
    panpita: 'panaderia|Pan pita', queque: 'panaderia|Queque / Kuchen', masapizza: 'panaderia|Masa para pizza',
    arroz: 'despensa|Arroz', fideos: 'despensa|Fideos', legumbre: 'despensa|Legumbres', harina: 'despensa|Harina', azucar: 'despensa|Azúcar',
    sal: 'despensa|Sal', salsatom: 'despensa|Salsa de tomate', salsapasta: 'despensa|Salsas para pasta', conserva: 'despensa|Conservas',
    sopa: 'despensa|Sopas', avena: 'despensa|Avena', panrallado: 'despensa|Pan rallado', quinoa: 'despensa|Quinoa / Cuscús',
    reposteria: 'despensa|Repostería', postrepolvo: 'despensa|Postres en polvo',
    aceite: 'aceites|Aceite', vinagre: 'aceites|Vinagre', mayo: 'aceites|Mayonesa', ketchup: 'aceites|Ketchup', mostaza: 'aceites|Mostaza',
    picante: 'aceites|Ají / Salsa picante', especia: 'aceites|Especias', soya: 'aceites|Salsa de soya', bbq: 'aceites|Salsa BBQ', chimichurri: 'aceites|Chimichurri',
    cafe: 'desayuno|Café', te: 'desayuno|Té', cereal: 'desayuno|Cereal', mermelada: 'desayuno|Mermelada', manjar: 'desayuno|Manjar', miel: 'desayuno|Miel',
    agua: 'bebestibles|Agua', bebida: 'bebestibles|Bebida', jugo: 'bebestibles|Jugo',
    cerveza: 'alcohol|Cerveza', vino: 'alcohol|Vino', pisco: 'alcohol|Pisco', espumante: 'alcohol|Espumante', ron: 'alcohol|Ron',
    vodka: 'alcohol|Vodka', whisky: 'alcohol|Whisky', gin: 'alcohol|Gin', tequila: 'alcohol|Tequila', hielo: 'alcohol|Hielo',
    papasfritas: 'snacks|Papas fritas', galletas: 'snacks|Galletas', chocolate: 'snacks|Chocolates', frutosecos: 'snacks|Frutos secos', nachos: 'snacks|Nachos y salsas',
    helado: 'congelados|Helado', prefritas: 'congelados|Papas pre-fritas', vercong: 'congelados|Verduras congeladas', empanada: 'congelados|Empanadas',
    carbon: 'asado|Carbón', encendedor: 'asado|Encendedor',
    congrio: 'pescados|Congrio', mote: 'despensa|Mote', huesillos: 'despensa|Huesillos', nori: 'despensa|Algas nori',
    asiaticas: 'aceites|Salsas asiáticas', masas: 'panaderia|Masas'
  };

  window.RECIPE_CATS = [
    { id: 'pastas', name: 'Pastas', emoji: '🍝', color: '#ff8a00' },
    { id: 'carnes', name: 'Carnes y asados', emoji: '🥩', color: '#ff5a36' },
    { id: 'pollo', name: 'Pollo', emoji: '🍗', color: '#ffc928' },
    { id: 'mar', name: 'Pescados y mariscos', emoji: '🐟', color: '#22c5ee' },
    { id: 'arroz', name: 'Arroces y legumbres', emoji: '🍚', color: '#b06cff' },
    { id: 'chilena', name: 'Cocina chilena', emoji: '🥟', color: '#ff3d6e' },
    { id: 'sopas', name: 'Sopas y cremas', emoji: '🍲', color: '#f59e0b' },
    { id: 'sandwich', name: 'Sándwiches', emoji: '🥪', color: '#ff9f43' },
    { id: 'masas', name: 'Pizzas y masas', emoji: '🍕', color: '#ef4444' },
    { id: 'mundo', name: 'Latinoamérica', emoji: '🌮', color: '#22d977' },
    { id: 'asia', name: 'Asia', emoji: '🍣', color: '#f472b6' },
    { id: 'europa', name: 'Europa y Mediterráneo', emoji: '🫒', color: '#4ade80' },
    { id: 'ensaladas', name: 'Ensaladas', emoji: '🥗', color: '#3ef08a' },
    { id: 'desayuno', name: 'Desayunos', emoji: '🍳', color: '#ffd23f' },
    { id: 'once', name: 'Once', emoji: '🫖', color: '#e8a33d' },
    { id: 'postres', name: 'Postres', emoji: '🍰', color: '#ff4fa3' },
    { id: 'tragos', name: 'Tragos', emoji: '🍹', color: '#8b5cf6' },
    { id: 'picoteo', name: 'Picoteo', emoji: '🧀', color: '#38bdf8' }
  ];

  /* Tipo de comida sugerido al agendar */
  window.RECIPE_MEAL = { desayuno: 'desayuno', once: 'once', tragos: 'snack', picoteo: 'snack', postres: 'snack' };

  const R = [
    /* ---------- PASTAS ---------- */
    ['pastas', 'Pastas', '🍝', 'pastas', 'fideos/Spaghetti:110g; sal/Fina; aceite/Oliva extra virgen', {
      'Boloñesa': 'molida/7% grasa:100g; salsatom/Tomate triturado:0.3un; cebolla/Blanca:0.25un; zanahoria:0.25un; ajo/Cabeza; especia/Orégano; queso/Rallado:20g',
      'Pesto': 'salsapasta/Pesto:0.25un; queso/Parmesano:20g; frutosecos/Nueces:10g',
      'Crema y champiñones': 'crema/De leche:60ml; champi/Laminado:70g; cebolla/Blanca:0.2un; ajo/Cabeza; queso/Rallado:15g',
      'Alfredo con pollo': 'pollo/Pechuga:120g; crema/De leche:70ml; mantequilla/Con sal:10g; queso/Parmesano:20g; ajo/Cabeza',
      'Carbonara': 'tocino/Cubitos:50g; huevo:1un; queso/Parmesano:25g; especia/Pimienta',
      'Pomodoro': 'tomate/Perita:1un; salsatom/Tomate triturado:0.25un; hierbas/Albahaca; ajo/Cabeza; queso/Parmesano:15g',
      'Mariscos': 'mariscos:120g; crema/De leche:50ml; vino/Blanco:40ml; ajo/Cabeza; hierbas/Perejil',
      'Cuatro quesos': 'crema/De leche:60ml; queso/Gauda laminado:30g; queso/Parmesano:15g; queso/Mozzarella:30g; queso/Crema:20g',
      'Arrabbiata': 'salsatom/Tomate triturado:0.3un; aji/Cacho de cabra; ajo/Cabeza; hierbas/Perejil',
      'Atún y tomate': 'atun/Lomitos en agua:0.5un; salsatom/Pomarola:0.25un; cebolla/Blanca:0.2un; especia/Orégano',
      'Ajo y aceite': 'ajo/Cabeza; aji/Cacho de cabra; hierbas/Perejil; queso/Parmesano:10g'
    }],
    ['lasana', 'Lasaña', '🫕', 'pastas', 'fideos/Lasaña:70g; queso/Mozzarella:60g; queso/Rallado:20g; leche/Entera:100ml; mantequilla/Con sal:10g; harina/Sin polvos:10g', {
      'Boloñesa': 'molida/7% grasa:120g; salsatom/Tomate triturado:0.3un; cebolla/Blanca:0.25un; zanahoria:0.25un; ajo/Cabeza',
      'Pollo y espinaca': 'pollo/Pechuga:120g; espinaca/Bolsa:0.25un; cebolla/Blanca:0.2un; crema/De leche:40ml',
      'De verduras': 'zapallito:0.5un; berenjena:0.3un; champi/Laminado:60g; pimenton/Rojo:0.3un; salsatom/Pomarola:0.25un'
    }],
    ['noquis', 'Ñoquis caseros', '🥔', 'pastas', 'papa/Blanca:250g; harina/Sin polvos:60g; huevo:0.25un; sal/Fina; queso/Rallado:15g', {
      'Boloñesa': 'molida/7% grasa:90g; salsatom/Tomate triturado:0.25un; cebolla/Blanca:0.2un',
      'Pomodoro': 'salsatom/Tomate triturado:0.3un; hierbas/Albahaca; ajo/Cabeza',
      'Cuatro quesos': 'crema/De leche:60ml; queso/Gauda laminado:30g; queso/Parmesano:15g'
    }],
    ['macqueso', 'Mac & cheese', '🧀', 'pastas', 'fideos/Corbatitas:100g; queso/Cheddar:60g; leche/Entera:100ml; mantequilla/Con sal:10g; harina/Sin polvos:8g', {
      'Clásico': '', 'Con tocino': 'tocino/Cubitos:40g', 'Con brócoli': 'brocoli/Fresco:0.25un'
    }],
    ['pastafria', 'Ensalada de pasta', '🥗', 'pastas', 'fideos/Espirales:80g; tomate/Cherry:0.15un; queso/Mozzarella:40g; aceite/Oliva extra virgen; hierbas/Albahaca', {
      'Con atún': 'atun/Lomitos en aceite:0.3un', 'Con pollo': 'pollo/Pechuga:90g', 'Con jamón y choclo': 'fiambre/Jamón de pierna:40g; choclo/Conserva:0.15un'
    }],

    /* ---------- CARNES Y ASADOS ---------- */
    ['asado', 'Asado', '🔥', 'carnes', 'carbon; encendedor/Pastillas; sal/Parrillera; pan/Marraqueta:1un; tomate/Larga vida:0.5un; cebolla/Morada:0.25un; picante/Pebre; bebida/Coca-Cola:300ml', {
      'Vacuno clásico': 'vacuno/Asado de tira:250g; vacuno/Entraña:100g; embutido/Chorizo:1un',
      'Premium': 'vacuno/Lomo vetado:300g; vacuno/Entraña:100g; embutido/Chorizo:1un; vino/Tinto:250ml',
      'Cerdo': 'cerdo/Costillar:250g; cerdo/Malaya:100g; embutido/Longaniza:1un',
      'Mixto': 'vacuno/Asado de tira:150g; cerdo/Chuleta:120g; pollo/Trutro corto:1un; embutido/Chorizo:1un',
      'De pollo': 'pollo/Trutro entero:1un; pollo/Alitas:120g; embutido/Longaniza:1un',
      'Económico': 'embutido/Longaniza:1.5un; pollo/Trutro corto:1un; cerdo/Pulpa:120g'
    }],
    ['choripan', 'Choripanes', '🌭', 'carnes', 'embutido/Chorizo:1.5un; pan/Marraqueta:1.5un; carbon', {
      'Con pebre': 'tomate/Larga vida:0.5un; cebolla/Blanca:0.2un; hierbas/Cilantro; aji/Verde',
      'Con chimichurri': 'chimichurri', 'Con palta': 'palta/Hass:0.4un'
    }],
    ['hamburguesas', 'Hamburguesas', '🍔', 'carnes', 'panburger/Normal:1un; tomate/Larga vida:0.5un; lechuga/Costina:0.15un; mayo/Normal; ketchup; mostaza/Normal', {
      'Clásica': 'burger/Vacuno:1un; queso/Gauda laminado:30g',
      'Cheddar y tocino': 'burger/Vacuno:1un; queso/Cheddar:30g; tocino/Laminado:30g; cebolla/Morada:0.2un',
      'Italiana': 'burger/Vacuno:1un; palta/Hass:0.4un',
      'Caseras de carne': 'molida/10% grasa:160g; huevo:0.25un; panrallado:10g; queso/Cheddar:30g',
      'Pollo crispy': 'pollo/Pechuga:150g; panrallado:30g; huevo:0.5un',
      'Vegetal': 'burger/Vegetal:1un; palta/Hass:0.3un'
    }],
    ['pobre', 'Bistec a lo pobre', '🍳', 'carnes', 'vacuno/Posta:200g; huevo:2un; cebolla/Blanca:0.5un; prefritas/Corte casero:200g; aceite/Maravilla', {}],
    ['mechada', 'Carne mechada', '🥩', 'carnes', 'vacuno/Posta:200g; cebolla/Blanca:0.3un; zanahoria:0.3un; pimenton/Rojo:0.2un; ajo/Cabeza; vino/Tinto:50ml; especia/Laurel', {
      'Con arroz': 'arroz/Grado 1:80g', 'Con puré': 'papa/Blanca:250g; leche/Entera:50ml; mantequilla/Con sal:10g',
      'En sándwich': 'pan/Marraqueta:1un; palta/Hass:0.3un'
    }],
    ['costillar', 'Costillar al horno', '🍖', 'carnes', 'cerdo/Costillar:350g; ajo/Cabeza; sal/Fina', {
      'BBQ': 'bbq', 'Al merkén': 'picante/Merkén; limon/Común:0.5un', 'Con papas al horno': 'papa/Blanca:250g; especia/Romero'
    }],
    ['albondigas', 'Albóndigas', '🧆', 'carnes', 'molida/Mixta:150g; huevo:0.25un; panrallado:15g; cebolla/Blanca:0.2un; ajo/Cabeza', {
      'En salsa de tomate': 'salsatom/Tomate triturado:0.3un', 'Con arroz': 'arroz/Grado 1:80g; salsatom/Pomarola:0.2un',
      'Con puré': 'papa/Blanca:250g; leche/Entera:50ml'
    }],
    ['anticuchos', 'Brochetas / Anticuchos', '🍢', 'carnes', 'pimenton/Rojo:0.3un; cebolla/Blanca:0.3un; carbon; sal/Parrillera', {
      'De vacuno': 'vacuno/Posta:180g', 'De pollo': 'pollo/Pechuga:180g',
      'Mixtas': 'vacuno/Posta:100g; pollo/Pechuga:80g; embutido/Longaniza:0.5un'
    }],

    /* ---------- POLLO ---------- */
    ['pollohorno', 'Pollo al horno', '🍗', 'pollo', 'pollo/Trutro entero:1un; ajo/Cabeza; especia/Aliño completo; aceite/Maravilla', {
      'Con papas': 'papa/Blanca:250g; especia/Romero', 'Al limón': 'limon/Común:0.5un; especia/Romero',
      'Con verduras': 'zapallito:0.3un; pimenton/Rojo:0.3un; cebolla/Morada:0.3un; zanahoria:0.3un', 'BBQ': 'bbq'
    }],
    ['arvejado', 'Pollo arvejado', '🫛', 'pollo', 'pollo/Trutro corto:1.5un; vercong/Arvejas:70g; zanahoria:0.5un; cebolla/Blanca:0.3un; ajo/Cabeza; vino/Blanco:40ml', {
      'Con arroz': 'arroz/Grado 1:80g', 'Con puré': 'papa/Blanca:250g; leche/Entera:50ml'
    }],
    ['curry', 'Pollo al curry', '🍛', 'pollo', 'pollo/Pechuga:170g; cebolla/Blanca:0.3un; ajo/Cabeza; jengibre; especia/Curry; arroz/Basmati:80g', {
      'Con crema': 'crema/De leche:50ml', 'Con leche de coco': 'conserva/Leche de coco:0.25un',
      'Con verduras': 'pimenton/Rojo:0.3un; zapallito:0.3un'
    }],
    ['pechuga', 'Pechuga a la plancha', '🍽️', 'pollo', 'pollo/Pechuga:180g; limon/Común:0.25un; especia/Aliño completo', {
      'Con ensalada': 'lechuga/Hidropónica:0.2un; tomate/Larga vida:0.5un; pepino/Ensalada:0.25un',
      'Con arroz': 'arroz/Grado 1:80g', 'Con puré': 'papa/Blanca:250g; leche/Entera:50ml; mantequilla/Con sal:10g',
      'Con quinoa': 'quinoa/Quinoa:60g; pimenton/Rojo:0.2un'
    }],
    ['polloapanado', 'Pollo apanado', '🍗', 'pollo', 'pollo/Filetitos:170g; huevo:0.5un; panrallado:40g; harina/Sin polvos:20g; aceite/Maravilla', {
      'Con papas fritas': 'prefritas/Corte recto:180g; ketchup', 'Con ensalada': 'lechuga/Costina:0.2un; tomate/Larga vida:0.5un',
      'Con arroz': 'arroz/Grado 1:80g'
    }],

    /* ---------- PESCADOS Y MARISCOS ---------- */
    ['salmon', 'Salmón al horno', '🐟', 'mar', 'salmon/Filete:180g; limon/Común:0.3un; mantequilla/Con sal:10g; ajo/Cabeza', {
      'Con papas': 'papa/Blanca:250g', 'Con arroz': 'arroz/Grado 1:80g',
      'Con verduras salteadas': 'brocoli/Fresco:0.25un; zanahoria:0.3un; zapallito:0.3un',
      'Con salsa de crema': 'crema/De leche:50ml; hierbas/Perejil'
    }],
    ['pescadofrito', 'Pescado frito', '🐠', 'mar', 'merluza/Filete:180g; harina/Sin polvos:30g; huevo:0.5un; aceite/Maravilla; limon/Común:0.3un', {
      'Con puré': 'papa/Blanca:250g; leche/Entera:50ml', 'Con ensalada chilena': 'tomate/Larga vida:1un; cebolla/Morada:0.3un',
      'Con papas fritas': 'prefritas/Corte recto:180g'
    }],
    ['ceviche', 'Ceviche', '🍋', 'mar', 'limon/De pica:3un; cebolla/Morada:0.4un; hierbas/Cilantro; aji/Verde; sal/Fina', {
      'De reineta': 'reineta:150g', 'De salmón': 'salmon/Filete:150g', 'De camarón': 'camaron/Crudos:150g',
      'Mixto': 'reineta:80g; camaron/Crudos:60g; mariscos:50g'
    }],
    ['paila', 'Paila marina', '🦪', 'mar', 'cebolla/Blanca:0.3un; ajo/Cabeza; vino/Blanco:60ml; hierbas/Cilantro; sopa/Caldos en cubo; pan/Marraqueta:1un', {
      'Clásica': 'choritos/En concha:200g; almejas/Almejas:150g; merluza/Filete:80g',
      'Solo choritos': 'choritos/En concha:350g',
      'Chupe de mariscos': 'mariscos:150g; leche/Entera:100ml; queso/Rallado:30g; crema/De leche:30ml'
    }],
    ['pilpil', 'Camarones al pil pil', '🦐', 'mar', 'camaron/Crudos:150g; ajo/Cabeza; aji/Cacho de cabra; aceite/Oliva extra virgen; pan/Baguette:0.5un', {
      'Clásicos': '', 'Con vino blanco': 'vino/Blanco:40ml'
    }],

    /* ---------- ARROCES Y LEGUMBRES ---------- */
    ['arroz', 'Arroz (acompañamiento)', '🍚', 'arroz', 'arroz/Grado 1:80g; aceite/Maravilla; sal/Fina', {
      'Blanco': '', 'Graneado con ajo': 'ajo/Cabeza', 'Primavera': 'vercong/Mix:60g',
      'Con choclo y pimentón': 'choclo/Congelado:40g; pimenton/Rojo:0.2un', 'Rojo con tomate': 'salsatom/Pasta de tomate:0.1un'
    }],
    ['porotos', 'Porotos', '🫘', 'arroz', 'legumbre/Porotos:90g; zapallo/Trozo:100g; cebolla/Blanca:0.3un; ajo/Cabeza; especia/Ají de color', {
      'Con riendas': 'fideos/Tallarines:40g', 'Con longaniza': 'embutido/Longaniza:0.7un',
      'Granados con choclo': 'choclo/Fresco:0.5un; hierbas/Albahaca'
    }],
    ['lentejas', 'Lentejas', '🥣', 'arroz', 'legumbre/Lentejas:90g; cebolla/Blanca:0.3un; zanahoria:0.3un; ajo/Cabeza; pimenton/Rojo:0.2un; especia/Comino', {
      'Con arroz': 'arroz/Grado 1:50g', 'Con longaniza': 'embutido/Longaniza:0.7un',
      'Guisadas con zapallo': 'zapallo/Trozo:100g', 'Con huevo frito': 'huevo:1un'
    }],
    ['garbanzos', 'Garbanzos', '🫘', 'arroz', 'legumbre/Garbanzos:90g; cebolla/Blanca:0.3un; ajo/Cabeza; pimenton/Rojo:0.2un; especia/Paprika', {
      'Guisados': 'zanahoria:0.3un; zapallo/Trozo:80g', 'Con chorizo': 'embutido/Chorizo:0.7un', 'Con espinaca': 'espinaca/Bolsa:0.2un'
    }],
    ['risotto', 'Risotto', '🍚', 'arroz', 'arroz/Grado 1:90g; cebolla/Blanca:0.25un; vino/Blanco:40ml; mantequilla/Con sal:15g; queso/Parmesano:25g; sopa/Caldos en cubo', {
      'De champiñones': 'champi/Portobello:100g', 'De pollo': 'pollo/Pechuga:120g', 'De mariscos': 'mariscos:120g', 'De zapallo': 'zapallo/Camote:120g'
    }],
    ['paella', 'Paella', '🥘', 'arroz', 'arroz/Grado 1:90g; pimenton/Rojo:0.3un; cebolla/Blanca:0.25un; ajo/Cabeza; vercong/Arvejas:30g; especia/Paprika; sopa/Caldos en cubo; limon/Común:0.25un', {
      'De mariscos': 'mariscos:120g; camaron/Crudos:60g; choritos/En concha:100g',
      'Mixta': 'pollo/Trutro corto:1un; mariscos:80g; embutido/Chorizo:0.3un',
      'Pollo y verduras': 'pollo/Pechuga:130g; porverdes:40g'
    }],

    /* ---------- COCINA CHILENA ---------- */
    ['pastelchoclo', 'Pastel de choclo', '🌽', 'chilena', 'choclo/Fresco:2un; hierbas/Albahaca; leche/Entera:60ml; molida/7% grasa:100g; cebolla/Blanca:0.5un; pollo/Trutro corto:0.5un; huevo:0.5un; conserva/Aceitunas:0.05un; frutosecos/Pasas:10g; azucar/Blanca; especia/Comino', {}],
    ['cazuela', 'Cazuela', '🍲', 'chilena', 'papa/Blanca:1un; zapallo/Trozo:100g; choclo/Fresco:0.5un; porverdes:30g; zanahoria:0.3un; arroz/Grado 2:20g; cebolla/Blanca:0.2un; hierbas/Cilantro', {
      'De vacuno': 'vacuno/Plateada:200g', 'De ave': 'pollo/Trutro corto:1.5un', 'De cerdo': 'cerdo/Chuleta:200g'
    }],
    ['charquican', 'Charquicán', '🥘', 'chilena', 'papa/Blanca:250g; zapallo/Trozo:150g; molida/7% grasa:100g; cebolla/Blanca:0.3un; choclo/Congelado:40g; vercong/Arvejas:30g; especia/Comino; especia/Ají de color', {
      'Con huevo frito': 'huevo:1un', 'Con ensalada chilena': 'tomate/Larga vida:1un; cebolla/Morada:0.25un'
    }],
    ['empanadas', 'Empanadas', '🥟', 'chilena', '', {
      'De pino caseras': 'empanada/Masa para empanadas:2un; molida/7% grasa:80g; cebolla/Blanca:0.6un; huevo:0.5un; conserva/Aceitunas:0.05un; frutosecos/Pasas:10g; especia/Comino',
      'De queso fritas': 'empanada/Masa para empanadas:2un; queso/Mantecoso:60g; aceite/Maravilla',
      'Napolitanas': 'empanada/Masa para empanadas:2un; queso/Mantecoso:40g; fiambre/Jamón de pierna:30g; tomate/Larga vida:0.4un; especia/Orégano',
      'De camarón queso': 'empanada/Masa para empanadas:2un; camaron/Cocidos:50g; queso/Mantecoso:40g',
      'De mariscos': 'empanada/Masa para empanadas:2un; mariscos:70g; queso/Mantecoso:30g; cebolla/Blanca:0.2un; aceite/Maravilla',
      'Compradas listas': 'empanada/Pino:2un'
    }],
    ['sopaipillas', 'Sopaipillas', '🟠', 'chilena', 'zapallo/Camote:60g; harina/Con polvos:80g; mantequilla/Con sal:15g; aceite/Maravilla; sal/Fina', {
      'Con pebre': 'tomate/Larga vida:0.5un; cebolla/Blanca:0.2un; hierbas/Cilantro; aji/Verde',
      'Pasadas': 'azucar/Chancaca:0.15un; naranja/Para jugo:0.25un; especia/Canela', 'Con mostaza': 'mostaza/Normal'
    }],
    ['humitas', 'Humitas', '🌽', 'chilena', 'choclo/Fresco:2.5un; cebolla/Blanca:0.25un; hierbas/Albahaca; leche/Entera:40ml; mantequilla/Con sal:10g; sal/Fina', {
      'Con ensalada chilena': 'tomate/Larga vida:1un; cebolla/Morada:0.25un', 'Con azúcar': 'azucar/Blanca'
    }],
    ['pure', 'Puré (acompañamiento)', '🥔', 'chilena', 'papa/Blanca:250g; leche/Entera:60ml; mantequilla/Con sal:10g; sal/Fina', {
      'Clásico': '', 'Rústico con ajo': 'ajo/Cabeza', 'Con zapallo': 'zapallo/Camote:100g'
    }],

    /* ---------- SOPAS Y CREMAS ---------- */
    ['crema', 'Crema de verduras', '🥣', 'sopas', 'cebolla/Blanca:0.25un; papa/Blanca:0.5un; sopa/Caldos en cubo; crema/De leche:30ml; mantequilla/Con sal:5g', {
      'De zapallo': 'zapallo/Camote:200g', 'De champiñones': 'champi/Entero:150g', 'De brócoli': 'brocoli/Fresco:0.4un',
      'De espinaca': 'espinaca/Bolsa:0.3un', 'Zanahoria y jengibre': 'zanahoria:2un; jengibre'
    }],
    ['sopa', 'Sopas caseras', '🍜', 'sopas', 'zanahoria:0.3un; apio; cebolla/Blanca:0.2un; hierbas/Perejil; sal/Fina', {
      'De pollo con fideos': 'pollo/Trutro corto:1un; fideos/Cabellos de ángel:30g',
      'De verduras': 'zapallito:0.3un; papa/Blanca:0.5un; porverdes:30g',
      'Caldillo de pescado': 'merluza/Filete:150g; papa/Blanca:0.5un; vino/Blanco:30ml'
    }],
    ['ramen', 'Ramen rápido', '🍜', 'sopas', 'sopa/Ramen:1un; huevo:1un; cebolla/Cebollín', {
      'Con pollo': 'pollo/Pechuga:80g', 'Con cerdo': 'cerdo/Panceta:80g',
      'Con verduras': 'champi/Laminado:40g; zanahoria:0.3un', 'Picante': 'picante/Ají en pasta'
    }],

    /* ---------- SÁNDWICHES ---------- */
    ['completos', 'Completos', '🌭', 'sandwich', 'pancompleto/Normal:1.5un; embutido/Vienesas:1.5un', {
      'Italiano': 'tomate/Larga vida:0.5un; palta/Hass:0.4un; mayo/Normal',
      'Dinámico': 'tomate/Larga vida:0.4un; palta/Hass:0.3un; mayo/Normal; ketchup; mostaza/Normal; conserva/Chucrut:0.1un; picante/Pebre',
      'Alemán': 'conserva/Chucrut:0.15un; mayo/Normal',
      'Chacarero': 'porverdes:40g; tomate/Larga vida:0.4un; aji/Verde; mayo/Normal'
    }],
    ['churrasco', 'Churrasco', '🥩', 'sandwich', 'vacuno/Lomo liso:120g; pan/Frica:1un', {
      'Italiano': 'tomate/Larga vida:0.5un; palta/Hass:0.4un; mayo/Normal', 'Barros Luco': 'queso/Mantecoso:40g',
      'Chacarero': 'porverdes:40g; tomate/Larga vida:0.4un; aji/Verde',
      'A lo pobre': 'huevo:1un; cebolla/Blanca:0.3un; prefritas/Corte recto:80g'
    }],
    ['ave', 'Sándwich de ave', '🥪', 'sandwich', 'pollo/Pechuga:100g; pan/Marraqueta:1un; mayo/Normal', {
      'Ave palta': 'palta/Hass:0.4un', 'Ave mayo': '', 'Ave italiano': 'palta/Hass:0.3un; tomate/Larga vida:0.4un',
      'Ave pimentón': 'pimenton/Rojo:0.3un'
    }],
    ['caliente', 'Sándwich caliente', '🧀', 'sandwich', 'pan/Hallulla:1un; mantequilla/Con sal:5g', {
      'Barros Jarpa': 'fiambre/Jamón de pierna:40g; queso/Mantecoso:40g', 'Aliado': 'fiambre/Jamón de pierna:30g; queso/Gauda laminado:30g',
      'Queso derretido': 'queso/Mantecoso:60g', 'Palta y huevo': 'palta/Hass:0.4un; huevo:1un'
    }],

    /* ---------- PIZZAS Y MASAS ---------- */
    ['pizza', 'Pizza casera', '🍕', 'masas', 'masapizza:0.5un; salsatom/Salsa italiana:0.15un; queso/Mozzarella:80g; especia/Orégano', {
      'Margarita': 'tomate/Perita:0.5un; hierbas/Albahaca', 'Pepperoni': 'fiambre/Salame:40g',
      'Napolitana': 'tomate/Perita:0.5un; fiambre/Jamón de pierna:30g; conserva/Aceitunas:0.05un',
      'Hawaiana': 'fiambre/Jamón de pierna:40g; conserva/Piña:0.15un',
      'Vegetariana': 'champi/Laminado:40g; pimenton/Verde:0.2un; cebolla/Morada:0.15un; conserva/Aceitunas:0.05un',
      'Pollo BBQ': 'pollo/Pechuga:70g; bbq; cebolla/Morada:0.15un'
    }],
    ['quesadillas', 'Quesadillas', '🫓', 'masas', 'tortilla/Trigo:2un; queso/Gauda laminado:50g', {
      'De queso': '', 'De pollo': 'pollo/Pechuga:80g; pimenton/Rojo:0.2un', 'De champiñón': 'champi/Laminado:60g; cebolla/Morada:0.15un',
      'Jamón queso': 'fiambre/Jamón de pierna:40g'
    }],

    /* ---------- DEL MUNDO ---------- */
    ['tacos', 'Tacos', '🌮', 'mundo', 'tortilla/Maíz:3un; cebolla/Morada:0.25un; hierbas/Cilantro; limon/Sutil:0.5un; palta/Hass:0.3un; nachos/Pico de gallo:0.1un', {
      'De carne': 'molida/10% grasa:120g; especia/Comino', 'Al pastor': 'cerdo/Pulpa:130g; conserva/Piña:0.1un; especia/Paprika',
      'De pollo': 'pollo/Pechuga:130g; especia/Paprika',
      'Vegetarianos': 'legumbre/Porotos negros:60g; choclo/Conserva:0.2un; pimenton/Rojo:0.3un'
    }],
    ['burritos', 'Burritos', '🌯', 'mundo', 'tortilla/Trigo:1.5un; arroz/Grado 1:50g; legumbre/Porotos negros:40g; queso/Cheddar:30g; crema/Ácida:30ml; lechuga/Costina:0.1un', {
      'De carne': 'molida/10% grasa:110g', 'De pollo': 'pollo/Pechuga:110g', 'Vegetarianos': 'pimenton/Rojo:0.3un; choclo/Conserva:0.2un'
    }],
    ['fajitas', 'Fajitas', '🫑', 'mundo', 'tortilla/Trigo:2un; pimenton/Rojo:0.3un; pimenton/Verde:0.3un; cebolla/Morada:0.3un; especia/Paprika; crema/Ácida:30ml; palta/Hass:0.3un', {
      'De pollo': 'pollo/Pechuga:150g', 'De vacuno': 'vacuno/Lomo liso:150g', 'Mixtas': 'pollo/Pechuga:80g; vacuno/Lomo liso:80g'
    }],
    ['lomosaltado', 'Lomo saltado', '🥩', 'mundo', 'vacuno/Lomo liso:180g; cebolla/Morada:0.4un; tomate/Larga vida:0.6un; soya; vinagre/De vino; aji/Verde; hierbas/Cilantro; prefritas/Corte recto:150g; arroz/Grado 1:70g', {}],
    ['chaufa', 'Arroz chaufa', '🍳', 'asia', 'arroz/Grado 1:90g; huevo:1un; cebolla/Cebollín; soya; jengibre; aceite/Vegetal', {
      'De pollo': 'pollo/Pechuga:120g', 'De cerdo': 'cerdo/Lomo:120g', 'De camarón': 'camaron/Crudos:110g',
      'Vegetal': 'pimenton/Rojo:0.3un; vercong/Mix:60g'
    }],
    ['wok', 'Salteado al wok', '🥢', 'asia', 'pimenton/Rojo:0.3un; zanahoria:0.3un; brocoli/Fresco:0.2un; cebolla/Blanca:0.25un; soya; jengibre; ajo/Cabeza', {
      'De pollo con arroz': 'pollo/Pechuga:150g; arroz/Jazmín:70g', 'De vacuno con arroz': 'vacuno/Lomo liso:150g; arroz/Jazmín:70g',
      'De camarón con arroz': 'camaron/Crudos:130g; arroz/Jazmín:70g', 'Con tallarines': 'fideos/Tallarines:90g; pollo/Pechuga:100g'
    }],

    /* ---------- ENSALADAS ---------- */
    ['chilena', 'Ensalada chilena', '🍅', 'ensaladas', 'tomate/Larga vida:1un; cebolla/Morada:0.25un; hierbas/Cilantro; aceite/Maravilla; sal/Fina', {
      'Clásica': '', 'Con ají verde': 'aji/Verde'
    }],
    ['cesar', 'Ensalada César', '🥗', 'ensaladas', 'lechuga/Costina:0.3un; queso/Parmesano:20g; pan/Molde blanco:0.05un; mayo/Normal; limon/Común:0.2un; ajo/Cabeza', {
      'Con pollo': 'pollo/Pechuga:120g', 'Clásica': '', 'Con camarones': 'camaron/Cocidos:100g'
    }],
    ['mixta', 'Ensalada mixta', '🥬', 'ensaladas', 'lechuga/Hidropónica:0.2un; tomate/Larga vida:0.5un; zanahoria:0.3un; aceite/Oliva extra virgen; limon/Común:0.2un', {
      'Simple': '', 'Con choclo y palta': 'choclo/Conserva:0.15un; palta/Hass:0.3un',
      'Con atún y huevo': 'atun/Lomitos en agua:0.3un; huevo:1un', 'Surtida': 'repollo/Verde:0.1un; betarraga/Cocida:0.3un'
    }],
    ['papasmayo', 'Papas con mayo', '🥔', 'ensaladas', 'papa/Blanca:200g; mayo/Normal; sal/Fina', {
      'Clásica': 'hierbas/Perejil', 'Rusa': 'zanahoria:0.4un; vercong/Arvejas:30g; huevo:0.5un',
      'Alemana con tocino': 'tocino/Cubitos:30g; cebolla/Cebollín; mostaza/Dijon'
    }],
    ['griega', 'Ensalada griega', '🫒', 'ensaladas', 'pepino/Ensalada:0.4un; tomate/Cherry:0.15un; cebolla/Morada:0.2un; queso/Fresco:50g; conserva/Aceitunas:0.08un; aceite/Oliva extra virgen; especia/Orégano', {}],
    ['quinoa', 'Ensalada de quinoa', '🌾', 'ensaladas', 'quinoa/Quinoa:60g; pepino/Ensalada:0.3un; tomate/Cherry:0.15un; palta/Hass:0.3un; limon/Común:0.3un; aceite/Oliva extra virgen; hierbas/Cilantro', {
      'Clásica': '', 'Con garbanzos': 'legumbre/Garbanzos:40g', 'Con pollo': 'pollo/Pechuga:100g'
    }],

    /* ---------- DESAYUNOS ---------- */
    ['huevos', 'Huevos', '🍳', 'desayuno', 'huevo:2un; mantequilla/Con sal:5g; pan/Marraqueta:1un', {
      'Revueltos': '', 'Con tocino': 'tocino/Laminado:40g', 'Omelette jamón queso': 'fiambre/Jamón de pierna:30g; queso/Gauda laminado:30g',
      'Shakshuka (al tomate)': 'tomate/Perita:1un; salsatom/Tomate triturado:0.2un; cebolla/Blanca:0.2un; pimenton/Rojo:0.2un'
    }],
    ['panqueques', 'Panqueques', '🥞', 'desayuno', 'harina/Sin polvos:50g; leche/Entera:120ml; huevo:0.5un; mantequilla/Con sal:5g', {
      'Con manjar': 'manjar/Normal:0.08un', 'Con mermelada': 'mermelada/Frutilla:0.08un',
      'Pancakes con miel y plátano': 'harina/Con polvos:20g; miel; platano/Maduro:0.5un',
      'Con frutillas y crema': 'frutilla/Fresca:80g; crema/Chantilly:30ml'
    }],
    ['avena', 'Avena / Porridge', '🥣', 'desayuno', 'avena/Tradicional:50g; leche/Entera:200ml', {
      'Plátano y miel': 'platano/Maduro:0.5un; miel', 'Frutos rojos': 'arandano/Frescos:40g; frutilla/Fresca:40g',
      'Manzana y canela': 'manzana/Roja:0.5un; especia/Canela'
    }],
    ['tostadas', 'Tostadas', '🍞', 'desayuno', '', {
      'Con palta': 'pan/Marraqueta:1un; palta/Hass:0.5un; sal/Fina', 'Mantequilla y mermelada': 'pan/Marraqueta:1un; mantequilla/Con sal:10g; mermelada/Frutilla:0.05un',
      'Palta y huevo': 'pan/Marraqueta:1un; palta/Hass:0.4un; huevo:1un',
      'Francesas': 'pan/Molde blanco:0.15un; huevo:0.7un; leche/Entera:50ml; especia/Canela; azucar/Flor'
    }],
    ['bowl', 'Yogurt bowl', '🍓', 'desayuno', 'cereal/Granola:40g', {
      'Con frutas': 'yogurt/Natural:1un; platano/Maduro:0.5un; frutilla/Fresca:50g', 'Con miel y nueces': 'yogurt/Natural:1un; miel; frutosecos/Nueces:15g',
      'Griego con berries': 'yogurt/Griego:1un; arandano/Frescos:50g'
    }],
    ['desayuno', 'Desayuno completo', '☕', 'desayuno', 'cafe/Instantáneo; te/Negro; leche/Entera:200ml; azucar/Blanca; pan/Marraqueta:1.5un; mantequilla/Con sal:10g; mermelada/Frutilla:0.05un; jugo/Naranja:200ml', {
      'Clásico': '', 'Con huevos': 'huevo:1.5un', 'Con fruta': 'platano/Maduro:0.5un; manzana/Roja:0.5un'
    }],
    ['batido', 'Batidos / Smoothies', '🥤', 'desayuno', 'leche/Entera:200ml', {
      'De plátano': 'platano/Maduro:1un', 'De frutilla': 'frutilla/Fresca:100g', 'Frutos rojos': 'frutilla/Congelada:60g; arandano/Congelados:40g'
    }],

    /* ---------- ONCE ---------- */
    ['once', 'Once chilena', '🫖', 'once', 'te/Negro; cafe/Instantáneo; leche/Entera:100ml; azucar/Blanca; pan/Hallulla:1.5un; mantequilla/Con sal:10g', {
      'Clásica': 'palta/Hass:0.3un; fiambre/Jamón de pierna:30g; queso/Gauda laminado:30g',
      'Dulce': 'manjar/Normal:0.05un; mermelada/Frutilla:0.05un; queque/Queque:0.1un',
      'Con huevos': 'huevo:1.5un; tomate/Larga vida:0.4un',
      'Completa': 'palta/Hass:0.3un; fiambre/Jamón de pierna:30g; queso/Gauda laminado:30g; queque/Kuchen:0.1un'
    }],

    /* ---------- POSTRES ---------- */
    ['tortagalletas', 'Torta de galletas', '🍰', 'postres', 'galletas/Dulces:0.4un; leche/Entera:150ml; crema/Chantilly:50ml', {
      'De chocolate': 'postrepolvo/Mousse:0.15un; reposteria/Cacao amargo', 'De manjar': 'manjar/Normal:0.12un',
      'Pie de limón rápido': 'condensada:0.25un; limon/Sutil:2un'
    }],
    ['frutas', 'Ensalada de frutas', '🍉', 'postres', 'platano/Maduro:0.5un; manzana/Roja:0.5un; naranja/De mesa:0.5un; frutilla/Fresca:60g; kiwi:0.5un', {
      'Clásica': 'jugo/Naranja:50ml', 'Con crema': 'crema/Chantilly:40ml', 'Con yogurt y granola': 'yogurt/Natural:1un; cereal/Granola:30g',
      'Con helado': 'helado/Pote 1L:0.15un'
    }],
    ['frutillas', 'Frutillas', '🍓', 'postres', 'frutilla/Fresca:150g; azucar/Flor', {
      'Con crema': 'crema/Chantilly:50ml', 'Con leche condensada': 'condensada:0.15un', 'Con chocolate': 'chocolate/Barra:0.15un'
    }],
    ['quequecasero', 'Queque casero', '🧁', 'postres', 'harina/Con polvos:60g; azucar/Blanca:40g; huevo:0.6un; mantequilla/Sin sal:25g; leche/Entera:40ml; reposteria/Esencia de vainilla', {
      'De vainilla': '', 'De chocolate': 'reposteria/Cacao amargo', 'De plátano': 'platano/Maduro:0.6un', 'De limón': 'limon/Común:0.3un'
    }],
    ['brownies', 'Brownies', '🍫', 'postres', 'chocolate/Barra:0.3un; mantequilla/Sin sal:30g; azucar/Blanca:40g; huevo:0.6un; harina/Sin polvos:20g', {
      'Clásicos': '', 'Con nueces': 'frutosecos/Nueces:15g', 'Con helado': 'helado/Pote 1L:0.15un'
    }],
    ['postresrapidos', 'Postres rápidos', '🍮', 'postres', '', {
      'Flan': 'postrepolvo/Flan:0.2un; leche/Entera:150ml',
      'Leche asada casera': 'leche/Entera:150ml; huevo:1un; azucar/Blanca:30g; reposteria/Esencia de vainilla',
      'Gelatina con fruta': 'postrepolvo/Gelatina:0.2un; durazno/Conserva:0.15un',
      'Helado con salsa': 'helado/Pote 1L:0.2un; manjar/Normal:0.05un'
    }],
    ['arrozleche', 'Arroz con leche', '🍚', 'postres', 'arroz/Grado 2:30g; leche/Entera:200ml; azucar/Blanca:25g; especia/Canela', {
      'Clásico': '', 'Con leche condensada': 'condensada:0.15un'
    }],

    /* ---------- TRAGOS ---------- */
    ['piscosour', 'Pisco sour', '🍸', 'tragos', 'limon/De pica:4un; azucar/Flor; hielo/Bolsa 2 kg:0.1un; huevo:0.3un', {
      'Clásico': 'pisco/35°:100ml', 'Catedral': 'pisco/40°:160ml', 'De mango': 'pisco/35°:100ml; mango:0.3un'
    }],
    ['piscola', 'Piscola', '🥃', 'tragos', 'pisco/35°:150ml; hielo/Bolsa 2 kg:0.15un', {
      'Con Coca-Cola': 'bebida/Coca-Cola:500ml', 'Con Coca Zero': 'bebida/Coca Zero:500ml',
      'Con ginger ale': 'bebida/Ginger ale:500ml', 'Con Sprite': 'bebida/Sprite:500ml'
    }],
    ['mojito', 'Mojito', '🌿', 'tragos', 'ron/Blanco:100ml; limon/Sutil:1un; hierbas/Menta; azucar/Blanca; agua/Con gas:300ml; hielo/Bolsa 2 kg:0.15un', {
      'Clásico': '', 'De frutilla': 'frutilla/Fresca:60g', 'De mango': 'mango:0.3un'
    }],
    ['terremoto', 'Terremoto', '🌋', 'tragos', 'vino/Pipeño:300ml; helado/Pote 1L:0.15un; jugo/Granadina', {}],
    ['sangria', 'Sangría y ponches', '🍷', 'tragos', 'azucar/Blanca; hielo/Bolsa 2 kg:0.1un', {
      'Sangría tinta': 'vino/Tinto:250ml; naranja/De mesa:0.3un; manzana/Roja:0.3un; bebida/Sprite:150ml',
      'Clery': 'vino/Blanco:250ml; frutilla/Fresca:80g',
      'Ponche de durazno': 'vino/Blanco:200ml; durazno/Conserva:0.2un; espumante/Brut:100ml'
    }],
    ['michelada', 'Michelada', '🍺', 'tragos', 'cerveza/Lager:700ml; limon/Sutil:1un; sal/De mar; hielo/Bolsa 2 kg:0.1un', {
      'Clásica': '', 'Picante': 'picante/Tabasco; soya'
    }],
    ['gintonic', 'Gin tonic', '🍸', 'tragos', 'gin:100ml; bebida/Tónica:400ml; hielo/Bolsa 2 kg:0.15un', {
      'Con pepino': 'pepino/Ensalada:0.2un', 'Frutos rojos': 'arandano/Frescos:30g; frutilla/Fresca:30g', 'Con limón': 'limon/Común:0.3un'
    }],
    ['conbebida', 'Tragos con bebida', '🥤', 'tragos', 'hielo/Bolsa 2 kg:0.15un', {
      'Ron con Coca': 'ron/Añejo:120ml; bebida/Coca-Cola:400ml; limon/Sutil:0.5un', 'Vodka naranja': 'vodka:120ml; jugo/Naranja:400ml',
      'Whisky ginger': 'whisky:120ml; bebida/Ginger ale:400ml', 'Tequila con Sprite': 'tequila:100ml; bebida/Sprite:400ml'
    }],
    ['navegado', 'Navegado', '🍷', 'tragos', 'vino/Tinto:300ml; naranja/De mesa:0.5un; azucar/Blanca; especia/Canela', {}],

    /* ---------- PICOTEO ---------- */
    ['tabla', 'Tabla de picoteo', '🧀', 'picoteo', 'queso/Mantecoso:50g; galletas/Saladas:0.2un; conserva/Aceitunas:0.05un', {
      'Clásica': 'fiambre/Salame:40g; queso/Gauda laminado:30g; frutosecos/Mix:20g',
      'Premium con vino': 'fiambre/Salame:40g; fiambre/Jamón de pierna:30g; queso/Parmesano:30g; uva/Verde sin pepa:60g; frutosecos/Almendras:20g; vino/Tinto:200ml',
      'Económica': 'fiambre/Mortadela:40g; papasfritas/Lisas:0.2un; papasfritas/Ramitas:0.2un'
    }],
    ['guacamole', 'Guacamole', '🥑', 'picoteo', 'palta/Hass:0.7un; limon/Sutil:0.5un; cebolla/Morada:0.1un; tomate/Larga vida:0.25un; hierbas/Cilantro; sal/Fina; nachos/Nachos:0.25un', {
      'Clásico': '', 'Picante': 'aji/Jalapeño'
    }],
    ['nachos', 'Nachos', '🌮', 'picoteo', 'nachos/Nachos:0.3un; queso/Cheddar:50g', {
      'Con guacamole': 'palta/Hass:0.4un; limon/Sutil:0.3un', 'Con carne': 'molida/10% grasa:70g; especia/Comino',
      'Con pico de gallo': 'nachos/Pico de gallo:0.15un', 'Con salsa de queso': 'nachos/Salsa queso:0.15un'
    }],
    ['hummus', 'Hummus', '🫘', 'picoteo', 'legumbre/Garbanzos:50g; limon/Común:0.25un; ajo/Cabeza; aceite/Oliva extra virgen; especia/Comino; panpita:1un', {
      'Clásico': '', 'Con pimentón': 'pimenton/Rojo:0.3un', 'Con betarraga': 'betarraga/Cocida:0.3un'
    }],
    ['papasfritas', 'Papas fritas', '🍟', 'picoteo', 'aceite/Maravilla; sal/Fina', {
      'Caseras': 'papa/Blanca:250g', 'Congeladas': 'prefritas/Corte recto:200g',
      'Chorrillana': 'prefritas/Corte casero:220g; vacuno/Posta:120g; cebolla/Blanca:0.5un; huevo:1un; embutido/Vienesas:1un',
      'Con queso y tocino': 'prefritas/Corte recto:200g; queso/Cheddar:40g; tocino/Cubitos:30g'
    }],
    ['pebre', 'Pebre', '🌶️', 'picoteo', 'tomate/Larga vida:0.5un; cebolla/Blanca:0.15un; hierbas/Cilantro; aji/Verde; aceite/Maravilla; vinagre/Blanco; sal/Fina', {}],

    /* ---------- MÁS COCINA CHILENA ---------- */
    ['curanto', 'Curanto en olla', '🦪', 'chilena', 'choritos/En concha:250g; almejas/Almejas:150g; pollo/Trutro corto:1un; cerdo/Costillar:150g; embutido/Longaniza:0.5un; papa/Blanca:250g; harina/Sin polvos:40g; repollo/Verde:0.15un; vino/Blanco:80ml; cebolla/Blanca:0.25un', {}],
    ['caldillo', 'Caldillo de congrio', '🍲', 'chilena', 'congrio/Trozos:220g; papa/Blanca:200g; cebolla/Blanca:0.3un; zanahoria:0.3un; tomate/Larga vida:0.5un; ajo/Cabeza; vino/Blanco:50ml; crema/De leche:30ml; hierbas/Cilantro; especia/Ají de color', {}],
    ['pastelpapas', 'Pastel de papas', '🥔', 'chilena', 'papa/Blanca:300g; leche/Entera:60ml; mantequilla/Con sal:10g; cebolla/Blanca:0.5un; huevo:0.5un; conserva/Aceitunas:0.05un; especia/Comino; especia/Ají de color', {
      'De carne': 'molida/7% grasa:130g', 'De pollo': 'pollo/Pechuga:130g'
    }],
    ['plateada', 'Plateada al jugo', '🥩', 'chilena', 'vacuno/Plateada:250g; cebolla/Blanca:0.3un; zanahoria:0.3un; ajo/Cabeza; vino/Tinto:60ml; especia/Laurel', {
      'Con puré': 'papa/Blanca:250g; leche/Entera:50ml; mantequilla/Con sal:10g', 'Con arroz': 'arroz/Grado 1:80g', 'Con papas cocidas': 'papa/Blanca:300g'
    }],
    ['machas', 'Mariscos a la parmesana', '🐚', 'chilena', 'queso/Parmesano:40g; mantequilla/Con sal:10g; vino/Blanco:20ml; limon/Común:0.3un; pan/Baguette:0.3un', {
      'Machas': 'almejas/Machas:180g', 'Ostiones': 'almejas/Ostiones:180g'
    }],
    ['tomatican', 'Tomaticán', '🍅', 'chilena', 'tomate/Larga vida:1.5un; choclo/Fresco:0.5un; cebolla/Blanca:0.4un; ajo/Cabeza; vacuno/Posta:120g; picante/Merkén; especia/Orégano', {
      'Con arroz': 'arroz/Grado 1:80g', 'Con papas cocidas': 'papa/Blanca:250g'
    }],
    ['ajiaco', 'Ajiaco', '🥘', 'chilena', 'vacuno/Posta:150g; papa/Blanca:250g; cebolla/Blanca:0.3un; pimenton/Verde:0.3un; huevo:1un; especia/Orégano; sopa/Caldos en cubo', {}],
    ['panamasado', 'Pan amasado', '🍞', 'chilena', 'harina/Sin polvos:150g; reposteria/Levadura:0.1un; mantequilla/Con sal:20g; sal/Fina', {
      'Clásico': '', 'Con chicharrones': 'cerdo/Panceta:40g'
    }],
    ['moteconhuesillo', 'Mote con huesillo', '🍑', 'chilena', 'mote/De trigo:60g; huesillos:4un; azucar/Chancaca:0.15un; azucar/Blanca:20g; especia/Canela', {}],
    ['calzonesrotos', 'Calzones rotos', '🍩', 'chilena', 'harina/Con polvos:70g; huevo:0.4un; mantequilla/Sin sal:15g; azucar/Blanca:20g; leche/Entera:20ml; aceite/Maravilla; azucar/Flor', {}],
    ['colademono', 'Cola de mono', '🥛', 'tragos', 'pisco/35°:80ml; leche/Entera:200ml; cafe/Instantáneo; azucar/Blanca:25g; especia/Canela; especia/Clavo de olor', {}],

    /* ---------- LATINOAMÉRICA ---------- */
    ['chili', 'Chili con carne', '🌶️', 'mundo', 'molida/10% grasa:130g; legumbre/Porotos rojos:60g; salsatom/Tomate triturado:0.3un; cebolla/Blanca:0.3un; pimenton/Rojo:0.3un; ajo/Cabeza; especia/Comino; aji/Cacho de cabra', {
      'Con arroz': 'arroz/Grado 1:70g', 'Con nachos': 'nachos/Nachos:0.3un; queso/Cheddar:30g; crema/Ácida:30ml'
    }],
    ['arepas', 'Arepas', '🫓', 'mundo', 'harina/De maíz precocida:90g; sal/Fina; aceite/Maravilla', {
      'Reina pepiada': 'pollo/Pechuga:90g; palta/Hass:0.4un; mayo/Normal; cebolla/Morada:0.1un', 'De queso': 'queso/Mozzarella:60g',
      'De carne mechada': 'vacuno/Posta:110g; cebolla/Blanca:0.2un; pimenton/Rojo:0.2un; salsatom/Pomarola:0.15un'
    }],
    ['polloalabrasa', 'Pollo a la brasa', '🍗', 'mundo', 'pollo/Pollo entero:0.3un; ajo/Cabeza; especia/Comino; soya; limon/Sutil:0.5un; especia/Paprika', {
      'Con papas fritas': 'prefritas/Corte recto:200g', 'Con ensalada': 'lechuga/Costina:0.2un; tomate/Larga vida:0.5un; pepino/Ensalada:0.25un'
    }],
    ['ajidegallina', 'Ají de gallina', '🍛', 'mundo', 'pollo/Pechuga:150g; picante/Ají amarillo; pan/Molde blanco:0.1un; leche/Entera:100ml; queso/Parmesano:20g; frutosecos/Nueces:15g; cebolla/Blanca:0.3un; ajo/Cabeza; papa/Amarilla:150g; huevo:0.5un; conserva/Aceitunas:0.05un; arroz/Grado 1:70g', {}],
    ['causa', 'Causa limeña', '🥔', 'mundo', 'papa/Amarilla:250g; limon/Sutil:1un; picante/Ají amarillo; aceite/Vegetal; palta/Hass:0.4un; mayo/Normal; huevo:0.5un', {
      'De atún': 'atun/Lomitos en aceite:0.4un', 'De pollo': 'pollo/Pechuga:100g', 'De camarón': 'camaron/Cocidos:90g'
    }],
    ['feijoada', 'Feijoada', '🫘', 'mundo', 'legumbre/Porotos negros:90g; cerdo/Costillar:120g; embutido/Longaniza:0.5un; tocino/Cubitos:30g; cebolla/Blanca:0.3un; ajo/Cabeza; especia/Laurel; arroz/Grado 1:70g; naranja/De mesa:0.3un', {}],
    ['milanesa', 'Milanesa', '🥩', 'mundo', 'huevo:0.7un; panrallado:50g; harina/Sin polvos:20g; aceite/Maravilla', {
      'De carne con papas fritas': 'vacuno/Posta:180g; prefritas/Corte recto:180g', 'De pollo con papas fritas': 'pollo/Pechuga:180g; prefritas/Corte recto:180g',
      'Napolitana con puré': 'vacuno/Posta:180g; salsatom/Salsa italiana:0.1un; fiambre/Jamón de pierna:30g; queso/Mozzarella:50g; papa/Blanca:250g; leche/Entera:50ml'
    }],
    ['enchiladas', 'Enchiladas', '🌯', 'mundo', 'tortilla/Maíz:3un; salsatom/Tomate triturado:0.3un; queso/Cheddar:50g; crema/Ácida:40ml; cebolla/Morada:0.2un; hierbas/Cilantro; aji/Jalapeño', {
      'De pollo': 'pollo/Pechuga:130g', 'De carne': 'molida/10% grasa:120g', 'De queso': 'queso/Fresco:60g'
    }],

    /* ---------- ASIA ---------- */
    ['sushi', 'Sushi casero', '🍣', 'asia', 'arroz/Para sushi:90g; nori:1.5un; vinagre/De arroz; azucar/Blanca; soya; jengibre', {
      'Salmón y palta': 'salmon/Filete:80g; palta/Hass:0.3un; queso/Crema:30g',
      'Camarón tempura': 'camaron/Crudos:70g; harina/Sin polvos:20g; aceite/Vegetal; palta/Hass:0.25un',
      'Vegetariano': 'palta/Hass:0.4un; pepino/Ensalada:0.3un; zanahoria:0.3un; queso/Crema:30g'
    }],
    ['poke', 'Poke bowl', '🥗', 'asia', 'arroz/Para sushi:90g; palta/Hass:0.4un; pepino/Ensalada:0.3un; zanahoria:0.3un; soya; cebolla/Cebollín', {
      'De salmón': 'salmon/Filete:120g', 'De atún': 'atun/Lomitos en agua:0.6un', 'De pollo teriyaki': 'pollo/Pechuga:120g; asiaticas/Teriyaki'
    }],
    ['padthai', 'Pad thai', '🍜', 'asia', 'fideos/De arroz:100g; huevo:1un; frutosecos/Maní salado:20g; cebolla/Cebollín; limon/Sutil:0.5un; soya; azucar/Rubia; ajo/Cabeza; aceite/Vegetal', {
      'De camarón': 'camaron/Crudos:110g', 'De pollo': 'pollo/Pechuga:120g', 'Vegetal': 'zanahoria:0.4un; pimenton/Rojo:0.3un; repollo/Morado:0.1un'
    }],
    ['currythai', 'Curry thai', '🍛', 'asia', 'especia/Pasta de curry; conserva/Leche de coco:0.3un; pimenton/Rojo:0.3un; cebolla/Blanca:0.25un; arroz/Jazmín:80g; hierbas/Albahaca', {
      'De pollo': 'pollo/Pechuga:150g', 'De camarón': 'camaron/Crudos:130g', 'De verduras': 'zapallito:0.4un; brocoli/Fresco:0.25un; champi/Laminado:60g'
    }],
    ['teriyaki', 'Pollo teriyaki', '🍱', 'asia', 'pollo/Trutro corto:1.5un; asiaticas/Teriyaki; ajo/Cabeza; jengibre; arroz/Jazmín:80g', {
      'Con arroz': '', 'Con verduras salteadas': 'brocoli/Fresco:0.25un; zanahoria:0.3un; pimenton/Rojo:0.2un'
    }],

    /* ---------- EUROPA Y MEDITERRÁNEO ---------- */
    ['shawarma', 'Shawarma / gyros', '🥙', 'europa', 'panpita:1.5un; tomate/Larga vida:0.5un; cebolla/Morada:0.2un; lechuga/Costina:0.1un; yogurt/Griego:0.5un; ajo/Cabeza; pepino/Ensalada:0.2un; especia/Comino; especia/Paprika', {
      'De pollo': 'pollo/Pechuga:150g', 'De cerdo (gyros)': 'cerdo/Lomo:150g', 'De vacuno': 'vacuno/Lomo liso:150g'
    }],
    ['falafel', 'Falafel', '🧆', 'europa', 'legumbre/Garbanzos:80g; cebolla/Blanca:0.2un; ajo/Cabeza; hierbas/Perejil; especia/Comino; harina/Sin polvos:15g; aceite/Vegetal; panpita:1un; yogurt/Griego:0.4un', {}],
    ['tortillaesp', 'Tortilla española', '🥚', 'europa', 'papa/Blanca:200g; huevo:1.5un; aceite/Oliva extra virgen; sal/Fina', {
      'Con cebolla': 'cebolla/Blanca:0.4un', 'Sin cebolla': '', 'Con chorizo': 'embutido/Chorizo:0.4un; cebolla/Blanca:0.3un'
    }],
    ['moussaka', 'Moussaka', '🍆', 'europa', 'berenjena:0.7un; molida/7% grasa:120g; papa/Blanca:150g; salsatom/Tomate triturado:0.25un; cebolla/Blanca:0.3un; ajo/Cabeza; leche/Entera:100ml; mantequilla/Con sal:10g; harina/Sin polvos:10g; queso/Rallado:25g; especia/Canela', {}],
    ['ratatouille', 'Ratatouille', '🥗', 'europa', 'berenjena:0.4un; zapallito:0.5un; pimenton/Rojo:0.3un; pimenton/Amarillo:0.3un; tomate/Perita:1un; cebolla/Morada:0.3un; ajo/Cabeza; aceite/Oliva extra virgen; hierbas/Albahaca', {
      'Clásico': '', 'Con arroz': 'arroz/Grado 1:70g', 'Con pollo': 'pollo/Pechuga:120g'
    }],
    ['goulash', 'Goulash', '🍲', 'europa', 'vacuno/Posta:180g; cebolla/Blanca:0.5un; pimenton/Rojo:0.4un; especia/Paprika; salsatom/Pasta de tomate:0.1un; ajo/Cabeza; papa/Blanca:200g; sopa/Caldos en cubo', {}],
    ['quiche', 'Quiche', '🥧', 'europa', 'masas/Masa quebrada:0.25un; huevo:1un; crema/De leche:60ml; queso/Gauda laminado:30g; especia/Nuez moscada', {
      'Lorraine': 'tocino/Cubitos:40g; cebolla/Blanca:0.2un', 'De espinaca': 'espinaca/Bolsa:0.25un; queso/Fresco:30g', 'De champiñones': 'champi/Laminado:70g; cebolla/Blanca:0.2un'
    }],

    /* ---------- MÁS POSTRES ---------- */
    ['tiramisu', 'Tiramisú', '🍰', 'postres', 'galletas/Champaña:0.3un; queso/Mascarpone:70g; huevo:0.6un; azucar/Blanca:25g; cafe/Instantáneo; reposteria/Cacao amargo', {}],
    ['churros', 'Churros', '🥖', 'postres', 'harina/Sin polvos:60g; mantequilla/Sin sal:10g; aceite/Maravilla; azucar/Blanca:20g; especia/Canela', {
      'Con manjar': 'manjar/Normal:0.08un', 'Con chocolate': 'chocolate/Barra:0.15un; leche/Entera:50ml', 'Solos con azúcar': ''
    }]
  ];

  function parse(str) {
    if (!str) return [];
    return str.split(';').map(s => s.trim()).filter(Boolean).map(tok => {
      const m = tok.match(/^(.*?)(?::([\d.]+)\s*([a-z]+))?$/i);
      const path = m[1].trim(), slash = path.indexOf('/');
      const alias = slash < 0 ? path : path.slice(0, slash);
      const ref = A[alias];
      if (!ref) { console.warn('Receta: alias desconocido', alias); return null; }
      const [c, i] = ref.split('|');
      return { c, i, v: slash < 0 ? '' : path.slice(slash + 1).trim(), q: m[2] ? +m[2] : 0, u: m[3] || '' };
    }).filter(Boolean);
  }

  window.RECIPES = R.map(([id, n, e, c, base, vars]) => ({
    id, n, e, c, base: parse(base),
    vars: Object.entries(vars || {}).map(([vn, s]) => ({ n: vn, ing: parse(s) }))
  }));
})();
