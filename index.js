const fs = require("fs");
const axios = require("axios");
const countries = require('./contries.json');
const config = require('./config.json');
const codes = JSON.parse(fs.readFileSync('codes.json', 'utf-8'));
const template = fs.readFileSync('./README.template.md', 'utf-8');

async function generateReadme() {
    const code = codes[Math.floor(Math.random() * codes.length)];
    const r = await axios.get('https://restcountries.eu/rest/v2/alpha/' + code);
    const info = r.data;
    let readme = replaces(template, {
        LAST_UPDATE: new Date().toLocaleString('fr-FR'),
        NAME: info.name,
        POPULATION: numberWithCommas(info.population),
        CAPITAL: info.capital,
        REGION: info.region,
        LANGUAGES: info.languages.map(l => l.name).join(', '),
        AREA: numberWithCommas(info.area),
        NEIGHBORING_COUNTRIES: info.borders.map(c => countries[c]).join(', '),
        TIMEZONES: info.timezones.join(', '),
        FLAG: info.flag
    });
    fs.writeFileSync('./README.md', readme);
    await commit(readme);
    console.log(`[${new Date().toLocaleTimeString('fr-FR')}] updating README :
name : ${info.name}
population : ${numberWithCommas(info.population)}
capital : ${info.capital}
region : ${info.region}
languages : ${info.languages.map(l => l.name).join(', ')}
area : ${numberWithCommas(info.area)}
borders : ${info.borders.map(c => countries[c]).join(', ')}
timezones : ${info.timezones.join(', ')}
flag url : ${info.flag}`);
}
function replaces(text, options) {
    for (const key in options) {
         text = text.replace(`{{${key}}}`, options[key]);
    }
    return text;
}
function numberWithCommas(x) {
    let parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    return parts.join(".");
}
async function commit(readme) {
    // thx to https://stackoverflow.com/questions/11801983/how-to-create-a-commit-and-push-into-repo-with-github-api-v3
    const repo = config.repo;
    const github = axios.create({
        headers: {
            "Accept": "application/vnd.github.v3+json",
            "Authorization": "token "+ config.token
        },
        baseURL: `https://api.github.com/repos/${repo}`
    });
    let response = await github.get('');
    const branch = response.data['default_branch'];

    response = await github.get(`/branches/${branch}`);
    const lastCommitSha = response.data['commit']['sha'];
    response = await github.post('/git/blobs', {
        content: readme,
        encoding: "utf-8"
    });
    const blobSha = response.data['sha'];
    response = await github.post('git/trees', {
        base_tree: lastCommitSha,
        tree: [
            {
                path: 'README.md',
                mode: '100644',
                type: 'blob',
                sha: blobSha
            }
        ]
    });
    const treeSha = response.data['sha'];
    response = await github.post('/git/commits', {
        message: 'update country',
        parents: [lastCommitSha],
        tree: treeSha
    })
    const commitSha = response.data['sha'];
    response = await github.post('/git/refs/heads/' + branch, {
        ref: "refs/heads/" + branch,
        sha: commitSha
    });
}
generateReadme();
setInterval(generateReadme, 1000 * 60 * 60);


