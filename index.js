const fetch = require('node-fetch');
const DiscordRPC = require('discord-rpc');
const sharp = require('sharp');
const config = require('./config.json');
const clientId = "858518597848268870";
const user = 'tsuuuuki';
const key = config.key;
const audioScrobblerAPI = `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${user}&api_key=${key}&format=json`
const audioScrobblerTrack = (artist, song) => `http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${key}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(song)}&format=json`
const client = new DiscordRPC.Client({ transport: 'ipc' });
let lastRPC = null;
const headers = {
    "content-type": "application/json",
    "authorization": config.authorization
}
const fetchAssetsListHas = async (name) => {
    let assetListReq = await fetch(`https://discord.com/api/v9/oauth2/applications/${clientId}/assets`, {
        headers
    })
    let json = await assetListReq.json();
    console.log(json.filter(asset => asset.name === name).length)
    return json.filter(asset => asset.name === name.toLowerCase()).length === 0;
}
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
                    fetch(audioScrobblerTrack(artist, name)).then(res => res.json()).then(async ({ track }) => {
                        if(!track) track = {} // lazy fuck
			lastRPC = `${artist} ${name}`; // lazy fuck - very importsantto have this before anything otherwirse bad thing will hapen )like uploading the same image 10 times)
                        console.log(track.album)
                        if(track.album) {
                            let imgKey = track.album.title.slice(0,32).replace(/[^A-Za-z0-9]/g, "");
                            let isnotAlreadyInAssetList = await fetchAssetsListHas(imgKey);
                            console.log(isnotAlreadyInAssetList)
                            if(isnotAlreadyInAssetList) {
                                let extension = track.album.image[3]["#text"].split('.')
                                extension = extension[extension.length-1];
                                let imageReq = await fetch(track.album.image[3]["#text"]);
                                let buffer = await imageReq.buffer()
                                let img = await sharp(buffer)
                                    .resize(512, 512).toBuffer();
                                let base64 = `data:image/${extension};base64,${img.toString('base64')}`
    
                                let uploadImageReq = await fetch(`https://discord.com/api/v9/oauth2/applications/${clientId}/assets`, {
                                    headers,
                                    method: "POST",
                                    body: JSON.stringify({
                                        name: imgKey,
                                        type: "1",
                                        image: base64
                                    })
                                })
                                let reqJson = await uploadImageReq.json();
                                console.log(reqJson)
                            } else {
                                console.log('Is already in assets list')
                            }
                            
                        }
                        
                        
                        client.setActivity({
                            details: `${name} ${track.album ? track.album.title !== name ? `(from "${track.album.title}")` : "" : ""}`,
                            state: lastTrack.artist["#text"],
                            largeImageKey: track.album ? track.album.title.slice(0,32).replace(/[^A-Za-z0-9]/g, "").toLowerCase() : "",
                            largeImageText: track.album ? track.album.title : ""
                        }).then(w => console.log(w))
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
