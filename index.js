const DiscordRPC = require('discord-rpc');
const AudioScrobblerAPI = require('./src/AudioScrobblerAPI');

const CLIENT_ID = "858518597848268870";

const config = require('./config.json');

const client = new DiscordRPC.Client({ transport: "ipc" });
const audioScrobblerAPI = new AudioScrobblerAPI(config);

client.on('ready', async () => {
    console.log("RPC Ready");
    let recentTracks = await audioScrobblerAPI.request('user.getrecenttracks');
    console.log(recentTracks.recenttracks.track[0]);
})
client.emit('ready');
//client.login({ clientId: CLIENT_ID }).catch(console.error);