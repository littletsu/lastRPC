const fetch = require('node-fetch');
const DiscordRPC = require('discord-rpc');
const config = require('./config.json');
const clientId = "858518597848268870";
const user = 'tsuuuuki';
const key = config.key;
const audioScrobblerAPI = `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${user}&api_key=${key}&format=json`
const audioScrobblerTrack = (artist, song) => `http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${key}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(song)}&format=json`
const client = new DiscordRPC.Client({ transport: 'ipc' });
let lastRPC = null;
const update = () => {
    fetch(audioScrobblerAPI).then(res => res.json()).then(json => {
        
        console.log(`Updating from ${json.recenttracks["@attr"].user}`)
        let lastTrack = json.recenttracks.track[0];
        if(lastTrack["@attr"]) {
            if(lastTrack["@attr"].nowplaying == 'true') {
                let artist = lastTrack.artist["#text"];
                let name = lastTrack.name;
                //console.log(lastRPC)
                console.log(`${json.recenttracks["@attr"].user} is scrobbling ${encodeURIComponent(artist)} - ${encodeURIComponent(name)}`)
                if(lastRPC !== `${artist} ${name}`) {
                    fetch(audioScrobblerTrack(artist, name)).then(res => res.json()).then(({ track }) => {
                        console.log(track.album)
                        lastRPC = `${artist} ${name}`; // lazy fuck
                        client.setActivity({
                            details: `${name} ${track.album ? track.album.title !== name ? `(from "${track.album.title}")` : "" : ""}`,
                            state: lastTrack.artist["#text"],
                            /*startTimestamp: new Date(),
                            endTimestamp: new Date().getTime() + (Number(track.duration)*1000),*/
                            instance: false
                        });
                        console.log("Updated presence")
                    })
                } else {
                    console.log("No need to update presence, user is scrobbling same song");
                }
                
                
            } else {
		lastRPC = null;
                console.log("User is not scrobbling anything.")
                client.clearActivity();
            }
        } else {
	    lastRPC = null;
            console.log("User is not scrobbling anything.")
            client.clearActivity();
        }
    })
}

client.on('ready', () => {
    console.log('RPC Ready')
    update();
    setInterval(update, 3000)
})

client.login({ clientId }).catch(console.error);
