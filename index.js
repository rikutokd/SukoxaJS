const { Client, GatewayIntentBits } = require('discord.js')
require('dotenv/config')

const client = new Client ({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

client.on('ready', () => {
  console.log('Sukoxa is ready')
})

client.on('messageCreate', message => {
  if(message.content === '!js') {
    message.reply('jsだよ')
  }
})

client.login(process.env.TOKEN)