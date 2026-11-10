/* Dietas y alergias: qué contiene cada producto del catálogo y con qué se puede reemplazar.
   attrs(c, i, v) → Set de atributos del producto (gluten, dairy, meat...).
   Cada dieta indica qué atributos evita; substitute() busca un reemplazo del catálogo que no los tenga.
   Condiciones de salud (CONDS): "care" son atributos que conviene cuidar (no prohíben la receta: se reemplazan
   si hay alternativa o quedan como aviso); "avoid" es estricto, igual que una dieta. */
(function () {
  const DIETS = [
    { id: 'vegetariano', name: 'Vegetariano', avoid: ['meat', 'fish'] },
    { id: 'vegano', name: 'Vegano', avoid: ['meat', 'fish', 'dairy', 'dairy_lf', 'egg', 'honey'] },
    { id: 'celiaco', name: 'Celíaco / sin gluten', avoid: ['gluten'] },
    { id: 'sin_lactosa', name: 'Sin lactosa', avoid: ['dairy'] },
    { id: 'sin_cerdo', name: 'Sin cerdo', avoid: ['pork'] },
    { id: 'mariscos', name: 'Alergia a mariscos', avoid: ['seafood'] },
    { id: 'frutos_secos', name: 'Alergia a frutos secos / maní', avoid: ['nuts'] },
    { id: 'huevo', name: 'Alergia al huevo', avoid: ['egg'] },
    { id: 'sin_alcohol', name: 'No toma alcohol', avoid: ['alcohol'] }
  ];
  const CONDS = [
    { id: 'diabetes', name: 'Diabetes', care: ['sugar'] },
    { id: 'hipertension', name: 'Hipertensión', care: ['sodium'] },
    { id: 'colesterol', name: 'Colesterol o triglicéridos altos', care: ['satfat'] },
    { id: 'renal', name: 'Enfermedad renal', care: ['sodium'] },
    { id: 'embarazo', name: 'Embarazo', avoid: ['alcohol'], care: ['cured'] },
    { id: 'gota', name: 'Gota (ácido úrico)', care: ['purine'] },
    { id: 'gastritis', name: 'Gastritis o reflujo', care: ['spicy', 'alcohol'] }
  ];
  const ATTR = {
    sugar: 'azúcar', sodium: 'sodio', satfat: 'grasas saturadas', cured: 'cecinas crudas o ahumados', purine: 'purinas', spicy: 'picante',
    meat: 'carne', fish: 'pescado o marisco', seafood: 'mariscos', dairy: 'lácteos', dairy_lf: 'lácteos',
    egg: 'huevo', honey: 'miel', gluten: 'gluten', pork: 'cerdo', nuts: 'frutos secos', alcohol: 'alcohol'
  };

  const GLUTEN = {
    despensa: ['Fideos', 'Harina', 'Pan rallado', 'Avena', 'Mote'],
    panaderia: ['Pan', 'Pan de completo', 'Pan de hamburguesa', 'Tortillas', 'Pan pita', 'Queque / Kuchen', 'Masa para pizza', 'Tostadas', 'Masas'],
    snacks: ['Galletas', 'Barras de cereal'], desayuno: ['Cereal'], aceites: ['Salsa de soya', 'Salsas asiáticas'], alcohol: ['Cerveza']
  };
  const SEAFOOD = ['Camarones', 'Choritos', 'Machas / Almejas', 'Mix de mariscos', 'Surimi'];

  /* Listas por condición: "cat|Producto" (todas las variantes), "cat|Producto|Var1,Var2" (solo esas) o "cat|Producto|!Var" (todas menos esas) */
  const SUGAR = ['despensa|Azúcar|!Endulzante', 'despensa|Postres en polvo', 'desayuno|Mermelada|!Light', 'desayuno|Manjar|!Light', 'desayuno|Miel',
    'desayuno|Nutella / Untable|!Mantequilla de maní', 'desayuno|Chocolate en polvo', 'desayuno|Cereal|Chocapic,Corn flakes,Granola',
    'bebestibles|Bebida|!Coca Zero', 'bebestibles|Jugo|!Natural', 'bebestibles|Energética', 'bebestibles|Isotónica', 'bebestibles|Leche saborizada',
    'lacteos|Leche condensada', 'snacks|Chocolates', 'snacks|Dulces', 'snacks|Galletas|Dulces,Oreo,Triton,Champaña', 'snacks|Cabritas|Dulces', 'snacks|Barras de cereal',
    'panaderia|Queque / Kuchen', 'congelados|Helado', 'despensa|Conservas|Duraznos,Piña', 'frutas|Durazno|Conserva', 'frutas|Piña|Conserva',
    'aceites|Salsas asiáticas|Teriyaki,Agridulce', 'aceites|Salsa BBQ', 'aceites|Ketchup', 'aceites|Mostaza|Miel mostaza',
    'despensa|Repostería|Chips de chocolate', 'alcohol|Pisco|Sour preparado', 'alcohol|Espumante|Demi sec'];
  const SODIUM = ['carnes|Embutidos', 'carnes|Fiambres', 'carnes|Tocino', 'desayuno|Paté', 'despensa|Sopas', 'despensa|Puré', 'aceites|Salsa de soya',
    'aceites|Salsas asiáticas', 'snacks|Papas fritas', 'snacks|Frutos secos|Maní salado', 'despensa|Conservas|Aceitunas,Chucrut', 'congelados|Nuggets / Apanados',
    'congelados|Pizza congelada', 'snacks|Nachos y salsas', 'pescados|Salmón|Ahumado', 'snacks|Galletas|Saladas,Soda', 'despensa|Arroz|Preparado', 'despensa|Sal|Parrillera'];
  const SATFAT = ['carnes|Embutidos', 'carnes|Tocino', 'carnes|Fiambres|Salame,Mortadela,Arrollado', 'carnes|Cerdo|Costillar,Panceta,Malaya', 'carnes|Cordero|Costillar',
    'carnes|Vacuno|Asado de tira,Lomo vetado', 'carnes|Carne molida|10% grasa,Mixta', 'lacteos|Mantequilla', 'lacteos|Crema|De leche,Chantilly,Ácida',
    'lacteos|Queso|Mantecoso,Gauda laminado,Cheddar,Crema,Mascarpone,Parmesano,Rallado,Mozzarella', 'lacteos|Leche|Entera', 'lacteos|Leche condensada',
    'aceites|Aceite|Coco', 'aceites|Mayonesa|Normal,Casera', 'congelados|Papas pre-fritas', 'congelados|Nuggets / Apanados', 'congelados|Pizza congelada',
    'congelados|Empanadas', 'snacks|Papas fritas', 'snacks|Chocolates', 'congelados|Helado|!Vegano', 'panaderia|Queque / Kuchen', 'panaderia|Masas', 'desayuno|Paté'];
  const CURED = ['carnes|Fiambres|Salame', 'pescados|Salmón|Ahumado', 'desayuno|Paté'];
  const PURINE = ['desayuno|Paté', 'alcohol|Cerveza|!Sin alcohol', 'pescados|Jurel', 'pescados|Atún'];
  const SPICY = ['verduras|Ají', 'aceites|Ají / Salsa picante', 'aceites|Salsas asiáticas|Sriracha', 'aceites|Especias|Curry,Pasta de curry'];
  function isIn(list, c, i, v) {
    return list.some(e => {
      const [cc, ii, vv] = e.split('|');
      if (cc !== c || ii !== i) return false;
      if (!vv) return true;
      const not = vv[0] === '!', vs = (not ? vv.slice(1) : vv).split(',');
      return not ? !vs.includes(v || '') : vs.includes(v || '');
    });
  }

  function attrs(c, i, v) {
    const a = new Set();
    v = v || '';
    const noGluten = /sin gluten/i.test(v);
    const plant = /vegan|vegetal/i.test(v);
    // Carnes y pescados
    if (c === 'carnes') {
      if (!(i === 'Hamburguesas' && v === 'Vegetal')) a.add('meat');
      if (['Cerdo', 'Tocino', 'Embutidos'].includes(i) || (i === 'Fiambres' && !/pavo/i.test(v)) || (i === 'Carne molida' && v === 'Mixta')) a.add('pork');
    }
    if (c === 'pescados') { a.add('fish'); if (SEAFOOD.includes(i)) a.add('seafood'); }
    if (c === 'desayuno' && i === 'Paté') { a.add('meat'); a.add('pork'); }
    // Congelados preparados
    if (c === 'congelados') {
      if (i === 'Nuggets / Apanados') { if (v !== 'Empanadas de queso') a.add('meat'); a.add('gluten'); if (v === 'Empanadas de queso') a.add('dairy'); }
      if (i === 'Empanadas') {
        a.add('gluten');
        if (v === 'Pino' || v === 'Napolitana' || !v) a.add('meat');
        if (v === 'Napolitana') a.add('pork');
        if (v === 'Queso' || v === 'Napolitana') a.add('dairy');
      }
      if (i === 'Pizza congelada') { a.add('gluten'); a.add('dairy'); }
      if (i === 'Helado' && v !== 'Vegano') a.add('dairy');
    }
    // Lácteos y huevos
    if (c === 'lacteos') {
      if (i === 'Huevos') a.add('egg');
      else if (i === 'Leche') { if (v === 'Sin lactosa') a.add('dairy_lf'); else if (!['Almendra', 'Avena'].includes(v)) a.add('dairy'); }
      else if (i === 'Mantequilla') { if (v !== 'Margarina') a.add('dairy'); }
      else if (['Queso', 'Yogurt', 'Crema'].includes(i)) { if (v === 'Sin lactosa') a.add('dairy_lf'); else if (!plant) a.add('dairy'); }
      else a.add('dairy');                                   // quesillo, leche condensada
    }
    if ((c === 'desayuno' && ['Manjar', 'Chocolate en polvo'].includes(i)) || (c === 'bebestibles' && i === 'Leche saborizada') ||
        (c === 'snacks' && i === 'Chocolates') || (c === 'snacks' && i === 'Nachos y salsas' && v === 'Salsa queso')) a.add('dairy');
    if (c === 'despensa' && i === 'Salsas para pasta') {
      if (['Alfredo', '4 quesos', 'Carbonara', 'Pesto'].includes(v)) a.add('dairy');
      if (v === 'Carbonara') { a.add('egg'); a.add('meat'); a.add('pork'); }
      if (v === 'Boloñesa lista') a.add('meat');
      if (v === 'Pesto') a.add('nuts');
    }
    if (c === 'aceites' && i === 'Mayonesa' && v !== 'Vegana') a.add('egg');
    if (c === 'panaderia' && i === 'Queque / Kuchen') { a.add('egg'); a.add('dairy'); }
    if (c === 'desayuno' && i === 'Miel') a.add('honey');
    // Gluten
    if ((GLUTEN[c] || []).includes(i) && !noGluten &&
        !(i === 'Harina' && ['Maicena', 'De maíz precocida'].includes(v)) && !(i === 'Tortillas' && v === 'Maíz') &&
        !(i === 'Tostadas' && v === 'De arroz') && !(i === 'Fideos' && v === 'De arroz') && !(i === 'Salsas asiáticas' && v === 'Sriracha')) a.add('gluten');
    if (c === 'panaderia' && i === 'Masas') a.add('dairy');                  // hojaldre y masa quebrada llevan mantequilla
    if (c === 'despensa' && i === 'Sopas' && ['Sobres', 'Ramen', 'Cremas'].includes(v)) a.add('gluten');
    if (c === 'despensa' && i === 'Quinoa / Cuscús' && v === 'Cuscús') a.add('gluten');
    if (c === 'snacks' && i === 'Papas fritas' && v === 'Ramitas') a.add('gluten');
    // Frutos secos
    if ((c === 'snacks' && i === 'Frutos secos') || (c === 'desayuno' && i === 'Nutella / Untable') ||
        (c === 'snacks' && i === 'Chocolates' && v === 'Sahne-Nuss') || (c === 'desayuno' && i === 'Cereal' && ['Granola', 'Muesli'].includes(v)) ||
        (c === 'snacks' && i === 'Barras de cereal')) a.add('nuts');
    // Alcohol
    if (c === 'alcohol' && i !== 'Hielo' && v !== 'Sin alcohol') a.add('alcohol');
    // Condiciones de salud
    if (isIn(SUGAR, c, i, v)) a.add('sugar');
    if (isIn(SODIUM, c, i, v)) a.add('sodium');
    if (isIn(SATFAT, c, i, v)) a.add('satfat');
    if (isIn(CURED, c, i, v)) a.add('cured');
    if (isIn(PURINE, c, i, v) || (c === 'pescados' && SEAFOOD.includes(i))) a.add('purine');
    if (isIn(SPICY, c, i, v)) a.add('spicy');
    return a;
  }

  /* Reemplazos posibles, en orden de preferencia */
  const is = (c, i) => g => g.c === c && g.i === i;
  const SUBS = [
    // Condiciones de salud (van primero: si el reemplazo no sirve para una dieta estricta, se sigue buscando)
    [g => g.c === 'lacteos' && g.i === 'Leche' && g.v === 'Entera', ['lacteos', 'Leche', 'Descremada']],
    [g => g.c === 'aceites' && g.i === 'Mayonesa' && ['Normal', 'Casera', ''].includes(g.v || ''), ['aceites', 'Mayonesa', 'Light']],
    [g => g.c === 'despensa' && g.i === 'Azúcar' && g.v !== 'Endulzante', ['despensa', 'Azúcar', 'Endulzante']],
    [g => g.c === 'bebestibles' && g.i === 'Bebida' && g.v !== 'Coca Zero', ['bebestibles', 'Bebida', 'Coca Zero']],
    [g => g.c === 'desayuno' && g.i === 'Mermelada' && g.v !== 'Light', ['desayuno', 'Mermelada', 'Light']],
    [g => g.c === 'desayuno' && g.i === 'Manjar' && g.v !== 'Light', ['desayuno', 'Manjar', 'Light']],
    [g => g.c === 'carnes' && g.i === 'Carne molida' && ['10% grasa', 'Mixta'].includes(g.v), ['carnes', 'Carne molida', '4% grasa']],
    [g => g.c === 'despensa' && g.i === 'Sal' && g.v === 'Parrillera', ['despensa', 'Sal', 'De mar']],
    [is('despensa', 'Fideos'), ['despensa', 'Fideos', 'Sin gluten']],
    [g => g.c === 'despensa' && g.i === 'Harina' && !['Maicena', 'De maíz precocida'].includes(g.v), ['despensa', 'Harina', 'Sin gluten']],
    [is('despensa', 'Mote'), ['despensa', 'Quinoa / Cuscús', 'Quinoa']],
    [is('aceites', 'Salsas asiáticas'), ['aceites', 'Salsa de soya', 'Sin gluten']],
    [is('despensa', 'Pan rallado'), ['despensa', 'Pan rallado', 'Sin gluten']],
    [is('despensa', 'Avena'), ['despensa', 'Avena', 'Sin gluten']],
    [is('despensa', 'Quinoa / Cuscús'), ['despensa', 'Quinoa / Cuscús', 'Quinoa']],
    [is('panaderia', 'Pan'), ['panaderia', 'Pan', 'Sin gluten']],
    [is('panaderia', 'Pan de completo'), ['panaderia', 'Pan de completo', 'Sin gluten']],
    [is('panaderia', 'Pan de hamburguesa'), ['panaderia', 'Pan de hamburguesa', 'Sin gluten']],
    [is('panaderia', 'Tortillas'), ['panaderia', 'Tortillas', 'Maíz']],
    [is('panaderia', 'Masa para pizza'), ['panaderia', 'Masa para pizza', 'Sin gluten']],
    [is('panaderia', 'Tostadas'), ['panaderia', 'Tostadas', 'De arroz']],
    [is('snacks', 'Galletas'), ['snacks', 'Galletas', 'Sin gluten']],
    [is('desayuno', 'Cereal'), ['desayuno', 'Cereal', 'Sin gluten']],
    [is('aceites', 'Salsa de soya'), ['aceites', 'Salsa de soya', 'Sin gluten']],
    [is('alcohol', 'Cerveza'), ['alcohol', 'Cerveza', 'Sin gluten']],
    [is('alcohol', 'Cerveza'), ['alcohol', 'Cerveza', 'Sin alcohol']],
    [is('lacteos', 'Leche'), ['lacteos', 'Leche', 'Sin lactosa']],
    [is('lacteos', 'Leche'), ['lacteos', 'Leche', 'Avena']],
    [is('lacteos', 'Queso'), ['lacteos', 'Queso', 'Sin lactosa']],
    [is('lacteos', 'Queso'), ['lacteos', 'Queso', 'Vegano']],
    [is('lacteos', 'Crema'), ['lacteos', 'Crema', 'Vegetal']],
    [is('lacteos', 'Mantequilla'), ['lacteos', 'Mantequilla', 'Margarina']],
    [is('lacteos', 'Yogurt'), ['lacteos', 'Yogurt', 'Sin lactosa']],
    [is('lacteos', 'Yogurt'), ['lacteos', 'Yogurt', 'Vegetal']],
    [is('congelados', 'Helado'), ['congelados', 'Helado', 'Vegano']],
    [is('aceites', 'Mayonesa'), ['aceites', 'Mayonesa', 'Vegana']],
    [is('carnes', 'Hamburguesas'), ['carnes', 'Hamburguesas', 'Vegetal']],
    [is('carnes', 'Fiambres'), ['carnes', 'Fiambres', 'Jamón de pavo']],
    [g => g.c === 'carnes' && g.i === 'Carne molida' && g.v === 'Mixta', ['carnes', 'Carne molida', '7% grasa']]
  ];

  const ALL = DIETS.concat(CONDS);
  const avoidOf = tags => new Set((tags || []).flatMap(t => (ALL.find(d => d.id === t) || {}).avoid || []));
  /* Lo que conviene cuidar por salud (sin repetir lo que ya se evita estrictamente) */
  const careOf = tags => { const av = avoidOf(tags); return new Set((tags || []).flatMap(t => (CONDS.find(d => d.id === t) || {}).care || []).filter(x => !av.has(x))); };
  const isCond = id => CONDS.some(d => d.id === id);
  const clash = (a, avoid) => [...a].filter(x => avoid.has(x));
  function substitute(g, avoid) {
    for (const [match, t] of SUBS) {
      if (!match(g) || (t[0] === g.c && t[1] === g.i && t[2] === g.v)) continue;
      if (!clash(attrs(t[0], t[1], t[2]), avoid).length) return { c: t[0], i: t[1], v: t[2] };
    }
    return null;
  }
  const dietName = id => (ALL.find(d => d.id === id) || { name: id }).name;

  const HEALTH = { SUGAR, SODIUM, SATFAT, CURED, PURINE, SPICY };   // para validar contra el catálogo (tests/check-diets.js)
  window.Diet = { DIETS, CONDS, ATTR, HEALTH, attrs, avoidOf, careOf, isCond, clash, substitute, dietName };
})();
