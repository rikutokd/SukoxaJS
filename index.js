const { Client, GatewayIntentBits } = require('discord.js')

const client = new Client ({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ],
})

require('dotenv/config')

const { joinVoiceChannel, entersState, VoiceConnectionStatus, createAudioResource, StreamType, createAudioPlayer, AudioPlayerStatus, NoSubscriberBehavior, generateDependencyReport, getVoiceConnection } = require("@discordjs/voice");

const recorder = require('node-record-lpcm16');

// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');

/**
 * TODO(developer): Uncomment the following lines before running the sample.
 */
const encoding = 'LINEAR16';
const sampleRateHertz = 16000;
const languageCode = 'ja-JP';

const request = {
  config: {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
  },
  interimResults: false, // If you want interim results, set this to true
};


client.on('ready', () => {
  console.log('Sukoxa is ready')
})

client.on('messageCreate', async message => {
  if(message.content === '!sjoin') {
    const guild = message.guild
    const vc = message.member.voice.channel;

    if(!vc) {
      return message.reply('ボイスチャンネルに参加してね');
    }

    const connection = joinVoiceChannel({
      guildId: guild.id,
      channelId: vc.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfMute: false,
      selfDeaf: false,
    });

    connection.receiver.speaking.on('start', (userId) => {
        console.log(userId + 'is speaking');
    })

  }
})

client.on('messageCreate', message => {
  if(message.content === '!js') {
    message.reply('jsだよ')
  }
})

client.on('messageCreate', message => {
  if(message.content === '!sleave') {
    const vc = message.member.voice.channel;

    if(!vc) {
      return message.reply('ボイスチャンネルに参加してないよ');
    }

    getVoiceConnection(message.guild.id).destroy();
  }
})

client.login(process.env.TOKEN)