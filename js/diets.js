/* Dietas y alergias: qué contiene cada producto del catálogo y con qué se puede reemplazar.
   attrs(c, i, v) → Set de atributos del producto (gluten, dairy, meat...).
   Cada dieta indica qué atributos evita; substitute() busca un reemplazo del catálogo que no los tenga. */
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
  const ATTR = {
    meat: 'carne', fish: 'pescado o marisco', seafood: 'mariscos', dairy: 'lácteos', dairy_lf: 'lácteos',
    egg: 'huevo', honey: 'miel', gluten: 'gluten', pork: 'cerdo', nuts: 'frutos secos', alcohol: 'alcohol'
  };

  const GLUTEN = {
    despensa: ['Fideos', 'Harina', 'Pan rallado', 'Avena', 'Mote'],
    panaderia: ['Pan', 'Pan de completo', 'Pan de hamburguesa', 'Tortillas', 'Pan pita', 'Queque / Kuchen', 'Masa para pizza', 'Tostadas', 'Masas'],
    snacks: ['Galletas', 'Barras de cereal'], desayuno: ['Cereal'], aceites: ['Salsa de soya', 'Salsas asiáticas'], alcohol: ['Cerveza']
  };
  const SEAFOOD = ['Camarones', 'Choritos', 'Machas / Almejas', 'Mix de mariscos', 'Surimi'];

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
    return a;
  }

  /* Reemplazos posibles, en orden de preferencia */
  const is = (c, i) => g => g.c === c && g.i === i;
  const SUBS = [
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

  const avoidOf = tags => new Set((tags || []).flatMap(t => (DIETS.find(d => d.id === t) || { avoid: [] }).avoid));
  const clash = (a, avoid) => [...a].filter(x => avoid.has(x));
  function substitute(g, avoid) {
    for (const [match, t] of SUBS) {
      if (!match(g) || (t[0] === g.c && t[1] === g.i && t[2] === g.v)) continue;
      if (!clash(attrs(t[0], t[1], t[2]), avoid).length) return { c: t[0], i: t[1], v: t[2] };
    }
    return null;
  }
  const dietName = id => (DIETS.find(d => d.id === id) || { name: id }).name;

  window.Diet = { DIETS, ATTR, attrs, avoidOf, clash, substitute, dietName };
})();
