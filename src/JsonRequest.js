const fetch = require('node-fetch');

module.exports = async (url, params) => (await ((await fetch(url, params)).json()))