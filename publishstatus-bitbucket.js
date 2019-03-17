const https = require('https');

const args = process.argv.slice(2);

// https://<bitbucket-base-url>/rest/build-status/1.0/commits/<commit-hash>
// {
//     "state": "<INPROGRESS|SUCCESSFUL|FAILED>",
//     "key": "<build-key>",
//     "name": "<build-name>",
//     "url": "<build-url>",
//     "description": "<build-description>"
// }

// --bitbucket-base-url    -b
// --commit-hash           -c
// --status                -s
// Check ENV variables like PIPELINE_NAME, configurationName and JenkinsStuff
// --configuration-id      -k
// --build-url             -u
// --build-name            -n
// --description           -d


https.get('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY', resp => {
    let data = '';

    // A chunk of data has been recieved.
    resp.on('data', (chunk) => {
        data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
        console.log(JSON.parse(data).explanation);
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
