# Roadmap de CuántoMaterial

Objetivo: convertir CuántoMaterial en una herramienta útil para planificar una reforma completa y, al mismo tiempo, construir tráfico orgánico sostenible alrededor de búsquedas de intención práctica como “cuánta pintura necesito”, “cuántas cajas de suelo necesito” o “calcular materiales para una habitación”.

## Prioridad 0 — Estabilidad y confianza

- Revisar todas las calculadoras después de cambios importantes y evitar regresiones entre editor, resultados, comparador y Mi proyecto.
- Unificar versionado de CSS/JS para evitar caché de versiones antiguas.
- Añadir comprobaciones automáticas básicas de enlaces, scripts y páginas principales antes de publicar.
- Mejorar mensajes de error: nunca dejar un botón que parezca no hacer nada.
- Mantener fórmulas, supuestos y límites visibles y comprensibles.

## Prioridad 1 — Indexación y SEO

- Monitorizar en Google Search Console todas las URLs públicas importantes.
- Trabajar primero las páginas que Google rastrea pero no indexa.
- Ampliar contenido únicamente cuando responda preguntas reales del usuario; evitar texto de relleno.
- Crear clústeres de contenido a partir de consultas que empiecen a aparecer en GSC.
- Reforzar enlaces internos entre calculadora, guía relacionada, optimizador y comparador.
- Revisar títulos y descripciones con datos reales de impresiones/CTR cuando haya suficiente muestra.
- Evaluar un dominio propio antes de que el proyecto acumule muchas señales y enlaces externos.

## Prioridad 2 — Calculadoras más fáciles de usar

- Permitir compartir un cálculo mediante URL con sus parámetros principales precargados.
- Añadir presets frecuentes cuando tengan sentido (habitación pequeña/media/grande, medidas comunes de piezas, etc.) sin sustituir los datos reales del usuario.
- Explicar mejor la diferencia entre superficie de suelo, superficie de paredes, perímetro y superficie a pintar.
- Añadir conversiones de unidades donde eviten errores frecuentes.
- Mostrar un desglose “de dónde sale este resultado” junto al total.
- Mejorar el editor de plano con edición más precisa y pruebas específicas en móvil/táctil.

## Prioridad 3 — Mi Proyecto como centro de la reforma

- Crear una lista de compra consolidada que agrupe materiales repetidos de distintas estancias.
- Permitir fusionar, editar y marcar elementos como comprados.
- Separar coste estimado, coste real y diferencia frente al presupuesto.
- Resumen por estancia y resumen global más visual.
- Exportación PDF más cuidada y CSV preparado para trabajar en Excel/Sheets.
- Guardado/restauración más clara del proyecto y avisos antes de perder datos locales.

## Prioridad 4 — Comparadores y compra

- Expandir comparadores solo a categorías donde existan datos públicos suficientemente comparables.
- Mostrar fecha de comprobación y frescura de cada precio/dato.
- Añadir más formatos de un mismo producto cuando cambien el coste real del proyecto.
- Conectar directamente cálculo → comparador → optimizador → proyecto sin volver a escribir cantidades.
- Si en el futuro se usan enlaces de afiliado, indicarlo de forma explícita y mantener la clasificación independiente de la comisión.

## Prioridad 5 — Rendimiento y retención

- Medir Core Web Vitals y establecer un presupuesto de rendimiento para JS/CSS.
- Evitar listeners, observers o renders continuos innecesarios.
- Mejorar navegación móvil y accesibilidad de teclado/táctil.
- Valorar modo instalable/PWA solo cuando el sistema de caché esté suficientemente probado.
- Añadir herramientas recientes y continuación de proyecto sin requerir cuenta.

## Cómo decidir qué construir

1. Errores que impiden completar un cálculo.
2. Problemas que confunden el resultado o la compra.
3. Mejoras que aumenten la utilidad entre varias herramientas.
4. Páginas/oportunidades que ya muestran demanda en Search Console.
5. Funciones nuevas sin demanda demostrada.

No se debe priorizar añadir muchas calculadoras por cantidad. La prioridad es que las existentes sean fiables, estén bien conectadas y respondan mejor que una calculadora genérica aislada.