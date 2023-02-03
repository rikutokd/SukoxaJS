const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const prism = require('prism-media');

const client = new Client ({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ],
})

require('dotenv/config')

const ytdl = require('ytdl-core');

var Youtube = require('youtube-node');

var limit = 1;

var items;
var item;
var title;
var id;
var URL;

let isPlaying = false;

const { joinVoiceChannel, createAudioResource, StreamType, createAudioPlayer, AudioPlayerStatus, getVoiceConnection, EndBehaviorType} = require("@discordjs/voice");

const recorder = require('node-record-lpcm16');

// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');

const speechClient = new speech.SpeechClient();

/**
 * TODO(developer): Uncomment the following lines before running the sample.
 */
const encoding = 'LINEAR16';
const sampleRateHertz = 16000;
const languageCode = 'ja-JP';


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

    message.reply('!shelpでスコッサの使い方を知る事を推奨');

    const connection = joinVoiceChannel({
      guildId: guild.id,
      channelId: vc.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfMute: false,
      selfDeaf: false,
    });

    const receiver = connection.receiver;

    receiver.speaking.on('start', async (userId) => {
      const voiceStream = receiver.subscribe(userId, { 
        end: {
          behavior: EndBehaviorType.AfterSilence,
          duration: 1000,
        }
      })

      let decoder = new prism.opus.Decoder({ 
        channels: 2, 
        rate: 48000, 
        frameSize: 960 
      });
      
      const filename = `./recordings/${Date.now()}-${userId}.pcm`;

      console.log(`👂 Started recording ${filename}`);
      const writer = voiceStream.pipe(decoder).pipe(fs.createWriteStream(`${filename}`));

      writer.on("finish", () => {
        const content = fs.readFileSync(filename).toString('base64');

        const request = {
          config: {
            encoding: encoding,
            sampleRateHertz: sampleRateHertz,
            languageCode: languageCode,
          },
          interimResults: false, // If you want interim results, set this to true
          audio: {
            "content": content,
          }
        };
      
        // Detects speech in the audio file
        const response = speechClient.recognize(request);
        const transcription = response.results

        console.log('Transcription: ', transcription);
      })

      //startRecognizeStream(guild, connection, filename);
    })

  }
})

client.on('messageCreate', message => {
  if(message.content === '!shelp') {
    message.reply('!sjoin : ボイスチャンネルに参加して再生したい曲のタイトルを聞く状態になるよ。「誰誰の△△」だと尚、流したい曲が流せる' + "\n"
    + '！注意 音楽再生中は音声認識が止まっているよ' + "\n"
    + '曲を止めるか再生が終わると自動でタイトルを聞く状態になるよ' + "\n"
    + 'ボイスチャンネルから蹴る → !sleave or 「(スコッサ) ディスコネクト」って言う' + "\n"
    + '曲を止めたい時 → !stop'
    )
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

client.on('messageCreate', message => {
  if(message.content === '!stop') {
    const guild = message.guild
    const vc = message.member.voice.channel;
    
    if(!vc) {
      return message.reply('ボイスチャンネルに参加してないよ');
    }

    if(isPlaying == false){
      console.log('再生中じゃないよ');
      return
    }

    const connection = joinVoiceChannel({
      guildId: guild.id,
      channelId: vc.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfMute: false,
      selfDeaf: false,
    });

    const player = createAudioPlayer();
    connection.subscribe(player);  
    player.stop();
    isPlaying = false;

    const receiver = connection.receiver;

    receiver.speaking.on('start', (userId) => {
      startRecognizeStream(guild, connection, filename);
    })

  }
})


client.login(process.env.TOKEN)

setInterval(() => {
  console.log('isPlaying : ' + isPlaying);
}, 10000);

async function startRecognizeStream(guild,connection, filename) {
  if(isPlaying == true) {
      return
    }

    // if (data.results[0] && data.results[0].alternatives[0]) {
    //   //音声認識が継続した場合を考慮して、最新の認識結果のみを取得
    //   let i = data.results.length;
    //   let stdoutText = data.results[i].alternatives[0].transcript;

    //   console.dir(stdoutText, { depth: null });

    //   var pattern = new RegExp('ディスコネクト');
    //   let doDisconnect = pattern.test(stdoutText);

    //   if (doDisconnect == true) {
    //     console.log('disconnectします')
    //     getVoiceConnection(guild.id).destroy();
    //   }

    //   const suffix = ['かけて','流して','聞かせて','ながして'];

    //   var array = [];

    //   for (let i = 0; i < suffix.length; i++) {
    //     var pattern = new RegExp(suffix[i]);
    //     array.push(pattern.test(stdoutText));
    //     stdoutText = stdoutText.replace(suffix[i],'');
    //   }

    //   var result = false;
    //   array.forEach(function(element){
    //     if(element == true){
    //       console.log('検索します')
    //       result = true;
    //     }
    //   });

    //   if (result == true) {
    //     recognizeStream.end();
    //     console.log('検索値 : ' + stdoutText);

    //     var youtube = new Youtube();
    //     youtube.setKey(process.env.ytAPIKey);

    //     youtube.addParam('order', 'viewCount');
    //     youtube.addParam('type', 'video');
    //     youtube.addParam('regionCode', 'JP');

    //     youtube.search(stdoutText, limit, function(err, result) {
    //       if (err) { console.log(err); return; }
    //       items = result["items"];
    //       for (var i in items) {
    //           item = items[i];
    //           title = item["snippet"]["title"];
    //           id = item["id"]["videoId"];
    //           URL = "https://www.youtube.com/watch?v=" + id;

    //           console.log("title : " + title);
    //           console.log("URL : " + URL);
    //           console.log("-------------------------------");
    //       }

    //       if (!URL) {
    //         console.log('検索がヒットしませんでした')
    //         return
    //       }

    //       const player = createAudioPlayer();     
    //       connection.subscribe(player);

    //       const stream = ytdl(ytdl.getURLVideoID(URL), {
    //         filter: format => format.audioCodec === 'opus' && format.container === 'webm', //webm opus
    //         quality: 'highest',
    //         highWaterMark: 32 * 1024 * 1024, // https://github.com/fent/node-ytdl-core/issues/902
    //       });

    //       const resource = createAudioResource(stream, {
    //         inputType: StreamType.WebmOpus
    //       });

    //       // 再生
    //       player.play(resource);
    //       player.on(AudioPlayerStatus.Playing, () => {
    //         console.log('Sukoxa has started playing!');
    //         isPlaying = true;
    //       });
    //       player.on(AudioPlayerStatus.Idle, () => {
    //         console.log('Sukoxa is idle.');
    //         isPlaying = false;
    //       });
    //     })
    //   }else if(result == false){
    //     console.log('検索しません')
    //   }
    // }
  
}