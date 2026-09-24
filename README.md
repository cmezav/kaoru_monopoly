# Kaoru Monopoly

Un juego de propiedades inspirado en nuestras series favoritas.

## Primera entrega: editor de calles

Abre `index.html` o sirve esta carpeta con `python -m http.server 8000` y visita `http://localhost:8000`.
No requiere instalación de paquetes. Los archivos estáticos también se pueden alojar en GitHub Pages (Settings → Pages → Deploy from a branch → main → /root).

- Tablero de muestra con 20 calles editables y cuatro casillas especiales.
- Nombre del tablero, nombres de calles, serie, color, precio y alquiler base.
- Subida PNG/JPG/WebP (8 MB máximo), normalizada a un máximo de 1400 píxeles de lado.
- Recorte 4:3 con zoom, arrastre táctil/ratón, flechas de teclado y controles horizontal/vertical.
- El mismo encuadre se representa en la vista previa y la casilla; no se deforma la imagen.
- Guardado explícito en IndexedDB del navegador. No sincroniza entre dispositivos.
- Exportación/importación JSON con imágenes y parámetros de encuadre incluidos. Exporta como copia de seguridad: borrar datos del navegador elimina el borrador local.

## Estado y siguientes etapas

Esta entrega es un editor, no una partida jugable. Las casillas y precios son ejemplos, no un balance final. No se han implementado cuentas, fichas personales, marcos, salas ni sonidos todavía.

1. Motor de reglas y servidor autoritativo: dados, turnos, compra, alquiler y victoria. Probar dos clientes en una misma sala.
2. Cuentas y almacenamiento remoto de perfiles, fichas PNG, marcos y tableros.
3. Salas privadas de 2–4 personas, reconexión y persistencia de partidas.
4. Animaciones, sonidos, subastas e intercambios.

El editor se mantiene independiente del motor: `version`, `title` y `streets` definen el documento. Cada calle conserva `image`, `zoom`, `x`, `y` (posición normalizada), y sus datos económicos. El servidor deberá validar esos datos, congelar una copia al empezar la partida y controlar las transacciones. GitHub Pages sirve el editor, pero no sustituye al servidor de juego.

## Verificación

Prueba de navegador: subir una imagen, ajustar zoom y posición, verificar recorte, guardar y recargar, exportar/importar, rechazar un JSON inválido y comprobar pantalla móvil sin desbordamientos horizontales.

Pruebas automatizadas: `node --test tests/editor.test.cjs` (3 pruebas: perímetro, validación y geometría del recorte). La sintaxis también se comprobó con `node --check app.js`. La verificación visual y el recorrido de guardado en un navegador real quedan pendientes: Chromium no estuvo disponible en el entorno de desarrollo.
