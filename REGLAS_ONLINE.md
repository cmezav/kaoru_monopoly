# Reglas de Kaoru Online

Cada jugadora comienza con 1000. GO está abajo a la izquierda; las fichas suben por el lado izquierdo y recorren el tablero en sentido horario. Pasar o llegar a GO hacia delante entrega 150. Retroceder o ir directamente a prisión no da salario.

## Casillas

- GO: posición 0. Prisión/visita: 10. Parada libre: 20. Ve a la cárcel: 30. Caer en Prisión tirando los dados es solo visita.
- Suerte: 7, 22, 36. Evento: 2, 17, 33. Cada casilla roba de su mazo, barajado por el servidor y no visible para los clientes. Los mazos se vuelven a barajar al agotarse.
- Estaciones: 5, 15, 25, 35. Cuestan 200. Alquiler 50, 100, 200 o 400 según la cantidad del propietario; una estación hipotecada no cobra, pero cuenta en el conjunto.
- Servicios: 12 y 28. Cuestan 150. Se usa el único dado de la tirada: alquiler igual al dado multiplicado por 16 si se posee uno, o por 40 si se poseen ambos. Un servicio hipotecado no cobra.
- Impuestos: 4 cobra 300 y 38 cobra 200. Van al banco, o al bote si se activó.
- Las otras 22 casillas son calles. Los ocho grupos tienen 2, 3, 3, 3, 3, 3, 3 y 2 calles. El precio procede del tablero importado y los alquileres se cobran al doble del valor configurado para que comprar muchas propiedades tenga más riesgo.

## Comprar y mejorar

Al caer en una propiedad libre, puedes comprarla o pasar. Si pasas, la propiedad queda libre para que otra jugadora pueda comprarla cuando caiga allí. Ya no se inicia una subasta desde una propiedad libre.

Con todas las calles de un grupo y ninguna hipotecada se aplica el alquiler de grupo configurado y se permite construir. Las mejoras deben repartirse equilibradamente: todas con una casa antes de que una tenga dos. Tras cuatro casas, la quinta mejora es un hotel. No se construye en estaciones ni servicios. Esta versión tiene stock ilimitado de edificios.

Se venden mejoras en orden equilibrado inverso y se recupera la mitad de su costo, redondeada hacia abajo. Para hipotecar una calle hay que quitar todas las mejoras del grupo. La hipoteca entrega la mitad del precio de compra. Levantarla cuesta esa cantidad más un cargo de una décima parte, redondeado hacia arriba; el botón muestra el importe final exacto. Las propiedades hipotecadas no cobran alquiler.

## Turnos y prisión

Se usa un solo dado y no hay tiradas extra por dobles. Al terminar de resolver la casilla, el turno avanza automáticamente; no existe un botón de “Terminar turno”.

Antes de tirar en prisión puedes pagar 150 o usar una carta de salida. También puedes intentar sacar 6: si sale, sales y avanzas seis casillas. Si fallas, permaneces allí; tras el tercer fallo, debes pagar 150 y avanzar el resultado del dado. Sigues pudiendo cobrar alquileres estando en prisión.

## Deudas y negociación

Los pagos transfieren únicamente dinero disponible. Si alguien queda debiendo, se pausa la partida para que esa jugadora venda mejoras o hipoteque, incluso si la deuda surgió en el turno de otra. No puedes construir ni levantar hipotecas mientras debes. Solo puedes declarar bancarrota después de agotar esas opciones. La deuda impagada desaparece y tus propiedades vuelven al banco: es una simplificación de esta adaptación.

En tu turno, antes de tirar, puedes ofrecer una propiedad por otra. Ninguna puede estar hipotecada ni tener edificios en su grupo. La destinataria debe aceptar; cualquiera de las dos puede cancelar. No se intercambia dinero ni varias propiedades en una sola propuesta.

## Cartas y bote

Las cartas tienen cantidades fijas. Pueden cobrar, pagar, hacer pagar a otras jugadoras, mover, mandar a prisión o dar una carta de salida o un cupón. Al moverte resuelves la casilla de destino, incluyendo compra, alquiler o nueva carta. El cupón descuenta hasta 100 del siguiente alquiler automáticamente; nunca convierte un alquiler en un premio.

Los pases de prisión y cupones se acumulan en el inventario. En esta versión su carta puede volver a aparecer cuando el mazo se baraja aunque alguien aún conserve uno. Los movimientos a estaciones pagan el alquiler normal, sin multiplicador especial.

Parada libre normalmente no entrega dinero. Si la anfitriona activa el bote, acumula únicamente impuestos y las cartas que indiquen multa al bote. No recibe compras, alquileres, pagos de prisión ni cualquier pérdida de dinero. Caer allí cobra el total, sin límite de premio.

## Final

Una ronda termina cuando los turnos pasan por todas las jugadoras activas. En partidas de 15 o 30 rondas, gana el patrimonio mayor al cerrar la última. Patrimonio: efectivo más valor de compra de propiedades, valor de hipoteca en las hipotecadas y costo pagado por edificios, menos deudas pendientes. Un empate comparte la victoria.

Sin límite de rondas, gana quien siga activa cuando las demás quiebran o abandonan. Abandonar es irreversible en esa sala; cerrar el navegador permite regresar. Los turnos normales esperan a su jugadora si se desconecta.
