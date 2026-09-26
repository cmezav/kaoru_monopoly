# Kaoru Online v0.7 · servidor gratuito y armario

Juega por Internet con 2–4 amigas mediante una URL y un código de sala. Conserva tu tablero de 40 casillas y las reglas de la versión anterior. Esta versión añade un armario y configuración para **Render Free + Supabase Free**, sin disco de pago.

## Cómo entran las jugadoras

Solo eligen **usuario y contraseña**. No se pide correo, teléfono, confirmación por email ni cuenta de Google. El nombre visible se puede cambiar en Mi perfil. Las cuentas se guardan en la base de datos del juego; no se usa Supabase Auth ni correos ficticios.

El usuario y la contraseña permiten recuperar el mismo perfil desde otra computadora o celular. La sesión dura siete días; después pueden iniciar sesión de nuevo y conservan sus cosas. Guarda la contraseña: no hay recuperación por correo. El código de sala sirve para entrar a una partida, no reemplaza la contraseña del perfil.

Tú, como administradora, sí necesitas cuentas de GitHub, Render y Supabase para publicar y administrar el proyecto. Tus amigas no necesitan cuentas de esos servicios.

## Mi armario

Cada jugadora tiene espacio para **20 imágenes en total**: fotos, marcos y fichas/skins.

- **Guardar nueva:** sube otra imagen y ponle un nombre sin reemplazar las anteriores.
- **Equipar:** usa la foto, marco o ficha elegida en tu perfil y en la partida. Cada tipo se equipa por separado.
- **Editar / reemplazar:** cambia su nombre, imagen, tamaño o posición y pulsa **Sobrescribir esta imagen**. Conserva el mismo espacio en el armario. Si estaba equipada, se actualiza también en la partida.
- **Borrar:** elimina la imagen del armario, previa confirmación. Si estaba equipada, se quita y vuelve al aspecto predeterminado para ese tipo.

Marcos y fichas deben ser PNG; la transparencia se conserva. La foto también acepta JPG y WebP. Las imágenes se reducen en el navegador hasta 700 píxeles por lado y el servidor limita cada archivo guardado. El marco se superpone a la foto circular; usa un PNG con el centro transparente. Los controles de tamaño y posición permiten ajustarlo.

**Mi perfil** sirve para cambiar rápidamente el aspecto equipado: subir otra imagen allí reemplaza la equipada; quitarla solo la desequipa y la conserva en el armario. Usa **Mi armario** para crear variantes sin sobrescribirlas.

Solo la dueña puede consultar su colección o editarla. Otras jugadoras ven las imágenes que lleva equipadas.

## Publicar gratis, paso a paso

Esta entrega es código preparado para desplegar. No hay aún un servidor publicado ni una base Supabase creada desde esta conversación.

### 1. Sube el proyecto a GitHub

En `cmezav/kaoru_monopoly`, crea una rama como `online-free-v07` y sube el **contenido de esta carpeta** a la raíz. Deben quedar allí `package.json`, `package-lock.json`, `server.cjs`, `store.cjs`, `public/`, `Dockerfile` y `render.yaml`.

No subas `node_modules`, `.env`, `data/` ni contraseñas. Conserva la rama anterior como respaldo.

### 2. Crea la base de datos gratuita

