# Serverless Webpack Compiler

Plugin for [Serverless](https://serverless.com) which enables webpack compilers during deployment routine.

### Install
```bash
yarn add -D @dotdev/serverless-webpack-compiler
```

### Usage
Add to the list of plugins within `serverless.yml`.

```yaml
plugins:
  - serverless-webpack-compiler
```

Configure options.

```yaml
custom:
  serverless-webpack-compiler:
    configuration: "webpack.config.js" # Relative path to webpack configuration.
```