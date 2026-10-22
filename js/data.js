/* Catálogo del supermercado: [nombre, emoji, [variantes]] */
window.CATALOG = [
  { id: 'frutas', name: 'Frutas', emoji: '🍎', color: '#ff3d6e', items: [
    ['Manzana', '🍎', ['Roja', 'Verde', 'Fuji', 'Pink Lady', 'Royal Gala']],
    ['Plátano', '🍌', ['Maduro', 'Verde', 'Orgánico']],
    ['Naranja', '🍊', ['Para jugo', 'De mesa', 'Mandarina', 'Clementina']],
    ['Limón', '🍋', ['Sutil', 'De pica', 'Común']],
    ['Palta', '🥑', ['Hass', 'Negra', 'Fuerte']],
    ['Uva', '🍇', ['Verde sin pepa', 'Roja', 'Negra']],
    ['Frutilla', '🍓', ['Fresca', 'Congelada']],
    ['Pera', '🍐', ['Packham', 'Asiática', 'Abate Fetel']],
    ['Durazno', '🍑', ['Fresco', 'Conserva', 'Nectarín']],
    ['Piña', '🍍', ['Entera', 'Trozos', 'Conserva']],
    ['Sandía', '🍉', ['Entera', 'Media', 'Cuarto']],
    ['Melón', '🍈', ['Calameño', 'Tuna', 'Cantaloupe']],
    ['Kiwi', '🥝', []],
    ['Arándanos', '🫐', ['Frescos', 'Congelados']],
    ['Mango', '🥭', []],
    ['Cerezas', '🍒', []],
    ['Coco', '🥥', ['Entero', 'Rallado', 'Agua de coco']]
  ]},
  { id: 'verduras', name: 'Verduras', emoji: '🥬', color: '#22d977', items: [
    ['Tomate', '🍅', ['Larga vida', 'Cherry', 'Perita']],
    ['Lechuga', '🥬', ['Escarola', 'Costina', 'Hidropónica', 'Española']],
    ['Cebolla', '🧅', ['Blanca', 'Morada', 'Cebollín', 'Cebolla perla']],
    ['Papa', '🥔', ['Blanca', 'Roja', 'Amarilla', 'Camote', 'Papas pre-fritas']],
    ['Zanahoria', '🥕', ['Entera', 'Rallada', 'Baby']],
    ['Ajo', '🧄', ['Cabeza', 'Pelado', 'En pasta', 'En polvo']],
    ['Pimentón', '🫑', ['Rojo', 'Verde', 'Amarillo']],
    ['Choclo', '🌽', ['Fresco', 'Congelado', 'Conserva']],
    ['Pepino', '🥒', ['Ensalada', 'Dill']],
    ['Zapallo italiano', '🥒', []],
    ['Zapallo', '🎃', ['Camote', 'Trozo']],
    ['Brócoli', '🥦', ['Fresco', 'Congelado']],
    ['Coliflor', '🥦', []],
    ['Champiñón', '🍄', ['Laminado', 'Entero', 'Portobello', 'Ostra']],
    ['Espinaca', '🥬', ['Bolsa', 'Congelada']],
    ['Repollo', '🥬', ['Verde', 'Morado']],
    ['Cilantro / Perejil', '🌿', ['Cilantro', 'Perejil', 'Albahaca', 'Menta']],
    ['Ají', '🌶️', ['Verde', 'Cacho de cabra', 'Jalapeño']],
    ['Betarraga', '🟣', ['Fresca', 'Cocida']],
    ['Porotos verdes', '🫛', []],
    ['Apio', '🥬', []],
    ['Jengibre', '🫚', []],
    ['Berenjena', '🍆', []]
  ]},
  { id: 'carnes', name: 'Carnes', emoji: '🥩', color: '#ff5a36', items: [
    ['Vacuno', '🥩', ['Lomo vetado', 'Lomo liso', 'Entraña', 'Asado de tira', 'Plateada', 'Posta', 'Punta de ganso', 'Abastero']],
    ['Carne molida', '🍖', ['4% grasa', '7% grasa', '10% grasa', 'Mixta']],
    ['Pollo', '🍗', ['Pechuga', 'Trutro entero', 'Trutro corto', 'Alitas', 'Pollo entero', 'Filetitos']],
    ['Cerdo', '🥓', ['Costillar', 'Chuleta', 'Lomo', 'Pulpa', 'Malaya', 'Panceta']],
    ['Cordero', '🐑', ['Pierna', 'Costillar', 'Chuleta']],
    ['Pavo', '🦃', ['Pechuga', 'Trutro', 'Molida']],
    ['Embutidos', '🌭', ['Chorizo', 'Longaniza', 'Prieta', 'Vienesas', 'Choripán']],
    ['Fiambres', '🥪', ['Jamón de pierna', 'Jamón de pavo', 'Salame', 'Mortadela', 'Pechuga de pavo', 'Arrollado']],
    ['Hamburguesas', '🍔', ['Vacuno', 'Pollo', 'Vegetal']],
    ['Tocino', '🥓', ['Laminado', 'Cubitos']]
  ]},
  { id: 'pescados', name: 'Pescados y mariscos', emoji: '🐟', color: '#22c5ee', items: [
    ['Salmón', '🐟', ['Filete', 'Ahumado', 'Porciones congeladas']],
    ['Reineta', '🐠', []],
    ['Merluza', '🐟', ['Filete', 'Apanada']],
    ['Atún', '🥫', ['Lomitos en agua', 'Lomitos en aceite', 'Desmenuzado']],
    ['Camarones', '🦐', ['Cocidos', 'Crudos', 'Ecuatorianos']],
    ['Choritos', '🦪', ['En concha', 'Desconchados', 'Conserva']],
    ['Machas / Almejas', '🐚', ['Machas', 'Almejas', 'Ostiones']],
    ['Jurel', '🥫', ['Conserva', 'Fresco']],
    ['Surimi', '🦀', []],
    ['Mix de mariscos', '🦑', []],
    ['Congrio', '🐟', ['Filete', 'Trozos']]
  ]},
  { id: 'lacteos', name: 'Lácteos y huevos', emoji: '🧀', color: '#ffc928', items: [
    ['Leche', '🥛', ['Entera', 'Semidescremada', 'Descremada', 'Sin lactosa', 'Almendra', 'Avena', 'En polvo']],
    ['Huevos', '🥚', ['Bandeja 12', 'Bandeja 30', 'De campo', 'Color']],
    ['Queso', '🧀', ['Gauda laminado', 'Mantecoso', 'Parmesano', 'Mozzarella', 'Cheddar', 'Fresco', 'Crema', 'Rallado', 'Mascarpone', 'Sin lactosa', 'Vegano']],
    ['Mantequilla', '🧈', ['Con sal', 'Sin sal', 'Margarina']],
    ['Yogurt', '🍦', ['Natural', 'Griego', 'Batido', 'Con cereal', 'Protein', 'Sin lactosa', 'Vegetal']],
    ['Crema', '🥛', ['De leche', 'Ácida', 'Chantilly', 'Vegetal']],
    ['Quesillo', '🧀', []],
    ['Leche condensada', '🥫', []]
  ]},
  { id: 'panaderia', name: 'Panadería', emoji: '🥖', color: '#ff9f43', items: [
    ['Pan', '🥖', ['Marraqueta', 'Hallulla', 'Integral', 'Molde blanco', 'Molde integral', 'Frica', 'Baguette', 'Sin gluten']],
    ['Masas', '🥧', ['Hojaldre', 'Masa quebrada']],
    ['Pan de completo', '🌭', ['Normal', 'XL', 'Sin gluten']],
    ['Pan de hamburguesa', '🍔', ['Normal', 'Brioche', 'Sin gluten']],
    ['Tortillas', '🌮', ['Trigo', 'Maíz', 'Integrales']],
    ['Pan pita', '🫓', []],
    ['Queque / Kuchen', '🍰', ['Queque', 'Kuchen', 'Brazo de reina']],
    ['Masa para pizza', '🍕', ['Tradicional', 'Sin gluten']],
    ['Tostadas', '🍞', ['Clásicas', 'Integrales', 'De arroz']]
  ]},
  { id: 'despensa', name: 'Despensa', emoji: '🍝', color: '#b06cff', items: [
    ['Arroz', '🍚', ['Grado 1', 'Grado 2', 'Integral', 'Basmati', 'Jazmín', 'Para sushi', 'Preparado']],
    ['Fideos', '🍝', ['Spaghetti', 'Corbatitas', 'Espirales', 'Tallarines', 'Lasaña', 'Cabellos de ángel', 'De arroz', 'Sin gluten']],
    ['Legumbres', '🫘', ['Porotos', 'Porotos negros', 'Porotos rojos', 'Lentejas', 'Garbanzos', 'Arvejas']],
    ['Mote', '🌾', ['De trigo', 'Mote mote']],
    ['Huesillos', '🍑', []],
    ['Algas nori', '🍙', []],
    ['Harina', '🌾', ['Con polvos', 'Sin polvos', 'Integral', 'Maicena', 'De maíz precocida', 'Sin gluten']],
    ['Azúcar', '🍬', ['Blanca', 'Rubia', 'Flor', 'Endulzante', 'Chancaca']],
    ['Sal', '🧂', ['Fina', 'Gruesa', 'De mar', 'Parrillera']],
    ['Salsa de tomate', '🥫', ['Tomate triturado', 'Pomarola', 'Salsa italiana', 'Pasta de tomate']],
    ['Salsas para pasta', '🍝', ['Pesto', 'Alfredo', 'Carbonara', '4 quesos', 'Boloñesa lista']],
    ['Conservas', '🥫', ['Choclo', 'Arvejas', 'Palmitos', 'Champiñones', 'Aceitunas', 'Duraznos', 'Piña', 'Leche de coco', 'Chucrut']],
    ['Quinoa / Cuscús', '🌾', ['Quinoa', 'Cuscús']],
    ['Repostería', '🧁', ['Polvos de hornear', 'Esencia de vainilla', 'Cacao amargo', 'Chips de chocolate', 'Levadura']],
    ['Postres en polvo', '🍮', ['Gelatina', 'Flan', 'Leche asada', 'Mousse']],
    ['Sopas', '🍜', ['Sobres', 'Cremas', 'Ramen', 'Caldos en cubo']],
    ['Puré', '🥔', ['Instantáneo']],
    ['Avena', '🥣', ['Tradicional', 'Instantánea', 'Sin gluten']],
    ['Pan rallado', '🍞', ['Tradicional', 'Sin gluten']]
  ]},
  { id: 'aceites', name: 'Aceites y condimentos', emoji: '🫒', color: '#a3e635', items: [
    ['Aceite', '🫒', ['Maravilla', 'Oliva extra virgen', 'Vegetal', 'Canola', 'Coco', 'Spray']],
    ['Vinagre', '🍶', ['Blanco', 'De vino', 'Manzana', 'Balsámico', 'De arroz']],
    ['Mayonesa', '🥚', ['Normal', 'Light', 'Casera', 'Vegana']],
    ['Ketchup', '🍅', []],
    ['Mostaza', '🌭', ['Normal', 'Dijon', 'Miel mostaza']],
    ['Ají / Salsa picante', '🌶️', ['Ají en pasta', 'Merkén', 'Tabasco', 'Pebre', 'Ají amarillo']],
    ['Especias', '🧂', ['Orégano', 'Comino', 'Pimienta', 'Paprika', 'Ajo en polvo', 'Aliño completo', 'Curry', 'Canela', 'Laurel', 'Ají de color', 'Nuez moscada', 'Romero', 'Clavo de olor', 'Pasta de curry']],
    ['Salsa de soya', '🥢', ['Normal', 'Sin gluten']],
    ['Salsas asiáticas', '🥢', ['Teriyaki', 'Agridulce', 'Sriracha']],
    ['Salsa BBQ', '🍖', []],
    ['Chimichurri', '🌿', []]
  ]},
  { id: 'desayuno', name: 'Desayuno y once', emoji: '☕', color: '#f59e0b', items: [
    ['Café', '☕', ['Instantáneo', 'Grano', 'Molido', 'Cápsulas']],
    ['Té', '🍵', ['Negro', 'Verde', 'Hierbas', 'Manzanilla', 'Rojo']],
    ['Cereal', '🥣', ['Corn flakes', 'Granola', 'Chocapic', 'Muesli', 'Sin gluten']],
    ['Mermelada', '🍓', ['Frutilla', 'Damasco', 'Mora', 'Light']],
    ['Manjar', '🍯', ['Normal', 'Light']],
    ['Miel', '🍯', []],
    ['Nutella / Untable', '🍫', ['Nutella', 'Mantequilla de maní']],
    ['Chocolate en polvo', '🍫', ['Milo', 'Cola Cao', 'Nesquik']],
    ['Paté', '🥫', []]
  ]},
  { id: 'bebestibles', name: 'Bebestibles', emoji: '🥤', color: '#38bdf8', items: [
    ['Agua', '💧', ['Sin gas', 'Con gas', 'Bidón 6L', 'Saborizada']],
    ['Bebida', '🥤', ['Coca-Cola', 'Coca Zero', 'Sprite', 'Fanta', 'Pepsi', 'Bilz / Pap', 'Ginger ale', 'Tónica']],
    ['Jugo', '🧃', ['Naranja', 'Néctar', 'En polvo', 'Natural', 'Granadina']],
    ['Energética', '⚡', ['Red Bull', 'Monster', 'Score']],
    ['Isotónica', '🏃', ['Gatorade', 'Powerade']],
    ['Leche saborizada', '🥛', ['Chocolate', 'Frutilla', 'Vainilla']]
  ]},
  { id: 'alcohol', name: 'Alcohol', emoji: '🍺', color: '#ff4fa3', items: [
    ['Cerveza', '🍺', ['Lager', 'Artesanal', 'IPA', 'Sin alcohol', 'Sin gluten', 'Lata', 'Botella', 'Six pack']],
    ['Vino', '🍷', ['Tinto', 'Blanco', 'Rosé', 'Pipeño', 'Caja', 'Reserva']],
    ['Pisco', '🍸', ['35°', '40°', 'Sour preparado']],
    ['Espumante', '🍾', ['Brut', 'Demi sec']],
    ['Ron', '🥃', ['Blanco', 'Añejo']],
    ['Vodka', '🍸', []],
    ['Whisky', '🥃', []],
    ['Gin', '🍸', []],
    ['Tequila', '🌵', []],
    ['Hielo', '🧊', ['Bolsa 2 kg', 'Bolsa 5 kg']]
  ]},
  { id: 'snacks', name: 'Snacks y dulces', emoji: '🍫', color: '#fb7185', items: [
    ['Papas fritas', '🥔', ['Lisas', 'Onduladas', 'Pringles', 'Ramitas', 'Doritos', 'Cheetos']],
    ['Galletas', '🍪', ['Dulces', 'Saladas', 'Agua', 'Soda', 'Oreo', 'Triton', 'Champaña', 'Sin gluten']],
    ['Chocolates', '🍫', ['Barra', 'Bombones', 'Sahne-Nuss', 'Trencito']],
    ['Frutos secos', '🥜', ['Maní salado', 'Almendras', 'Nueces', 'Mix', 'Pasas']],
    ['Dulces', '🍬', ['Gomitas', 'Caramelos', 'Chicles', 'Masticables']],
    ['Cabritas', '🍿', ['Microondas', 'Para hacer', 'Dulces']],
    ['Barras de cereal', '🥨', []],
    ['Nachos y salsas', '🌮', ['Nachos', 'Guacamole', 'Salsa queso', 'Pico de gallo']]
  ]},
  { id: 'congelados', name: 'Congelados', emoji: '🧊', color: '#60a5fa', items: [
    ['Helado', '🍨', ['Pote 1L', 'Paletas', 'Cono', 'Vegano']],
    ['Pizza congelada', '🍕', []],
    ['Papas pre-fritas', '🍟', ['Corte recto', 'Corte casero', 'Rústicas']],
    ['Verduras congeladas', '🥦', ['Mix', 'Choclo', 'Arvejas', 'Porotos verdes']],
    ['Nuggets / Apanados', '🍗', ['Nuggets de pollo', 'Empanadas de queso', 'Apanados']],
    ['Empanadas', '🥟', ['Pino', 'Queso', 'Napolitana', 'Masa para empanadas']],
    ['Fruta congelada', '🍓', ['Frutilla', 'Berries', 'Mango']]
  ]},
  { id: 'asado', name: 'Asado y parrilla', emoji: '🔥', color: '#ef4444', items: [
    ['Carbón', '⚫', ['Bolsa 2,5 kg', 'Bolsa 5 kg', 'Briquetas']],
    ['Leña', '🪵', []],
    ['Encendedor', '🔥', ['Pastillas', 'Gel', 'Fósforos largos', 'Encendedor']],
    ['Parrilla / Rejilla', '♨️', ['Desechable', 'Rejilla']],
    ['Pinzas y utensilios', '🍴', []],
    ['Papel aluminio', '🧻', []]
  ]},
  { id: 'limpieza', name: 'Limpieza', emoji: '🧽', color: '#2dd4bf', items: [
    ['Lavaloza', '🧴', ['Líquido', 'Pastillas lavavajillas']],
    ['Esponjas', '🧽', ['Normal', 'Antirayas', 'Virutilla']],
    ['Detergente', '🧺', ['Líquido', 'Polvo', 'Cápsulas']],
    ['Cloro', '🧪', ['Normal', 'Gel', 'Toallitas']],
    ['Limpiador multiuso', '✨', ['Cocina', 'Baño', 'Vidrios', 'Desengrasante']],
    ['Papel higiénico', '🧻', ['Doble hoja', 'Hoja simple', 'Pack 12', 'Pack 24']],
    ['Toalla de papel', '🧻', []],
    ['Bolsas de basura', '🗑️', ['Chicas', 'Medianas', 'Grandes']],
    ['Paños', '🧼', ['Microfibra', 'Esponja', 'Desechables']],
    ['Insecticida', '🦟', ['Spray', 'Espiral', 'Repelente']]
  ]},
  { id: 'higiene', name: 'Higiene personal', emoji: '🧴', color: '#a78bfa', items: [
    ['Shampoo', '🧴', ['Normal', 'Anticaspa', 'Con acondicionador']],
    ['Acondicionador', '🧴', []],
    ['Jabón', '🧼', ['Barra', 'Líquido', 'Gel de ducha']],
    ['Pasta de dientes', '🦷', []],
    ['Cepillo de dientes', '🪥', []],
    ['Desodorante', '💨', ['Spray', 'Roll-on', 'Barra']],
    ['Bloqueador solar', '☀️', ['FPS 30', 'FPS 50', 'Facial', 'Para niños']],
    ['Toallas higiénicas', '🌸', ['Normales', 'Nocturnas', 'Tampones', 'Protectores']],
    ['Afeitadora', '🪒', ['Desechable', 'Repuestos', 'Espuma']],
    ['Toallitas húmedas', '🧻', []],
    ['Alcohol gel', '🧴', []]
  ]},
  { id: 'botiquin', name: 'Botiquín', emoji: '💊', color: '#34d399', items: [
    ['Analgésico', '💊', ['Paracetamol', 'Ibuprofeno', 'Aspirina']],
    ['Antialérgico', '🤧', ['Loratadina', 'Cetirizina']],
    ['Malestar estomacal', '🤢', ['Sal de fruta', 'Antiácido', 'Suero oral']],
    ['Curitas', '🩹', []],
    ['Gasa y venda', '🩹', []],
    ['Alcohol / Povidona', '🧪', []],
    ['After sun', '🌞', []],
    ['Mareo', '🌀', ['Mareol', 'Gravol']]
  ]},
  { id: 'desechables', name: 'Desechables y viaje', emoji: '🎒', color: '#fbbf24', items: [
    ['Platos', '🍽️', ['Plástico', 'Cartón', 'Compostables']],
    ['Vasos', '🥤', ['Plásticos', 'Cartón', 'Shot']],
    ['Cubiertos', '🍴', []],
    ['Servilletas', '🧻', []],
    ['Film plástico', '🎞️', []],
    ['Bolsas zip', '👝', ['Chicas', 'Medianas', 'Grandes']],
    ['Pilas', '🔋', ['AA', 'AAA', '9V']],
    ['Velas', '🕯️', []],
    ['Encendedor', '🔥', []],
    ['Cooler / Hielo gel', '🧊', []]
  ]}
];