1. En [Supabase](https://supabase.com/), crea un proyecto en una organización con plan **Free**. Guarda la contraseña de la base de datos.
2. Espera a que esté listo y abre **Connect**.
3. Copia la cadena de conexión de **Session pooler** (compatible con IPv4). Sustituye el marcador de contraseña por la contraseña de la base de datos. Si contiene caracteres especiales, codifícalos para una URL.
4. Esa cadena se guardará únicamente en Render como `DATABASE_URL`. No la pegues en archivos públicos ni en el código del navegador.

El servidor crea automáticamente sus tablas dentro del esquema privado `kaoru_private`. No necesitas configurar correo, Supabase Auth, políticas para el navegador ni buckets de Storage. Esta versión guarda también las imágenes en la base de datos, separadas de los perfiles: consumen la cuota de base de datos, no la cuota de Storage.

La conexión verifica TLS. Si aparece un error de certificado, descarga el certificado raíz desde los ajustes de la base de datos de Supabase y configura su PEM en `DATABASE_CA` en Render. No desactives SSL para una base pública.

### 3. Crea el servidor gratuito

1. En [Render](https://render.com/), conecta tu GitHub y crea un **Blueprint** usando esta rama y su `render.yaml`.
2. Cuando pida `DATABASE_URL`, pega la cadena de Session pooler.
3. Comprueba que el servicio muestra **Free** y que no adjunta discos ni servicios de pago. Publica.
4. Cuando el despliegue termine, abre la URL HTTPS asignada, por ejemplo `https://tu-servicio.onrender.com`.
5. Crea tu usuario, configura tu armario, crea una sala y comparte **la URL y el código**. Todas pulsan Estoy lista y la anfitriona empieza.

Render proporciona `RENDER_EXTERNAL_URL`, que el servidor usa automáticamente. Si después añades un dominio propio, configura `PUBLIC_URL` con ese origen HTTPS.

### Límites reales de la opción gratuita

- Render Free se duerme tras 15 minutos sin tráfico entrante y vuelve a arrancar al recibir una visita. La primera carga puede tardar aproximadamente un minuto. No está garantizado que el servicio gratuito esté disponible de inmediato las 24 horas.
- Los archivos locales de Render Free son temporales. Por eso los perfiles, armarios y partidas se guardan en **Supabase**, no en el disco de Render. El servidor se niega a usar SQLite en Render si olvidas `DATABASE_URL`.
- Supabase Free incluye 500 MB de base de datos y 5 GB de salida de datos; puede pausar el proyecto tras una semana de inactividad. Si se pausa, la administradora debe reanudarlo desde el panel antes de jugar. No se promete disponibilidad ni conservación indefinida fuera de las políticas del proveedor.
- Los planes gratuitos tienen cuotas compartidas a nivel de cuenta/proyecto. Un grupo pequeño con imágenes reducidas es el uso previsto; supervisa el consumo. No se ha medido el consumo mensual real de este juego en producción.
- No se adjunta un método de cobro desde el código ni se cambia a un plan de pago automáticamente. Revisa siempre el plan seleccionado en ambos servicios.

Fuentes oficiales consultadas el 24-09-2026: [Render Free](https://render.com/docs/free), [Supabase Free y cuotas](https://supabase.com/pricing), [conexión a Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres), [Blueprints](https://render.com/docs/blueprint-spec). Las condiciones pueden cambiar.

## Probar en tu computadora

Con Node.js 24 o posterior, dentro de esta carpeta:

```sh
npm ci
npm start
```

Abre http://localhost:3000. Sin `DATABASE_URL` usa SQLite local en `data/`. Si conservas los datos locales de v0.6, las imágenes activas se trasladan automáticamente al armario al iniciar esta versión. Crear una base Supabase nueva no copia automáticamente tu SQLite local: son bases distintas.

Para probar dos jugadoras en una computadora, usa dos navegadores o una ventana privada; dos pestañas normales comparten sesión. Docker local también funciona con `docker compose up --build -d` y conserva su volumen local. Ese compose es para la prueba local, no la configuración de Render Free.

## Reglas y alcance

Se mantienen compras, alquileres, grupos, casas/hotel, subastas, intercambios, deudas, cárcel, cartas, sonidos, animación y bote opcional. Consulta `REGLAS_ONLINE.md` para sus simplificaciones. El tablero se fija al crear cada sala; modificarlo en el editor no cambia partidas existentes.

Una sala admite hasta cuatro personas. El código se comparte en privado. Al cerrar el navegador se puede volver desde Mis salas; abandonar la partida es otra acción, irreversible. Los turnos esperan a las jugadoras desconectadas. Las subastas vencidas se resuelven cuando hay una sala conectada y el proceso está activo.

El servidor usa una sola instancia, valida todas las acciones y guarda sus cambios antes de confirmarlos. El tablero en uso se almacena temporalmente en memoria para no descargar todas sus imágenes de la base en cada tirada. Solo se consultan las imágenes al mostrarlas. La base puede estar en otro servidor sin perder las salas tras un reinicio de Render.

No incluye todavía invitados sin contraseña, recuperación de contraseñas, chat, bots, moderación o administración de cuentas. Máximo 50 salas creadas por cuenta. No ejecutes varias instancias del servidor: las conexiones SSE y el orden de las mutaciones se coordinan en un solo proceso.

## Configuración técnica

| Variable | Función |
| --- | --- |
| `DATABASE_URL` | Conexión PostgreSQL a Supabase; solo en el servidor. |
| `DATABASE_CA` | Certificado raíz PEM si tu proveedor lo requiere. Acepta saltos de línea o `\n` literales. |
| `PUBLIC_URL` | Origen HTTPS público opcional; Render proporciona `RENDER_EXTERNAL_URL`. |
| `PORT` | 3000 por defecto; Render puede establecerlo. |
| `DATA_DIR` | Solo para SQLite local. No se usa cuando existe `DATABASE_URL`. |
| `PG_SSL=false` | Exclusivamente para pruebas con un Postgres local sin TLS. No usar con Supabase. |

`store.cjs` usa el controlador `pg` y consultas con parámetros. Las imágenes residen en `assets`; los perfiles solo guardan identificadores. Las escrituras que combinan equipamiento y colección son transacciones. La API del armario verifica siempre que la imagen pertenece a quien inició sesión.

## Pruebas y comprobación pendiente

```sh
npm test
```

Pasan **14 pruebas**: motor de juego, integración HTTP/SSE con cuatro clientes y SQLite temporal, solicitudes simultáneas, reinicio, permisos, guardar/equipar/sobrescribir/borrar skins, rechazo de una modificación ajena y traducción de parámetros SQL a PostgreSQL.

**Todavía no se probaron una conexión real a Supabase, el despliegue en Render ni la interfaz con un navegador real.** Al publicar, comprueba con dos dispositivos: registro sin correo, guardar y equipar una ficha, entrar por código, jugar, reiniciar el servicio y volver a ver el mismo armario. Las pruebas locales no sustituyen esa comprobación del servicio externo.


## Editor sincronizado

Al pulsar Guardar en el Editor, el tablero y las cartillas se guardan en la cuenta. Las salas nuevas creadas con **Tablero guardado del Editor** usan automáticamente esa versión, incluyendo imágenes y encuadres. Las salas ya iniciadas conservan la copia con la que empezaron para evitar cambios a mitad de partida.

## Ajustes v1.7.11

- El pago de **alquileres** ya no usa el sonido **cha-ching**. Ahora usa el efecto **sfx-rent.mp3** (cachetada).
- Al pagar un alquiler aparece el **gatito del billete** como overlay visual, optimizado como **WebP** en `public/effects/rent-cat.webp` para cargar rápido igual que los otros gatitos.
- El resto de cobros y pagos sigue usando sus sonidos anteriores.

## Ajustes v1.6.2

- Mensajes de dinero con motivo explícito (por ejemplo, alquiler de una propiedad, compra, impuesto, hipoteca o salida de prisión).
- Las cartillas emergentes muestran solo imagen y descripción; la descripción indica claramente a qué jugadora le salió.
- Los efectos de Darwin y del banco se sirven en WebP y se precargan para reducir esperas visuales.
- Los cambios de turno ya no quedan bloqueados mientras termina una animación visual local.
- El servidor reutiliza el mismo snapshot para responder y retransmitir acciones, reduciendo trabajo duplicado.

## Ajustes v1.7.12.1

- Las propiedades compradas por cada jugador@ ya no muestran solo el número `1`, `2`, etc.
- Ahora, cuando una propiedad está **simplemente comprada** (sin casas, hotel ni hipoteca), se ve la **foto de perfil** del dueño como un **círculo pequeño en una esquina**.
- La miniatura usa **solo la foto**, sin marco decorativo.
- Si alguien no tiene foto de perfil, se muestra la **inicial** como respaldo.
