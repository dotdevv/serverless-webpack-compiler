# Serverless Webpack Compiler

Plugin for [Serverless](https://serverless.com) which enables webpack compilers during deployment routine.

### Install

This package is private and requires access to the `@dotdev` organization to install.

```bash
yarn add -D @dotdev/serverless-webpack-compiler
```

### Usage

Configure `serverless.yml` plugins, options & excludes.

```yaml
plugins:
  - "@dotdev/serverless-webpack-compiler"

package:
  exclude:
    - "./node_modules/.bin/**" # Optional
    - "./node_modules/.cache/**" # Optional

custom:
  serverless-webpack-compiler:
    configuration: "webpack.config.js" # Relative path to webpack configuration.
    outputDirectory: "package" # Relative webpack output directory.
```

Configure `webpack.config.js` options.

```js
const WebpackPluginServerless = require("@dotdev/serverless-webpack-compiler");

module.exports = {
  entry: WebpackPluginServerless.webpackEntry,
  output: WebpackPluginServerless.webpackOutput,
};
```

#### Yarn Workspaces

Configure `package.json` dependency hoisting.

```json
{
  "workspaces": {
    "nohoist": [
      "**/*"
    ]
  },
}
```
