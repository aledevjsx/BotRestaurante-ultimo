import 'dotenv/config';
import bot from '@bot-whatsapp/bot';
import { getDay } from 'date-fns';
import GoogleSheetService from './services/sheets/index.js';

import QRPortalWeb from '@bot-whatsapp/portal';
import BaileysProvider from '@bot-whatsapp/provider/baileys';
import MockAdapter from '@bot-whatsapp/database/mock';
import textToVoice from './services/eventlab.js';

const googelSheet = new GoogleSheetService(
    '19xDsJRUOg6d4I7t_LkhfmQq4xOk-JmT6aT585jq7IXk'
  ); 

const GLOBAL_STATE = [];
let nom = '';
let ped = '';
let met = '';
let dir= '';
let obs = '';

const flowSecReserva = bot .addKeyword(['a', 'e', 'i', 'o', 'u']).addAnswer(['¡Muchas gracias!😊','_En breve, una persona encargada tomará su solicitud de reserva_']);
const flowSecConsulta = bot .addKeyword(['a', 'e', 'i', 'o', 'u']).addAnswer(['¡Muchas gracias!😊','_En breve, una persona encargada atenderá su solicitud_']);

const flowSecCarta = bot .addKeyword(['a', 'e', 'i', 'o', 'u'])
.addAnswer(['¡Muchas gracias!😊','_En breve, una persona encargada tomará su pedido_']);

const flowPedido = bot .addKeyword(['pedir'], { sensitive: true })
.addAction(async (_, { flowDynamic }) => {
  return flowDynamic('¿Cuál es tu nombre?🤗',{delay: 3000})
})
.addAction({ capture: true }, async (ctx, { flowDynamic, state }) => {
  nom = ctx.body
  //nom = ctx.pushName
  state.update({ NOMBRE: nom});
  return flowDynamic(`*¡Genial ${nom}*! Envíame tu ubicación actual📍 o escribe tu dirección👇`)
})
.addAction({ capture: true }, async (ctx, { flowDynamic, state }) => {
  try {
    dir = `https://www.google.com/maps?q=${ctx.message.locationMessage.degreesLatitude},${ctx.message.locationMessage.degreesLongitude}&hl=es-PY&gl=py&shorturl=1`
    state.update({ DIRECCION: dir });
    return flowDynamic(`¿Cuál es tu método de pago?💳 Aceptamos Yape, Plin y Efectivo.\n_En caso elija efectivo, por favor brindar el monto con el cual cancelarás_`)
  } catch (error) {
    dir = ctx.body
    state.update({ DIRECCION: dir });
    return flowDynamic(`¿Cuál es tu método de pago?💳 Aceptamos Yape, Plin y Efectivo.\n_En caso elija efectivo, por favor brindar el monto con el cual cancelarás_`)
  }
})
.addAction({ capture: true }, async (ctx, { flowDynamic, state }) => {
  met = ctx.body
  state.update({ METODO: ctx.body });
  return flowDynamic('¿Alguna observacion para su pedido?🤔')
})
.addAction({ capture: true }, async (ctx, { flowDynamic, state }) => {
  obs = ctx.body
  state.update({ OBSERVACIONES: ctx.body });
  return flowDynamic(`🙌🏻¡Excelente *${nom}*!🙌🏻 Tu pedido fue registrado🥳`)
})
.addAction(async (_, { flowDynamic }) => {
  return flowDynamic([`*Este es el resumen de su pedido* 📝\nPedido: ${ped}\nObservación: ${obs}\nNombre: ${nom}\nMétodo de Pago: ${met}\nDirección: ${dir}`])
})
.addAction(
  async (_, { flowDynamic, state }) => {
    const path = await textToVoice(`Muchas gracias ${nom} por tu preferencia. En Breve nos comunicaremos contigo para confirmar tu pedido.`);
    await flowDynamic([{ body: "escucha", media: path }]);
  }
)
.addAnswer(
  '🍲*Mavila Restomarket*🏪',
  null,
  async (ctx, { state }) => {
  const currentState = state.getMyState();
  const fecha = new Date();
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const año = fecha.getFullYear();
  const horas = fecha.getHours().toString().padStart(2, '0');
  const minutos = fecha.getMinutes().toString().padStart(2, '0');
  const segundos = fecha.getSeconds().toString().padStart(2, '0');
  const fechaFormateada = `${dia}/${mes}/${año} ${horas}:${minutos}:${segundos}`;
    await googelSheet.saveOrder({       
      FECHA: fechaFormateada.toString(),
      TELEFONO: ctx.from,    
      ESTADO: 'Pendiente',
      NOMBRE: currentState.NOMBRE,
      DIRECCION: currentState.DIRECCION,
      METODO: currentState.METODO,
      PEDIDO: currentState.PEDIDO,
      OBSERVACIONES: currentState.OBSERVACIONES,
    });
  }
)

