const JsonRequest = require("./JsonRequest");

module.exports = class AudioScrobblerAPI {
    constructor(config={}) {
        if(!config.key) throw new Error("Invalid Last.fm API key");
        this.config = config;
        this.API_URL = `http://ws.audioscrobbler.com/2.0/?format=json&api_key=${config.key}&method=`;
    }

    async request(method, params={}) {
        return (await JsonRequest(this.API_URL + method + this._parseParams(method, params)));
    }

    _parseParams(method, params) {
        if(method.startsWith("user.")) {
            params.user = this.config.user
        }
        return "&" + Object.entries(params)
                .map(param => 
                    `${param[0]}=${encodeURIComponent( param[1] )}`)
                .join('&');
    }
}