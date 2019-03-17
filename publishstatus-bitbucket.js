// Bitbucket API description
// https://developer.atlassian.com/server/bitbucket/how-tos/updating-build-status-for-commits/
//
// POST https://<bitbucket-base-url>/rest/build-status/1.0/commits/<commit-hash>
// {
//     "state": "<INPROGRESS|SUCCESSFUL|FAILED>",
//     "key": "<build-key>",
//     "name": "<build-name>",
//     "url": "<build-url>",
//     "description": "<build-description>"
// }


const printHelp = () => {
    console.log('Publish Commit Status to Bitbucket Server (Atlassian Stash)');
    console.log('  -b --bitbucket-server    [*] Butbucket server base URL.');
    console.log('  -h --commit-hash         [*] Target commit hash.');
    console.log('  -c --configuration       [*] Build configuration ID or name.');
    console.log('  -u --build-url           [*] Link to the build details.');
    console.log('  -s --status              Build status INPROGRESS|SUCCESSFUL|FAILED. Defaults to SUCCESSFUL.');
    console.log('  -n --build-name          Build ID or name.');
    console.log('  -d --description         Build details description.');
    console.log('  -r --max-retry           Maximum number of retries to post the status in the case of transient failure.');
    console.log('  -h --help                Prints this help message.');
};

const badArgAndExit = msg => {
    console.log(`ERROR. ${msg}.`);
    console.log('');
    printHelp();
    process.exit(1);
};

const BuilderType = {
    UNKNOWN: 'unknown',
    JENKINS: 'Jenkins',
    VSTS: 'Azure DevOps',
    TEAMCITY: 'TeamCity'
};

const recognizeBuildServer = () => {
    // TODO: use ENV variables
    return BuilderType.UNKNOWN;
};

const composeSelfConfig = (arg) => {
    let config = {
        builder: recognizeBuildServer(),
        server: cmdArg.b || cmdArg['bitbucket-server'],
        commit: cmdArg.h || cmdArg['commit-hash'],
        buildConfig: cmdArg.c || cmdArg['configuration'],
        buildLink: cmdArg.u || cmdArg['build-url'],
        buildStatus: cmdArg.s || cmdArg['status'] || 'SUCCESSFUL',
        buildName: cmdArg.n || cmdArg['build-name'], // || config.buildConfig
        description: cmdArg.d || cmdArg['description'],
        maxRetry: cmdArg.r || cmdArg['max-retry'] || 100
    };

    if (!config.server) badArgAndExit('I need Bitbucket server URL to publish the status');
    if (!config.commit) badArgAndExit('I need git commit hash to publish the status');

    // Check ENV variables like PIPELINE_NAME, configurationName and JenkinsStuff
    if (!config.buildConfig) badArgAndExit('I need build configuration ID to publish the status');
    if (!config.buildLink) badArgAndExit('I need a link to the build details to publish the status');

    return config;
};

const cmdArg = require('minimist')(process.argv.slice(2));

if (cmdArg.h || cmdArg.help) {
    printHelp();
    process.exit(0);
}

const cmdConfig = composeSelfConfig(cmdArg);
console.log(cmdConfig);
process.exit(0);

const postStatus

const https = require('https');

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
