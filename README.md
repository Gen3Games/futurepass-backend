# FuturePass

## Introduction

Futureverse is an NX monorepo that combines multiple projects to provide a comprehensive web3 experience. This repository includes three main applications:

- **Identity Provider Backend**: An implementation of a standard OpenID server, offering endpoints such as auth, token, and more.
- **Identity Provider Frontend**: A React-based front-end application providing a user interface for interactions, such as terms and conditions, two-factor authentication, etc.
- **Custodial Singer**: A Next.js application that offers web3 signing services for custodial accounts.

In addition to these applications, the repository contains two core libraries:

- **Experience SDK**: [Read more](libs/experience-sdk/README.md)
- **React SDK**: [Read more](libs/react-sdk/README.md)

Othere libraries include:

- **identity-contract-bindings**: [Read more](libs/identity-contract-bindings/README.md)
- **oidc-client**: [Read more](libs/oidc-client/README.md)
- **rpc-kit**: [Read more](libs/rpc-kit/README.md)
- **staboss**: [Read more](libs/staboss/README.md)
- **passport-tiktok**: [Read more](libs/passport-tiktok/README.md)

## Publishing libraries workflow

1. When a PR is merged into the main branch, a GitHub action will be triggered. It will compare the new changes in the main branch with the last tag, i.e., react-sdk-1.1.6.
2. It will check every commit and evaluate if there were changes in the library directory.
3. If there were changes, it will determine the next release version as major, minor, or patch.
4. It will generate the release notes based only on the commits that made changes in the library directory.
5. It will generate a changelog in lib/<PACKAGE_NAME>/CHANGELOG.md using the same logic as the release notes.
6. It will update the package version in the library and in the dist directory.
7. It will publish the package from the dist directory.
8. It will commit the new changelog and package.json changes.
9. It will add some PR comments to let the team know which PRs are included in the release.

> [!NOTE]
> The pipeline ignores commits that include [skip ci] to avoid triggering the pipeline when the bot increases the library version.

## Installation

After cloning the project from the GitHub repository, run the following command to install:

```bash
pnpm install
```

## Local DynamoDB-Compatible Storage

Local development now uses ScyllaDB Alternator instead of LocalStack. The backend still talks to a DynamoDB-compatible HTTP API, but the local stack is self-hosted and matches the migration target more closely.

1. Start the local stack with `pnpm dev:identity-provider-backend`
2. Alternator will be exposed at `http://localhost:8000`
3. The `scylla-bootstrap` job creates the required tables and GSIs automatically

## Dependencies

The applications within the project rely on the functionalities and resources provided by the libraries section.

## Contributing

### Commits

The FuturePass monorepo follows conventional commits and improperly described commits will not be accepted. The same goes for unsigned commits.

To automate the process use either the `Conventional Commits` VS Code plugin or `pnpm commit` to do the same from the console.

There should be no JIRA ticket number references in the commits. The scope field of each commit should represent the sub-part of the monorepo that was affected, in a shortened version following the mapping below:

- `identity-provider-backend` -> `idp-b`
- `identity-provider-frontend` -> `idp-f`
- `custodial-signer` -> `cs`
- `experience-sdk` -> `e-sdk`
- `react-sdk` -> `r-sdk`
- `identity-contract-bindings` -> `icb`
- `rpc-kit` -> `rpc-k`
- `stateboss` -> `sb`
- `oidc-client` -> `oidc-c`
- `nx-tools` -> `nx-t`
- `passport-tiktok` -> `pt`
- `common` -> `common`

Additionally, a special scope of `fp` can be used when changes are made at the top-level of the monorepo (e.g. changes to this README file or the configuration of NX). It should be used sporadically.

If a commit would need to include multiple scopes, it must be divided into smaller commits.

### Branches

The branch names should be copied from the `Create Branch` field of Jira tickets.

## Running Identity Provider locally

