const DiscordRPC = require('discord-rpc');
const AudioScrobblerAPI = require('./src/AudioScrobblerAPI');
const AlbumProviders = require('./src/AlbumProviders');

const CLIENT_ID = "858518597848268870";

const config = require('./config.json');

const client = new DiscordRPC.Client({ transport: "ipc" });
const audioScrobblerAPI = new AudioScrobblerAPI(config);
const lastFmAlbumProvider = new AlbumProviders.Lastfm(audioScrobblerAPI);

client.on('ready', async () => {
    console.log("RPC Ready");
    audioScrobblerAPI.startListeningEmit();
    audioScrobblerAPI.on('new_listening', async track => {
        console.log(`${config.user} now listening to ${track.artist["#text"]} - ${track.name}`)
        let albumImgUrl = await lastFmAlbumProvider.getTrackAlbum(track);
        console.log(albumImgUrl)
    })
    audioScrobblerAPI.on('stop_listening', () => {
        console.log(`${config.user} is not listening to anything.`)
    })
})
client.emit('ready');
//client.login({ clientId: CLIENT_ID }).catch(console.error);