# Reselect Devtools Extension

> Chrome Extension for debugging Reselect. Used with [reselect-tools](https://github.com/skortchmark9/reselect-tools)

![Screenshot](Screen%20Shot%202017-11-15%20at%203.34.11%20AM.png)


## Installation

Your app must be using [reselect-tools](https://github.com/skortchmark9/reselect-tools) for this to work.

 - from [Chrome Web Store](https://chrome.google.com/webstore/detail/reselect-devtools/cjmaipngmabglflfeepmdiffcijhjlbb);
 - or build it with `npm i && npm run build` and [load the extension's folder](https://developer.chrome.com/extensions/getstarted#unpacked) `./build/extension`;
 - or run it in dev mode with `npm i && npm run dev` and [load the extension's folder](https://developer.chrome.com/extensions/getstarted#unpacked) `./dev`.

## Development

* Run script
```bash
# build files to './dev'
# start webpack development server
$ npm run dev
```
* If you're developing Inject page, please allow `https://localhost:3000` connections. (Because `injectpage` injected GitHub (https) pages, so webpack server procotol must be https.)
* [Load unpacked extensions](https://developer.chrome.com/extensions/getstarted#unpacked) with `./dev` folder.

## Caveat

This is really just an MVP - I still need to write tests and remove cruft from the original [boilerplate](https://github.com/jhen0409/react-chrome-extension-boilerplate). However, its companion library is ready, so I want to get that off the ground and then I'll publish updates to this and productionize it better.

## Boilerplate Cruft

#### React/Redux hot reload

This boilerplate uses `Webpack` and `react-transform`, and use `Redux`. You can hot reload by editing related files of Popup & Window & Inject page.

### Build

```bash
# build files to './build'
$ npm run build
```

### Compress

```bash
# compress build folder to {manifest.name}.zip and crx
$ npm run build
$ npm run compress -- [options]
```

#### Options

If you want to build `crx` file (auto update), please provide options, and add `update.xml` file url in [manifest.json](https://developer.chrome.com/extensions/autoupdate#update_url manifest.json).

* --app-id: your extension id (can be get it when you first release extension)
* --key: your private key path (default: './key.pem')  
  you can use `npm run compress-keygen` to generate private key `./key.pem`
* --codebase: your `crx` file url

See [autoupdate guide](https://developer.chrome.com/extensions/autoupdate) for more information.

### Test

* `test/app`: React components, Redux actions & reducers tests
* `test/e2e`: E2E tests (use [chromedriver](https://www.npmjs.com/package/chromedriver), [selenium-webdriver](https://www.npmjs.com/package/selenium-webdriver))

```bash
# lint
$ npm run lint
# test/app
$ npm test
$ npm test -- --watch  # watch files
# test/e2e
$ npm run build
$ npm run test-e2e
```

## LICENSE

[MIT](LICENSE)
