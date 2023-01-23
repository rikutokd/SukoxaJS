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

const ytdl = require('ytdl-core');

var Youtube = require('youtube-node');

var limit = 1;

var items;
var item;
var title;
var id;
var URL;

let isPlaying = false;

const { joinVoiceChannel, entersState, VoiceConnectionStatus, createAudioResource, StreamType, createAudioPlayer, AudioPlayerStatus, NoSubscriberBehavior, generateDependencyReport, getVoiceConnection} = require("@discordjs/voice");

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

    const receiver = connection.receiver;

    receiver.speaking.on('start', (userId) => {
      if(isPlaying == true) {
        return
      }
        // Create a recognize stream
        const recognizeStream = speechClient
          .streamingRecognize(request)
          .on('error', console.error)
          .on('data', data => {
            process.stdout.write(
              data.results[0] && data.results[0].alternatives[0]
                ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
                : '\n\nReached transcription time limit, press Ctrl+C\n'
            )

            if (data.results[0] && data.results[0].alternatives[0]) {
              let stdoutText = data.results[0].alternatives[0].transcript;

              console.dir(stdoutText, { depth: null });

              const suffix = ['かけて','流して','聞かせて','ながして'];

              var array = [];

              for (let i = 0; i < suffix.length; i++) {
                array.push(stdoutText.match(suffix[i]));
                stdoutText = stdoutText.replace(suffix[i],'');
              }

              var result = false;
              array.forEach(function(element){
                if(element != null){
                  console.log('検索します')
                  result = true;
                }
              });

              if (result == true) {
                recognizeStream.end();
                console.log('検索値 : ' + stdoutText);

                var youtube = new Youtube();
                youtube.setKey(process.env.ytAPIKey);

                youtube.addParam('order', 'viewCount');
                youtube.addParam('type', 'video');
                youtube.addParam('regionCode', 'JP');

                const urls = [];

                youtube.search(stdoutText, limit, function(err, result) {
                  if (err) { console.log(err); return; }
                  items = result["items"];
                  for (var i in items) {
                      item = items[i];
                      title = item["snippet"]["title"];
                      id = item["id"]["videoId"];
                      URL = "https://www.youtube.com/watch?v=" + id;
      
                      console.log("title : " + title);
                      console.log("URL : " + URL);
                      console.log("-------------------------------");

                      urls.push(URL);
                  }

                  console.log(urls[0])

                  const player = createAudioPlayer();     
                  connection.subscribe(player);
    
                  const stream = ytdl(ytdl.getURLVideoID(urls[0]), {
                    filter: format => format.audioCodec === 'opus' && format.container === 'webm', //webm opus
                    quality: 'highest',
                    highWaterMark: 32 * 1024 * 1024, // https://github.com/fent/node-ytdl-core/issues/902
                  });
    
                  const resource = createAudioResource(stream, {
                    inputType: StreamType.WebmOpus
                  });
    
                  // 再生
                  player.play(resource);
                  player.on(AudioPlayerStatus.Playing, () => {
                    console.log('Sukoxa has started playing!');
                    isPlaying = true;
                  });
                  player.on(AudioPlayerStatus.Idle, () => {
                    console.log('Sukoxa is idle.');
                    isPlaying = false;
                  });
                })
              }else if(result == false){
                console.log('検索しません')
              }
            }
          });

        // Start recording and send the microphone input to the Speech API.
        // Ensure SoX is installed, see https://www.npmjs.com/package/node-record-lpcm16#dependencies
        recorder
          .record({
            sampleRateHertz: sampleRateHertz,
            threshold: 0,
            // Other options, see https://www.npmjs.com/package/node-record-lpcm16#options
            verbose: false,
            recordProgram: 'sox', // Try also "arecord" or "sox"
            silence: '10.0',
          })
          .stream()
          .on('error', console.error)
          .pipe(recognizeStream);

          console.log('Listening, press Ctrl+C to stop.');
    })

  }
})

client.on('messageCreate', message => {
  if(message.content === '!shelp') {
    message.reply('!sjoin : ボイスチャンネルに参加して再生したい曲のタイトルを聞く状態になるよ。「誰誰の△△」だと尚、流したい曲が流せる' + "\n"
    + '！注意 音楽再生中は音声認識が止まっているよ' + "\n"
    + '再生が終わると自動でタイトルを聞く状態になるよ' + "\n"
    + 'ボイスチャンネルから蹴りたい時は、テキストチャンネルで !sleave もしくは　「スコッサ　失せろorバイバイ」'
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

client.login(process.env.TOKEN)

setInterval(() => {
  console.log('isPlaying : ' + isPlaying);
}, 10000);