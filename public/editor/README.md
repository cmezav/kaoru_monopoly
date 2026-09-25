# Kaoru Monopoly v0.5 — 40 casillas, tema claro

Abre `index.html`. Tu tablero adjunto ya viene incluido con sus 20 calles y 19 imágenes, más dos calles nuevas. No necesitas importarlo para empezar en un navegador sin borradores.

Si se recupera otro borrador local, pulsa **Tu tablero incluido** para cargar la copia que enviaste. Guarda después de editar.

## Distribución

11 espacios por lado, con esquinas compartidas: 40 en total. 22 calles en 8 grupos (2,3,3,3,3,3,3,2), 4 estaciones, 2 servicios, 3 Suerte, 3 Evento, 2 impuestos y 4 esquinas clásicas. Salida abajo a la izquierda; recorrido horario; estaciones en el centro de cada lado. Por tanto, son dos calles nuevas, no doce.

Tema claro completo, imágenes a casilla completa y editor con recorte cuadrado. El tablero mantiene un ancho mínimo de 640 px: en pantallas pequeñas puede desplazarse horizontalmente para no hacer ilegibles las cartas. El panel editor pasa debajo.

Lee la guía desde **Guía de casillas** (`reglas.html`). Es una adaptación de estructura clásica, no una reproducción exacta de los precios o nombres de Monopoly Perú. Las 22 calles usan la progresión clásica de precios desde Salida: 60, 60, 100, 100, 120, 140, 140, 160, 180, 180, 200, 220, 220, 240, 260, 260, 280, 300, 300, 320, 350 y 400.

## Migración

Acepta JSON v1, v2, v3, v4 y v5. v1/v2 se amplían automáticamente a 22 calles conservando nombres, imágenes, encuadres y economía existente. Se reasignan grupos y se unifica el color dentro de cada grupo para cumplir la distribución nueva. El borrador se guarda en `draft-v5`; los borradores anteriores permanecen intactos.

El archivo `kaoru-tablero-40.json` es tu copia ya convertida. `default-board.js` contiene esa misma copia para funcionar incluso al abrir index.html directamente. Si cambias de navegador o URL, importa el JSON.

Sube TODOS los archivos del proyecto a GitHub, incluyendo `board-model.js` y `default-board.js`. La integración rechazó anteriormente las escrituras, así que esta entrega no se ha publicado automáticamente.

## Estado

Editor de configuración, sin partidas todavía. La próxima etapa es implementar el motor clásico, cuentas y servidor multijugador. Las descripciones de casillas no son acciones ejecutables.

## Pruebas

`node --test tests/editor.test.cjs`

Pruebas de topología, conteos, migración del archivo suministrado, preservación de imágenes y configuración, validación y recorte. La revisión visual y de interacción en navegador real sigue pendiente en este entorno.

## Imágenes en casillas especiales

Las 40 casillas admiten imágenes: 22 calles y 18 casillas especiales, incluidas las cuatro esquinas (estaciones, servicios, impuestos, Suerte y Evento). Pulsa cualquiera, sube una imagen y ajusta zoom/posición. La imagen cubre la casilla; su rótulo e icono permiten reconocer su función. Cada casilla tiene imagen independiente.

Los campos económicos solo aparecen al editar calles. El botón «Ver función de esta casilla» mantiene accesibles las reglas. Quitar imagen restaura el diseño original. Guardar y exportar incluyen las imágenes especiales. Antes de actualizar, exporta tus cambios actuales; no uses «Tu tablero incluido» si deseas conservar cambios posteriores al archivo que compartiste.