const flowMenu = bot .addKeyword(['1'],{sensitive:true})
.addAnswer(
    `Te presento el menú del día 😋`,
    {delay: 3000},
    async (_, { flowDynamic }) => {
      const dayNumber = getDay(new Date());
      const getMenu = await googelSheet.retriveDayMenu(dayNumber);
      const menu = getMenu.join('\n');
      await flowDynamic(menu);
    }
  )

  .addAction(async (_, { flowDynamic }) => {
    return flowDynamic('_Si el menú de hoy es de su agrado, por favor envíenos su pedido._😄\nEscribe *VOLVER* para ir al menú principal',{delay: 1000})
  })
  .addAction({ capture: true }, async (ctx, { gotoFlow, state }) => {
      ped = ctx.body;
       if (ped == 'hola' || ped == 'Hola' || ped == 'Volver' || ped == 'volver') {
         return gotoFlow(flowPrincipal);
       } else {
        state.update({PEDIDO:ctx.body})
        return gotoFlow(flowPedido);
       }
  })

  const flowCarta = bot .addKeyword(['2'],{sensitive:true}).addAnswer(
    [
        '¡Exelente!😊',
        '🌐Aquí te envío nuestra carta digital',
    ],
    {delay: 3000},
    null,
    [flowSecCarta]
).addAnswer('Envío de la carta', {
    media: 'https://doncuy.vensys.pe/carta.pdf',
},{delay: 1000})
.addAction(async (_, { flowDynamic }) => {
  return flowDynamic('_Recuerda escribirnos luego de elegir tu pedido._😉\nEscribe *VOLVER* para ir al menú principal',{delay: 1000})
})
.addAction({ capture: true }, async (ctx, { gotoFlow, state }) => {
    ped = ctx.body;
     if (ped == 'hola' || ped == 'Hola' || ped == 'Volver' || ped == 'volver') {
       return gotoFlow(flowPrincipal);
     } else {
      state.update({PEDIDO:ctx.body})
      return gotoFlow(flowPedido);
     }
})

const flowInformacion = bot .addKeyword(['3'],{sensitive:true}).addAnswer(
    [
        '📍 Nos ubicamos en Av. Javier Prado 4556',
        '\nNuestro horario de atención es:',
        '🕜Lunes a viernes: 8am - 10pm',
        '🕜Sábado y Domingo: 10am - 12am',
        '\nRecuerde seguirnos en nuestras redes sociales:',
        '🕺🏻Tiktok',
        '📸Instagram'
    ],{delay: 3000}
)

const flowReserva = bot .addKeyword(['4'],{sensitive:true}).addAnswer(
    [
        '🙍🏻Para reservar una mesa, es necesario nos indique lo siguiente:', 
        '▫️ Nombre Responsable', 
        '▫️ Cantidad de Personas',
        '▫️ Teléfono a comunicarnos'
    ],
    {delay: 3000},
    null,
    [flowSecReserva]
)

const flowConsulta = bot .addKeyword(['5'],{sensitive:true}).addAnswer(
    [
        '_*Brevemente, indíquenos su consulta o reclamo*_'
    ],
    {delay: 3000},
    null,
    [flowSecConsulta]
)

const flowPrincipal = bot .addKeyword(['hola', 'Hola','HOLA', 'buenas tardes','buenas noches', 'Buenas tardes','Buenas noches', 'Buen', 'Quiero', 'quiero','QUIERO','Empezar','empezar','EMPEZAR'],{sensitive:true})
.addAction(async (ctx, { flowDynamic }) => {
  return flowDynamic(`¡Hola *${ctx.pushName}*! Bienvenid@ a *Mavila Restomarket*`,
    { media: 'https://i.pinimg.com/564x/53/df/e6/53dfe6a48797869e9742fcd631ee3d06.jpg' })
})
.addAnswer(
        [   'Marque una de las siguientes opciones para continuar atendiendolo:\n',
            '1️⃣ 🍲Nuestro menú del día',
            '2️⃣ 📋Nuestra carta digital',
            '3️⃣ 📍Información sobre nuestro local y atención',
            '4️⃣ ✍🏻Reservar en nuestro local',
            '5️⃣ ❓Consulta o reclamo',
        ],
        {delay: 2500},
        null,
        [flowMenu,flowCarta, flowInformacion, flowReserva, flowConsulta]
)
const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = bot .createFlow([flowPrincipal,flowPedido])
    const adapterProvider = bot .createProvider(BaileysProvider)
    bot .createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })
    QRPortalWeb()
}
main()
