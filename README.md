# Open Badge Publisher for the Credential Engine Registry

An open source Badge Publishing Tool for use by badging systems and Credential Engine as part of its publishing system
to facilitate publishing Open Badge data as CTDL linked data to the Credential Registry.

Timeframe Project start date: September 26, 2022 Project end date: December 31, 2022

## Badge Publisher Software Features

The Badge Publisher Web Application end product will be deployed to IIS for integration with the Credential Engine
Publishing System and available as open source code for other systems capable of hosting an HTML/CSS/JS application.

The Badge Publisher project will also serve the following design goals:

- Compatible with Open Badge Specifications 2.0 and 3.0.
- The Open Badge Publisher Web Application workflow will utilize the Credential Engine’s publishing system.
- Provide initial mock up for review and feedback by CE team members.
- The Open Badge Publisher Web Application will not require client side installation.
- UI will meet Web Content Accessibility Guidelines 2.1 Level AA requirements.
- UI must use responsive design.
- The UI uses styles and colors corresponding to Credential Engine's style guides for
  [Colors](https://zeroheight.com/55756e41a/p/45a1fe-colors) and
  [Typography](https://zeroheight.com/55756e41a/p/70197b-typography)
- The UI will be self documenting to decrease the necessity for separate instructional materials.
- The Open Badge Publisher Web Application will use an URL such as apps.credentialengine.org/badgepublisher and be
  hosted by Credential Engine’s Azure environment that utilizes Windows OS.
- The Open Badge Publisher Web Application will utilize an API Key obtainable through the Credential Registry Publishing
  System for authentication.

## How to run locally

Prerequisites:

- Node.js (v16+)
- NPM

Changing NPM versions
Use nvm
- nvm current - show current versions
  - nvm list
  - nvm list installed - list currently installed on machine
  - nvm list available - list all available ( can use nvm install "version"
- nvm install <version> [arch] : The version can be a specific version, "latest" for the latest current version, or "lts" for the
                                 most recent LTS version. Optionally specify whether to install the 32 or 64 bit version (defaults
- to change current version	
	nvm use 22.2.0
	
Create and customize your `.env` environment settings

1. `cp .env.example .env` Copy environment settings example
2. Update `.env` if necessary

Install the dependencies and then run the application using the vite dev compiler as follows:

```
npm install
npm run dev
```

Access the interface via your browser at http://localhost:5173

## How to build for deployment

Update the `.env` for production, including PUBLIC_BASEURL to the location where the app will run. If you are deploying
to a domain where a publisher instance is running, set `ADAPTER_STATIC="true"`.

```
npm run build
```

Then copy the contents of the resulting `build` directory to the location on your webserver where you plan to run the
application.

Configure your webserver to route requests to the fallback page `200.html` for requests that don't experience an
immediate "hit". See [docs](https://github.com/sveltejs/kit/tree/master/packages/adapter-static#apache) example for
Apache.