window.EXPENSE_CATS = [
  { id: 'super', name: 'Supermercado', emoji: '🛒', color: '#22d977' },
  { id: 'bar', name: 'Bar / Restaurante', emoji: '🍻', color: '#ff4fa3' },
  { id: 'comida', name: 'Comida al paso', emoji: '🌮', color: '#ff9f43' },
  { id: 'transporte', name: 'Transporte', emoji: '🚌', color: '#38bdf8' },
  { id: 'combustible', name: 'Combustible / Peajes', emoji: '⛽', color: '#f59e0b' },
  { id: 'alojamiento', name: 'Alojamiento', emoji: '🏠', color: '#b06cff' },
  { id: 'actividades', name: 'Actividades / Entradas', emoji: '🎟️', color: '#ffc928' },
  { id: 'salud', name: 'Salud / Farmacia', emoji: '💊', color: '#34d399' },
  { id: 'otros', name: 'Otros', emoji: '✨', color: '#94a3b8' }
];

window.EVENT_TYPES = [
  { id: 'desayuno', name: 'Desayuno', emoji: '🍳', color: '#ffc928', time: '09:00' },
  { id: 'almuerzo', name: 'Almuerzo', emoji: '🍽️', color: '#ff5a36', time: '14:00' },
  { id: 'once', name: 'Once', emoji: '☕', color: '#ff9f43', time: '18:00' },
  { id: 'cena', name: 'Cena', emoji: '🌙', color: '#b06cff', time: '21:00' },
  { id: 'snack', name: 'Picoteo', emoji: '🧀', color: '#22d977', time: '17:00' },
  { id: 'actividad', name: 'Actividad', emoji: '🎉', color: '#38bdf8', time: '11:00' }
];

window.PAY_METHODS = ['Efectivo', 'Débito', 'Crédito', 'Transferencia'];
window.DOC_TYPES = ['Boleta', 'Factura', 'Ticket / Voucher', 'Sin comprobante'];
