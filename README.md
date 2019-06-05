# Slug

A snake rip-off built so I could play around with Preact and [@pika/web](https://www.pikapkg.com/blog/pika-web-a-future-without-webpack).

## Run locally

1. Clone this repo
1. Run `npm i`
1. Run `npm run dev` to start a live-reload server

## How it works

We install dependencies with npm (just `preact` and `htm`) like normal. npm will run the `prepare` script in the `package.json` after an `npm install` (with no arguments). This script runs `pika-web`, which will package each dependency into a single ES module file in a `web_modules/` folder.

Since I wanted to be able to import `preact/hooks` I had to configure @pika/web to know exactly what to output into `web_modules/`. This config is in the `package.json`:

```json
"@pika/web": {
  "webDependencies": [
    "htm",
    "preact",
    "preact/hooks"
  ]
}
```

So my final `web_modules` looks like this:

```
├── preact
│   ├── hooks.js
│   └── hooks.js.map
├── htm.js
├── htm.js.map
├── preact.js
└── preact.js.map
```

This allows me to import these dependencies natively in the browser like so:

```
import { h, render } from "./web_modules/preact.js";
import * as Hooks from "./web_modules/preact/hooks.js";
import htm from "./web_modules/htm.js";
```