Use the `pnpm dev:identity-provider-backend` to run the backend. This script automatically builds and bundles the IDP-F. If you want to run frontend with a different than default configuration, modify the `./apps/identity-provider-backend/startup.sh` file (`--configuration` option).

Due to the fact that `/dist` folder is mounted into the container, any command that causes the contents of the `/dist` folder to change will affect the development experience.

For example, `pnpm build:all` builds the Identity Provider Backend and Frontend with the production configuration, meaning that running that command will cause that the production hCaptcha site key to be used in local development.

## Identity Provider Deployment

When deploying the Identity Provider Backend the currently-built Identity Provider Frontend is bundled up with is.

1. `pnpm buld:all`
2. (optional if you want to build Frontend with a specific configuration) `pnpm exec nx build identity-provider-frontend --configuration=[preview | neptune | staging | audit | prod]`
3. `aws-vault exec fv-identity-[dev | neptune | staging | audit | production] -- pnpm publish:identity-provider-backend`
4. `cd apps/identity-provider-backend/terraform/[preview | neptune | staging | audit | production]/us-west-2`
5. (only if it's your first deployment) `aws-vault exec fv-identity-[dev | neptune | staging | audit | production] -- terraform init`
6. `aws-vault exec fv-identity-[dev | neptune | staging | audit | production] -- terraform apply`

## Local Development of Libraries

The easiest and most reliable way is to use [yalc](https://github.com/wclr/yalc).

Install it with `npm i yalc -g`, then follow the steps:

1. Make sure `futurepass` and `fv-identity-monorepo` are cloned in a same parent directory.
2. `cd futurepass`
3. Run `./run-dashboard.sh` this will build all libraries and install them up into dashboard and start the dashboard.
4. Follow the steps in [Running Identity Provider locally](#running-identity-provider-locally)

## Publishing

1. Manually update the version number in `package.json` files for all the affected libs
2. (If you're publishing `react-sdk` or `experience-sdk` packages) Run `pnpm run publish-lib <LIB NAME>` (Notes: Valid library names are `react-sdk`, `experience-sdk`.)
3. (If you're publishing any other library) Run `rm -rf dist && pnpm build:all` to build all the libs, then `cd` into the built library's folder inside `dist` and run `npm publish`.

### Publishing to Beta Private Registry

It is crucial that only tested and reviewed code makes its way to the public NPM registry. Any version with `beta` in it will be published to the Beta Private GitHub registry to avoid confusion and releasing buggy SDKs. This is handled automatically by the publishing scripts.

#### Setting up access for FuturePass Beta Private Registry

1. Create a new GitHub Personal Access Token (classic) by going to GitHub Settings -> Developer Settings -> Personal access tokens. If you're a FuturePass developer your token needs to have `write:packages` and `read:packages` scopes. If you're a consumer of the package, use `read:packages` only. Avoid creating tokens without expiration.

2. Create your own `.npmrc.private` with the following content:

```
//npm.pkg.github.com/:_authToken=<TOKEN>
registry=https://npm.pkg.github.com
```

3. To install the packages from the private registry, authenticate with Github registry using the generated token.

```
npm login --scope=futureversecom --auth-type=legacy --registry=https://npm.pkg.github.com
> Username: USERNAME
> Password: TOKEN

```

#### Installing a beta version

Use the following package name `@futureverse/react@npm:@futureversecom/react@<VERSION>`, e.g.:

```json
  "@futureverse/react@npm:@futureversecom/react": "1.1.2-beta.2",
```

## Custodial Accounts Transactions

This section provides detailed information on the transaction process for custodial accounts, including step-by-step procedures, error handling, and security measures.

### Detailed Steps:

1. **Initiation**: The user sends a signing request from the client-side dashboard (or any integrated experience client) to the Custodial Signer.
2. **Authentication**: The Custodial Signer receives the request and uses next-auth to verify the JWT included in the request, confirming the user's identity. The user is then prompted to confirm the signing request.
3. **Transaction Payload Creation**: The Custodial Signer creates the transaction payload based on the user's request and sends it to the Foundation Vault Signer API, which is deployed as an AWS Lambda function.
4. **Secure Communication**: The Foundation Vault Signer establishes an mTLS connection with the Custodial Auth server (deployed in an Enclave environment on EC2) and forwards the signing request.
5. **Signature Generation**: The Custodial Auth server processes the signing request and returns the signed transaction to the Foundation Vault Signer, which then forwards it back to the Custodial Signer and finally to the client.
6. **Transaction Completion**: Upon receiving the signed transaction, the server submits it to the appropriate blockchain, completing the transaction.

### Error Handling and Exception Management

If any errors occur during the signing process, the Custodial Signer throws exceptions. If the client uses our SDK, the SDK will catch these exceptions and display them to the user on the client side.

### Security Measures

The security of Custodial Accounts during transactions is ensured through several measures:

1. **JWT Authentication**: Requests from the client to the Custodial Signer include a specific JWT, which has a time limit and is generated by our dedicated OIDC server.
2. **Authorization Header Verification**: Requests from the Custodial Signer to the Foundation Vault Signer include an authorization header. The Foundation Vault Signer verifies the issuer of the request. These issuers are stored in a DynamoDB table, and if not found, the Foundation Vault Signer will refuse the service.
3. **mTLS and Enclave Environment**: Communication from the Foundation Vault Signer to the Custodial Auth server involves mTLS connections. All signing processes occur within a VPC, with the Custodial Auth server deployed in an EC2 Enclave environment, ensuring complete isolation and security.

## Futurepass CDN

## Domains:

- Dev: https://cdn.passonline.dev
- Staging: https://cdn.passonline.cloud
- Neptune: https://cdn.passonline.red
- Prod: https://cdn.pass.online

### S3 File tructure

```
- futurepass
  - a5439018-64cb-4b00-9a50-8cda0b433ce5 // customer id
    - assets
      - manifest.json // contains a list of all the files
      - images
        - background.png
        - ...
      - fonts
        - EduAUVICWANTHand-Bold.ttf
        - ...
      - content
        - content.json
        - ...
```

Example: https://cdn.passonline.dev/futurepass/a5439018-64cb-4b00-9a50-8cda0b433ce5/assets/manifest.json

## Asset manager

This service provides an easy way to upload customer assets to the Futurepass CDN.

### Usage

1. Update the .env file accordingly, change the cdn domain and cloudfrount distribution according to the environment.
2. Run the following command locally `aws-vault exec <AWS_PROFILE> -- pnpm exec nx serve asset-manager`, adjust the AWS profile to upload assets to Dev, staging or prod environments.

### Endpoints

Upload assets:

```
POST http://localhost:3000/custumer/<CUSTOMER_ID>/assets

curl --location 'http://localhost:3000/custumer/a5439018-64cb-4b00-9a50-8cda0b433ce5/assets' \
--form 'images=@"/path/to/file"' \
--form 'fonts=@"/path/to/file"' \
--form 'content=@"/path/to/file"'
```

Delete assets.

```
DELETE http://localhost:3000/custumer/<CUSTOMER_ID>/assets

curl --location --request DELETE 'http://localhost:3000/custumer/a5439018-64cb-4b00-9a50-8cda0b433ce5/assets' \
--header 'Content-Type: application/json' \
--data '{
    "fileNames": [
        "images/background_v2.jpeg"
    ]
}'
```

## Auth-Options API Documentation

### Overview

The `Auth-Options` API provides a list of available authentication options. Clients must supply a valid `x-client-id` to retrieve the corresponding authentication options.

#### Request

##### Domains

- Dev: https://login.passonline.dev
- Staging: https://login.passonline.cloud
- Neptune: https://login.passonline.red
- Prod: https://login.pass.online

##### Endpoint

/auth-options

#### HTTP Method

`GET`

#### Headers

| Parameter     | Type   | Required | Description                      |
| ------------- | ------ | -------- | -------------------------------- |
| `x-client-id` | string | Yes      | Unique identifier for the client |

#### Example Requests

##### Successful Request

```bash
curl --location 'http://login.passonline.red/auth-options' \
--header 'x-client-id: 1wV4rphRYo9AZK_Ov_23r'
```

##### Invalid Request

Invalid `x-client-id`

```bash
curl --location 'http://login.passonline.red/auth-options' \
--header 'x-client-id: invalid-client-id'
```

Missing `x-client-id` Header

```bash
curl --location 'http://login.passonline.red/auth-options'
```

#### Response

##### Successful Response

Status Code: `200 OK`

Response Body:

```
[
    {
        "id": "futureverseCustodialGoogle",
        "name": "Google",
        "iconUrls": {
            "white": "https://cdn.passonline.red/custodial-auth-option-icons/google-white.svg",
            "fullcolor": "https://cdn.passonline.red/custodial-auth-option-icons/google-full-color.svg"
        }
    },
    {
        "id": "futureverseCustodialFacebook",
        "name": "Facebook",
        "iconUrls": {
            "white": "https://cdn.passonline.red/custodial-auth-option-icons/facebook-white.svg",
            "fullcolor": "https://cdn.passonline.red/custodial-auth-option-icons/facebook-full-color.svg"
        }
    },
    {
        "id": "futureverseCustodialX",
        "name": "X",
        "iconUrls": {
            "white": "https://cdn.passonline.red/custodial-auth-option-icons/x-white.svg",
            "fullcolor": "https://cdn.passonline.red/custodial-auth-option-icons/x-full-color.svg"
        }
    },
    {
        "id": "futureverseCustodialTikTok",
        "name": "TikTok",
        "iconUrls": {
            "white": "https://cdn.passonline.red/custodial-auth-option-icons/tiktok-white.svg",
            "fullcolor": "https://cdn.passonline.red/custodial-auth-option-icons/tiktok-full-color.svg"
        }
    },
    {
        "id": "futureverseCustodialEmail",
        "name": "Email",
        "iconUrls": {
            "white": "https://cdn.passonline.red/custodial-auth-option-icons/email-white.svg"
        }
    }
]
```

Response Fields:

```
| Field Name           | Type   | Description                                                        |
|----------------------|--------|--------------------------------------------------------------------|
| `id`                 | string | Unique identifier for the authentication option                    |
| `name`               | string | Name of the authentication option (e.g., Google, Facebook)         |
| `iconUrls`           | object | URLs to the authentication option icons                            |
| `iconUrls.white`     | string | URL to the white-themed icon                                       |
| `iconUrls.fullcolor` | string | URL to the full-color icon (may not be available for some options) |
```

##### Error Responses

###### Invalid `x-client-id`

Status Code: `400 Bad Request`

Response Body:

```
{
    "error": {
        "code": 400,
        "message": "Invalid client id"
    }
}
```

###### Missing `x-client-id` Header

Status Code: `400 Bad Request`

Response Body:

```
{
    "error": {
        "code": 400,
        "message": "Missing x-client-id header."
    }
}
```

Error Response Fields:

```
| Field Name      | Type    | Description                     |
| --------------- | ------- | ------------------------------- |
| `error`         | object  | Object containing error details |
| `error.code`    | integer | Error code (e.g., 400)          |
| `error.message` | string  | Detailed error message          |
```

## Contact and Maintainer

- Chris Czurylo [chris.czurylo@futureverse.com](mailto:chris.czurylo@futureverse.com)
- Kingsley Wang [kingsley.wang@futureverse.com](mailto:kingsley.wang@futureverse.com)
- Darpan Patil [darpan.patil@futureverse.com](mailto:darpan.patil@futureverse.com)

## Note

This project is an internal company project and is not open to the public. All code and documentation are intended for internal company use only.
