const axios = require("axios");
const fs = require("fs");
axios.get('https://restcountries.eu/rest/v2/all').then(r => {
    let codes = [];
    let countries = {};
    r.data.forEach(c => {
        codes.push(c.alpha3Code);
        countries[c.alpha3Code] = c.name;
    });
    fs.writeFileSync('codes.json', JSON.stringify(codes, null, 2));
    fs.writeFileSync('contries.json', JSON.stringify(countries, null, 2));
})