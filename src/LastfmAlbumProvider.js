module.exports = class LastfmAlbumProvider {
    constructor(audioScrobblerAPI) {
        this.audioScrobblerAPI = audioScrobblerAPI;
    }


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