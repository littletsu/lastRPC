const JsonRequest = require("./JsonRequest");
const { EventEmitter } = require('events');

/**
 * Compares 2 track objects obtained from Last.fm API
 * @param {object} track1 - A track object obtained from Last.fm API to compare
 * @param {object} track2 - A track object obtained from Last.fm API to compare
 * @returns Whether the tracks are equal or not
 */
const tracksAreEqual = (track1, track2) => {
    if((!track1) || (!track2)) return false;
    let isNameEqual = track1.name === track2.name;
    let isArtistEqual = track1.artist["#text"] === track2.artist["#text"];
    return isNameEqual && isArtistEqual;
}

/**
 * Class used to make requests and recieve information from Last.fm API
 */
module.exports = class AudioScrobblerAPI extends EventEmitter {
    /**
     * Create a new instance of AudioScrobblerAPI with an unique key and configurations
     * @param {object} config - config.json file containing a valid Last.fm API key
     */
    constructor(config={}) {
        super();

        if(!config.key) throw new Error("Invalid Last.fm API key");
        /**
         * Configuration object used by this class
         * @type {object}
         */
        this.config = config;
        this.config.fetchInterval = config.fetchInterval || 3000;
        this._lastListeningTrack = null;
        this.API_URL = `http://ws.audioscrobbler.com/2.0/?format=json&api_key=${config.key}&method=`;
    }

    /**
     * Get the track an user is currently listening to
     * @param {string} user - User to get listening track from
     * @returns The track the user is listening to, if they are listening to one. Otherwise returns null
     */
    async _getUserListeningTrack(user=null) {
        let lastTrack = (await this.request('user.getrecenttracks', { user })).recenttracks.track[0];
        return lastTrack["@attr"] ? lastTrack["@attr"].nowplaying === "true" ? lastTrack : null : null;
    }

    /**
     * Start emitting new_listening and stop_listening events
     */
    startListeningEmit() { 
        let getUserRecentTracksInterval = async () => {
            let userListeningTrack = await this._getUserListeningTrack();
            if(userListeningTrack == null) { 
                if(this._lastListeningTrack !== null) {
                    // If the user is not listening to anything anymore, 
                    // and the stop_listening event has not been emitted yet 
                    // (or the user just started the program), emit it.
                    this._lastListeningTrack = null;
                    this.emit('stop_listening')
                }
                return;
            };
            if(!tracksAreEqual(userListeningTrack, this._lastListeningTrack)) {
                this._lastListeningTrack = userListeningTrack;
                this.emit('new_listening', userListeningTrack);
            }
        }
        getUserRecentTracksInterval();
        setInterval(getUserRecentTracksInterval, this.config.fetchInterval);
    }

    // http stuff

    /**
     * GET a method from the Last.fm API
     * @param {string} method - A method from the Last.fm API
     * @param {object} params - Query parameters such as user, artist, track, etc..
     * @returns A promise returning a JSON object if the request was successful
     */
    async request(method, params={}) {
        return (await JsonRequest(this.API_URL + method + this._parseParams(method, params)));
    }

    /**
     * Internal function for converting an object to URL safe query parameters
     * @param {string} method - Method from the Last.fm API, used to provide default parameters
     * @param {object} params - Query parameters such as user, artist, track, etc..
     * @returns A string of parameters ready to be requested
     */
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