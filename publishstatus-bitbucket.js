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
    console.log('  -u --username            [*] Bitbucket user name. Can use BITBUCKET_USERNAME env variable.');
    console.log('  -l --build-url           [*] Link to the build details.');
    console.log('  -s --status              Build status INPROGRESS|SUCCESSFUL|FAILED. Defaults to SUCCESSFUL.');
    console.log('  -n --build-name          Build ID or name.');
    console.log('  -d --description         Build details description.');
    console.log('  -r --max-retry           Maximum number of retries to post the status in the case of transient failure.');
    console.log('  -h --help                Prints this help message.');
};

const errMessageAndExit = msg => {
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
    // https://docs.microsoft.com/en-us/azure/devops/pipelines/build/variables?view=azure-devops&tabs=yaml
    if (process.env['AGENT_OSARCHITECTURE'])
        return BuilderType.VSTS;

    return BuilderType.UNKNOWN;
};

const tryGetCommitHash = () => {
    const type = recognizeBuildServer();
    if (type === BuilderType.VSTS) {
        return process.env['Build.SourceVersion'];
    }
};

const tryGetBuildStatus = () => {
    const type = recognizeBuildServer();
    if (type === BuilderType.VSTS) {
        return process.env['Agent.JobStatus'];
    }
};

const tryGetConfigurationName = () => {
    const type = recognizeBuildServer();
    if (type === BuilderType.VSTS) {
        return process.env['Build.DefinitionName'] || process.env['Agent.JobName'];
    }
};

const tryGetBuildName = () => {
    const type = recognizeBuildServer();
    if (type === BuilderType.VSTS) {
        return `${tryGetConfigurationName()} - ${process.env['Build.BuildNumber']}`;
    }
};

const tryGetBuildUrl = () => {
    const type = recognizeBuildServer();
    if (type === BuilderType.VSTS) {
        return process.env['Build.BuildUri'];
    }
};

const tryGetDescription = () => {
    const type = recognizeBuildServer();
    if (type === BuilderType.VSTS) {
        // TODO; add build warnings
    }
};

const composeCmdConfig = (arg) => {
    let config = {
        server: arg.b || arg['bitbucket-server'],
        commit: arg.c || arg['commit-hash'] || tryGetCommitHash(),
        username: arg.u || arg['username'] || process.env.BITBUCKET_USERNAME,
        maxRetry: arg.r || arg['max-retry'] || 100,
        payload: {
            state: arg.s || arg['status'] || tryGetBuildStatus() || 'SUCCESSFUL',
            key: arg.p || arg['configuration'] || tryGetConfigurationName(),
            url: arg.l || arg['build-url'] || tryGetBuildUrl()
        }
    };

    if (!config.server) errMessageAndExit('I need Bitbucket base URL to publish the status');
    if (!config.commit) errMessageAndExit('I need git commit hash to publish the status');
    if (!config.username) errMessageAndExit('I need bitbucket username to publish the status');
    if (!config.payload.key) errMessageAndExit('I need build configuration ID to publish the status');
    if (!config.payload.url) errMessageAndExit('I need a link to the build details to publish the status');

    const name = arg.n || arg['build-name'] || tryGetBuildName();
    if (name)
        config.payload.name = name;

    const description = arg.d || arg['description'] || tryGetDescription();
    if (description)
        config.payload.description = description;

    return config;
};

const getAuthorization = (cmdConfig) => {
    const passw = process.env.BITBUCKET_PASSWORD;
    if (!passw)
        errMessageAndExit('I need BITBUCKET_PASSWORD environment variable to publish the status');

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
            if ((resp.statusCode >= 200) && (resp.statusCode < 300)) {
                console.log('Successfully published the status.');
                process.exit(0);
            }

            if (resp.statusCode === 401) {
                errMessageAndExit('Cannot authorize the request. Provide correct Bitbucket credential');
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
