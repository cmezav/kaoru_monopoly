// Original short situations. Amounts are fixed; no percentages.
module.exports={
chance:[
{text:'Jax escondió tus dados. Retrocede tres casillas.',effect:'back',amount:3},
{text:'Caine cambia el escenario. Avanza hasta la próxima estación.',effect:'station'},
{text:'Luz abre un portal. Avanza hasta GO y cobra 200.',effect:'go'},
{text:'Te descubrieron haciendo trampa con los dados. Ve a la cárcel sin cobrar GO.',effect:'jail'},
{text:'La cámara demuestra que no fuiste tú. Conserva esta carta para salir de la cárcel.',effect:'pass'},
{text:'Eda te vendió algo que resultó ser basura. Paga 50 al banco.',effect:'pay',amount:50},
{text:'Contrataste a I.M.P. y llegó la factura. Paga 100 al banco.',effect:'pay',amount:100},
{text:'Rompiste una ventana en Piltover. Paga 75 por la reparación.',effect:'pay',amount:75},
{text:'Perdiste el último tren. Retrocede a la estación anterior sin cobrar GO.',effect:'backStation'},
{text:'Encontraste un atajo. Avanza dos casillas y resuelve donde caigas.',effect:'forward',amount:2}
],
community:[
{text:'El banco te cobró dos veces. Recupera 100.',effect:'receive',amount:100},
{text:'Encontraste dinero en una chaqueta vieja. Cobra 50.',effect:'receive',amount:50},
{text:'Es tu cumpleaños. Cada rival activo te entrega 25.',effect:'birthday',amount:25},
{text:'Compraste entradas para el grupo. Paga 25 a cada rival activo.',effect:'everyone',amount:25},
{text:'Ganaste un concurso de cosplay. Cobra 100.',effect:'receive',amount:100},
{text:'Tu pedido llegó incompleto. El banco te devuelve 75.',effect:'receive',amount:75},
{text:'Te llegó una multa que ignoraste semanas. Paga 50 al bote si está activado; de lo contrario, al banco.',effect:'fine',amount:50},
{text:'Una tubería se rompió. Paga 25 por casa y 100 por hotel.',effect:'repairs'},
{text:'Recibiste un cupón. Conserva esta carta: reduce automáticamente tu próximo alquiler en 50, sin bajarlo de cero.',effect:'discount'},
{text:'Te confundieron con otra persona. Ve a la cárcel sin cobrar GO.',effect:'jail'}
]};
