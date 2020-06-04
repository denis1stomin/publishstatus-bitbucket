# Publish build status to Bitbucket [![Known Vulnerabilities](https://snyk.io/test/github/denis1stomin/publishstatus-bitbucket/badge.svg?targetFile=package.json)](https://snyk.io/test/github/denis1stomin/publishstatus-bitbucket?targetFile=package.json)
Simple NodeJs command line application to publish commit status to Bitbucket (Atlassian Stash).

https://www.npmjs.com/package/publishstatus-bitbucket

## Install locally and run the command using npx command
- npm install publishstatus-bitbucket
- npx publishstatus-bitbucket

## Install globally and run the command
- npm install -g publishstatus-bitbucket
- publishstatus-bitbucket

## Run the command using the source code
- git clone https://github.com/denis1stomin/publishstatus-bitbucket
- cd publishstatus-bitbucket
- nodejs ./publishstatus-bitbucket.js `or` npm run publish

## Parameters description
To get a full list of parameters run `publishstatus-bitbucket -h`
Below you can find an example for linux command line environment.
This example can be used to publish build status in Azure Pipelines job.

BITBUCKET_SERVER=_your bitbucket server url origin_
BUILD_URI=_url which will be shown in bitbucket common status_
export BITBUCKET_USERNAME=_user name or service principal name_
export BITBUCKET_PASSWORD=_password_

publishstatus-bitbucket -b "$BITBUCKET_SERVER" -c "$(Build.SourceVersion)" -p "$(Build.DefinitionName)" -l "$BUILD_URI" -s "SUCCESSFUL" -n "Azure DevOps / $(Build.DefinitionName) #$(Build.BuildNumber)"
