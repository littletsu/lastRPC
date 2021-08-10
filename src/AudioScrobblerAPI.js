const JsonRequest = require("./JsonRequest");
const { EventEmitter } = require('events');

const tracksAreEqual = (track1, track2) => {
    if((!track1) || (!track2)) return false;
    let isNameEqual = track1.name === track2.name;
    let isArtistEqual = track1.artist["#text"] === track2.artist["#text"];
    return isNameEqual && isArtistEqual;
}

module.exports = class AudioScrobblerAPI extends EventEmitter {
    constructor(config={}) {
        super();

        if(!config.key) throw new Error("Invalid Last.fm API key");
        this.config = config;
        this.config.fetchInterval = config.fetchInterval || 3000;
        this._lastListeningTrack = null;
        this.API_URL = `http://ws.audioscrobbler.com/2.0/?format=json&api_key=${config.key}&method=`;
    }

    async _getUserListeningTrack(user=null) {
        let lastTrack = (await this.request('user.getrecenttracks', { user })).recenttracks.track[0];
        return lastTrack["@attr"] ? lastTrack["@attr"].nowplaying === "true" ? lastTrack : null : null;
    }

    startListeningEmit() { 
        let getUserRecentTracksInterval = async () => {
            let userListeningTrack = await this._getUserListeningTrack();
            if(!tracksAreEqual(userListeningTrack, this._lastListeningTrack)) {
                this._lastListeningTrack = userListeningTrack;
                this.emit('new_listening', userListeningTrack);
            }
        }
        getUserRecentTracksInterval();
        setInterval(getUserRecentTracksInterval, this.config.fetchInterval);
    }
    // http stuff
    async request(method, params={}) {
        return (await JsonRequest(this.API_URL + method + this._parseParams(method, params)));
    }

    _parseParams(method, params) {
        if(method.startsWith("user.") && (!params.user)) {
            params.user = this.config.user
        }
        return "&" + Object.entries(params)
                .map(param => 
                    `${param[0]}=${encodeURIComponent( param[1] )}`)
                .join('&');
    }
}