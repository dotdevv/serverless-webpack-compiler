import { Serverless } from "./serverless";
import { Compiler } from "./compiler";
import * as Glob from "glob";
import * as Path from "path";

export class ServerlessWebpackCompiler {

  public static webpackEntry: {
    [key: string]: string;
  };
  public commands: Serverless.CommandMap = {
    webpack: {
      commands: {
        build: {
          lifecycleEvents: [ "compile" ],
        },
      },
    },
  };

  public hooks: { [key: string]: any } = {
    "before:offline:start": this.beforeOfflineWatchCompile.bind(this),
    "before:webpack:build:compile": this.beforeWebpackBuildCompile.bind(this),
    "before:package:createDeploymentArtifacts": this.beforeWebpackBuildCompile.bind(this),
  };

  public options: ServerlessWebpackCompiler.Options;

  constructor(
    private serverless: any,
  ) {
    this.options = serverless.service.custom["serverless-webpack-compiler"] || {
      configuration: "webpack.config.js",
    };
  }

  public resolveWebpackEntry = (): { [key: string]: string } => {
    const handlers: Array<string> = this.serverless.service.getAllFunctions();

    return handlers.reduce((webpackEntry, handlerName) => {
      const handlerData = this.serverless.service.getFunction(handlerName);
      const handlerFilename = Glob.sync(`${handlerData.handler.split(".")[0]}.*`, {
        cwd: this.serverless.config.servicePath,
        nodir: true,
      });

      if (!handlerFilename.length) {
        throw new Error(`Cannot find file for "${handlerName}"`);
      }

      return {
        ...webpackEntry,
        [handlerName]: Path.resolve(handlerFilename[0]),
      };
    }, {});
  }

  public configureServerlessFunctions = (): void => {
    for (const handler of Object.keys(this.serverless.service.functions)) {
      this.serverless.service.functions[handler].handler = `.serverless/webpack/${handler}.handler`;
    }
  }

  public beforeOfflineWatchCompile(): void {
    ServerlessWebpackCompiler.webpackEntry = this.resolveWebpackEntry();

    this.configureServerlessFunctions();

    const config = Compiler.loadConfig(this.options.configuration);
    const compiler = new Compiler(config, this.serverless.cli.log.bind(this.serverless.cli));

    compiler.watch();
  }

  public async beforeWebpackBuildCompile(): Promise<void> {
    ServerlessWebpackCompiler.webpackEntry = this.resolveWebpackEntry();

    this.configureServerlessFunctions();

    const config = Compiler.loadConfig(this.options.configuration);
    const compiler = new Compiler(config, this.serverless.cli.log.bind(this.serverless.cli));

    await compiler.build();
  }
}

export namespace ServerlessWebpackCompiler {
  export interface Options {
    configuration: string;
  }
}
