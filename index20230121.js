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

const { Player, QueryType } = require("discord-player");
const myPlayer = new Player(client);

const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const app = express();

const refreshToken = process.env.refreshToken;
const clientId = process.env.clientId;
const clientSecret = process.env.clientSecret;
const redirectUri =  process.env.redirectUri;

const spotifyApi = new SpotifyWebApi({
  refreshToken: refreshToken,
  clientId: clientId,
  clientSecret: clientSecret,
  redirectUri: redirectUri
});

var scopes = [
  'ugc-image-upload',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'app-remote-control',
  'user-read-email',
  'user-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-read-private',
  'playlist-modify-private',
  'user-library-modify',
  'user-library-read',
  'user-top-read',
  'user-read-playback-position',
  'user-read-recently-played',
  'user-follow-read',
  'user-follow-modify'
];

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
  
  app.get('/login', (req, res) => {
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
  });
  
  app.get('/callback', (req, res) => {
    const error = req.query.error;
    const code = req.query.code;
    const state = req.query.state;
  
    if (error) {
      console.error('Callback Error:', error);
      res.send(`Callback Error: ${error}`);
      return;
    }
  
    spotifyApi
      .authorizationCodeGrant(code)
      .then(data => {
        const access_token = data.body['access_token'];
        const refresh_token = data.body['refresh_token'];
        const expires_in = data.body['expires_in'];
  
        spotifyApi.setAccessToken(access_token);
        spotifyApi.setRefreshToken(refresh_token);
  
        console.log('access_token:', access_token);
        console.log('refresh_token:', refresh_token);
  
        console.log(
          `Sucessfully retreived access token. Expires in ${expires_in} s.`
        );
        res.send('Success! You can now close the window.');
  
        setInterval(async () => {
          const data = await spotifyApi.refreshAccessToken();
          const access_token = data.body['access_token'];
  
          console.log('The access token has been refreshed!');
          console.log('access_token:', access_token);
          spotifyApi.setAccessToken(access_token);
        }, expires_in / 2 * 1000);
      })
      .catch(error => {
        console.error('Error getting Tokens:', error);
        res.send(`Error getting Tokens: ${error}`);
      });
  });
  
  app.listen(8888, () =>
    console.log(
      'HTTP Server up. Now go to http://localhost:8888/login in your browser.'
    )
  );

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

              const suffix = ['かけて','流して','聞かせて'];

              for (let i = 0; i < suffix.length; i++) {
                stdoutText = stdoutText.replace(suffix[i],'');
              }

              spotifyApi.searchTracks(stdoutText)
              .then(function(data){
                let t = data.body.tracks.items[0]['uri'].replace('spotify:track:', '');
                let playURL = 'https://open.spotify.com/track/' + t;

                console.log(playURL);

                const player = createAudioPlayer();
                connection.subscribe(player);

                const resource = createAudioResource(playURL);
                
                player.play(resource);

              })
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