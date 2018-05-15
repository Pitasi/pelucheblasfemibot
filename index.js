const Telegraf = require('telegraf');
const fs = require('fs');

const token = process.env.TOKEN
const bot = new Telegraf(token);
const admins = process.env.ADMINS ?
  process.env.ADMINS.split(',').map(s => (parseInt(s.trim(), 10))) :
  [];
const replies = require('./replies');
 
 
// Funzione che preso il ctx e un elemento di replies manda la risposta
// scegliendo il metodo giusto in base al tipo (gif o sticker)
function sendReply(ctx, reply) {
  let replyMethod = null;
 
  // replyMethod sarà la funzione con cui invieremo la risposta,
  // cambia in base al tipo (gif / sticker)
  if (reply.type === 'gif')
    replyMethod = ctx.replyWithDocument;
  else if (reply.type === 'sticker')
    replyMethod = ctx.replyWithSticker;
  else throw new Error('Tipo di risposta non valido.');
  

  replyMethod(reply.id, {
    reply_to_message_id: ctx.message.reply_to_message ? ctx.message.reply_to_message.message_id : null,
  });
  ctx.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id).catch(() => {});
}

bot.use((ctx, next) => {
  ctx.state.isAdmin = admins.indexOf(ctx.from.id) >= 0;
  ctx.state.isPrivate = ctx.chat.type === 'private';

  next();
})

bot.command('lista', (ctx) => {
    ctx.reply(
        'Digita una delle seguenti parole:\n\n' +
        Object.keys(replies).join('\n')
    )
})

bot.command('delete', ctx => {
  if (!ctx.state.isAdmin) {
      return;
  }
  
  const text = ctx.message.text
  const splitIdx = text.indexOf(' ')
  const trigger = splitIdx !== -1 && text.substr(splitIdx+1)

  if (trigger) {
      delete replies[trigger]
      fs.writeFileSync('./replies.json', JSON.stringify(replies), 'utf-8');
      ctx.reply('Trigger removed :)')
  } else {
      ctx.reply('Usage: /delete <trigger>')
  }
})
 
bot.on('text', (ctx) => {
  if (ctx.state.isPrivate && ctx.state.isAdmin && ctx.message.reply_to_message && ctx.message.reply_to_message.sticker) {
    const id = ctx.message.reply_to_message.sticker.file_id;
    const trigger = ctx.message.text;

    replies[trigger] = { "type": "sticker", id };
    fs.writeFileSync('./replies.json', JSON.stringify(replies), 'utf-8');

    ctx.reply('Trigger saved :)');
  }

  let cmd = ctx.message.text.toLowerCase()
  if (replies.hasOwnProperty(cmd))
    sendReply(ctx, replies[cmd])
});



if (process.env.WEBHOOK) {
  console.log('Starting webhook server')
  bot.telegram.setWebhook(process.env.WEBHOOK+'/'+token)
  bot.startWebhook('/'+token, null, 443)
} else {
  bot.startPolling();
}
