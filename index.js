const Telegraf = require('telegraf');
const token = 'API KEY';
const bot = new Telegraf(process.env.TOKEN);
const replies = require('./replies')
 
// Restituisce l'id del messaggio di risposta se c'è,
// altrimenti restituisce null
function getReplyToMessageId(ctx) {
  if (ctx.message.reply_to_message)
    return ctx.message.reply_to_message.message_id
  return null
}
 
// Funzione che preso il ctx e un elemento di replies manda la risposta
// scegliendo il metodo giusto in base al tipo (gif o sticker)
function sendReply(ctx, reply) {
  let replyMethod = null
 
  // replyMethod sarà la funzione con cui invieremo la risposta,
  // cambia in base al tipo (gif / sticker)
  if (reply.type === 'gif')
    replyMethod = ctx.replyWithDocument
  else if (reply.type === 'sticker')
    replyMethod = ctx.replyWithSticker
  else throw new Error('Tipo di risposta non valido.')
 
  replyMethod(reply.id, {
    reply_to_message_id: getReplyToMessageId(ctx)
  })
}

bot.command('lista', (ctx) => {
    ctx.reply(
        'Digita una delle seguenti parole:\n\n' +
        Object.keys(replies).join('\n')
    )
})
 
bot.on('text', (ctx) => {
  let cmd = ctx.message.text.toLowerCase()
  if (cmd in replies)
    sendReply(ctx, replies[cmd])
});

bot.startPolling();
