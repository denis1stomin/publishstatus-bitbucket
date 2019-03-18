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
    console.log('  -c --commit-hash         [*] Target commit hash.');
    console.log('  -p --configuration       [*] Build pipeline configuration ID or name.');
    console.log('  -u --username            [*] Bitbucket user name.');
    console.log('  -l --build-url           [*] Link to the build details.');
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

const composeCmdConfig = (arg) => {
    let config = {
        builder: recognizeBuildServer(),
        server: arg.b || arg['bitbucket-server'],
        commit: arg.c || arg['commit-hash'],
        username: arg.u || arg['username'],
        maxRetry: arg.r || arg['max-retry'] || 100,
        payload: {
            state: arg.s || arg['status'] || 'SUCCESSFUL',
            key: arg.p || arg['configuration'],
            url: arg.l || arg['build-url']
        }
    };

    if (!config.server) badArgAndExit('I need Bitbucket base URL to publish the status');
    if (!config.commit) badArgAndExit('I need git commit hash to publish the status');
    if (!config.username) badArgAndExit('I need bitbucket username to publish the status');

    // Required parameters
    // TODO: Check ENV variables like PIPELINE_NAME, configurationName and JenkinsStuff
    if (!config.payload.key) badArgAndExit('I need build configuration ID to publish the status');
    if (!config.payload.url) badArgAndExit('I need a link to the build details to publish the status');

    const name = arg.n || arg['build-name']; // || config.buildConfig;
    if (name)
        config.payload.name = name;

    const description = arg.d || arg['description'];
    if (description)
        config.payload.description = description;

    return config;
};

const getAuthorization = (cmdConfig) => {
    const passw = process.env.BITBUCKET_USER_PASSWORD;
    if (!passw)
        badArgAndExit('I need BITBUCKET_USER_PASSWORD environment variable to publish the status');

    const token = Buffer.from(`${cmdConfig.username}:${passw}`).toString('base64')
    return `Basic ${token}`;
};

const https = require('https');

const postStatus = (cmdConfig, retryNum) => {

    let req = https.request(`https://${cmdConfig.server}/rest/build-status/latest/commits/${cmdConfig.commit}`, {
            method: 'POST',
            headers: {
                'X-Atlassian-Token': 'no-check',
                'Content-Type': 'application/json',
                'Authorization': getAuthorization(cmdConfig)
            }
        },
        resp => {
            if (resp.statusCode === 204) {
                console.log('Successfully published the status.');
                process.exit(0);
            }

            if (resp.statusCode === 401) {
                badArgAndExit('Cannot authorize the request. Provide correct Bitbucket credential');
            }

            retryNum = retryNum + 1;
            if (retryNum > cmdConfig.maxRetry) {
                console.log(`Couldn't publish the status after ${maxRetry} retries.`);
                console.log(`Response status code ${resp.statusCode}`);

                let data = '';
                // A chunk of data has been recieved.
                resp.on('data', (chunk) => {
                    data += chunk;
                });
                // The whole response has been received. Print out the result.
                resp.on('end', () => {
                    console.log('Response body:');
                    console.log(data);

                    // Let's retry one more time
                    //console.log('TODO: message about next retry');
                    //postStatus(cmdConfig, retryNum);
                });
            } else {
                // Let's retry one more time
                //console.log('TODO: message about next retry');
                //postStatus(cmdConfig, retryNum);
            }

        }).on('error', (err) => {
            console.log('ERROR: ' + err.message);
            // Let's retry one more time
            //console.log('TODO: message about next retry');
            //postStatus(cmdConfig, retryNum);
        });
    
    req.write(JSON.stringify(cmdConfig.payload));
    req.end();
};

const doTheJob = () => {
    const cmdArg = require('minimist')(process.argv.slice(2));

    if (cmdArg.h || cmdArg.help) {
        printHelp();
        process.exit(0);
    }

    const cmdConfig = composeCmdConfig(cmdArg);
    postStatus(cmdConfig, 1);
};

doTheJob();
