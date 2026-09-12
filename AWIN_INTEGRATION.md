# Monetización contextual y AWIN

El catálogo de `assets/commerce-catalog.js` conserva primero la URL oficial (`normalUrl`). Todos los productos publicados tienen `affiliate.enabled: false`, por lo que el motor comercial compartido aplica `rel="noopener noreferrer"` y nunca cambia el ranking por una comisión.

Los programas de Leroy Merlin, BAUHAUS, ManoMano, BRICO DEPÔT y Aosom se registran únicamente como candidatos. Su identificador sirve como metadato; no prueba que la cuenta haya sido aceptada.

Para activar un producto hacen falta tres datos reales en ese producto: la confirmación de aceptación del programa, el enlace de seguimiento creado por AWIN y la URL de destino comprobada. Entonces se sustituye exclusivamente su bloque `affiliate` por:

```js
affiliate: { enabled: true, network: 'awin', url: 'ENLACE_REAL_GENERADO_POR_AWIN' }
```

No se debe añadir el Publisher ID al frontend, instalar MasterTag ni activar Convert-a-Link. El motor aplicará entonces `rel="sponsored noopener noreferrer"`; mientras falte cualquiera de esos datos, el enlace oficial sigue siendo el único enlace mostrado.
