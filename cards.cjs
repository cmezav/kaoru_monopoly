// Situaciones cortas. Los premios se mantienen moderados y los castigos son más fuertes.
module.exports={
chance:[
{text:'Jax escondió tu dado. Retrocede tres casillas.',effect:'back',amount:3},
{text:'Caine cambia el escenario. Avanza hasta la próxima estación.',effect:'station'},
{text:'Luz abre un portal. Avanza hasta GO y cobra 150.',effect:'go'},
{text:'Te descubrieron haciendo trampa con el dado. Ve a la cárcel sin cobrar GO.',effect:'jail'},
{text:'La cámara demuestra que no fuiste tú. Conserva esta carta para salir de la cárcel.',effect:'pass'},
{text:'Eda te vendió algo que resultó ser basura. Paga 100 al banco.',effect:'pay',amount:100},
{text:'Contrataste a I.M.P. y llegó la factura. Paga 200 al banco.',effect:'pay',amount:200},
{text:'Rompiste una ventana en Piltover. Paga 150 por la reparación.',effect:'pay',amount:150},
{text:'Perdiste el último tren. Retrocede a la estación anterior sin cobrar GO.',effect:'backStation'},
{text:'Encontraste un atajo. Avanza dos casillas y resuelve donde caigas.',effect:'forward',amount:2}
],
community:[
{text:'El banco te cobró dos veces. Recupera 100.',effect:'receive',amount:100},
{text:'Encontraste dinero en una chaqueta vieja. Cobra 50.',effect:'receive',amount:50},
{text:'Es tu cumpleaños. Cada rival activo te entrega 50.',effect:'birthday',amount:50},
{text:'Compraste entradas para el grupo. Paga 50 a cada rival activo.',effect:'everyone',amount:50},
{text:'Ganaste un concurso de cosplay. Cobra 100.',effect:'receive',amount:100},
{text:'Tu pedido llegó incompleto. El banco te devuelve 75.',effect:'receive',amount:75},
{text:'Te llegó una multa que ignoraste semanas. Paga 100 al bote si está activado; de lo contrario, al banco.',effect:'fine',amount:100},
{text:'Una tubería se rompió. Paga 50 por casa y 200 por hotel.',effect:'repairs'},
{text:'Recibiste un cupón. Conserva esta carta: reduce automáticamente tu próximo alquiler en 100, sin bajarlo de cero.',effect:'discount'},
{text:'Te confundieron con otra persona. Ve a la cárcel sin cobrar GO.',effect:'jail'}
]};
