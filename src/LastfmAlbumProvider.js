/**
 * Last.fm album information provider
 */
module.exports = class LastfmAlbumProvider {
    /**
     * Create a new Last.fm album provider
     * @param {AudioScrobblerAPI} audioScrobblerAPI - Last.fm API Class
     */
    constructor(audioScrobblerAPI) {
        this.audioScrobblerAPI = audioScrobblerAPI;
    }

    /**
     * Gets album information (cover and name) from Last.fm
     * @param {object} track - An object containing a name and artist property to get the information from
     */
    async getTrackAlbum({ name, artist }) {
        
        let trackInfo = (await this.audioScrobblerAPI.request('track.getInfo', {
            track: name,
            artist: artist["#text"]
        })).track
        if(!trackInfo) return null;
        if(trackInfo.album) return {
            imgUrl: trackInfo.album.image[3]["#text"],
            name: trackInfo.album.title
        }
        
    }
}