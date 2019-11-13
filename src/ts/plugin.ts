import { Serverless } from "./serverless";
import { Compiler } from "./compiler";
import * as Glob from "glob";
import * as Path from "path";

export class ServerlessWebpackCompiler {
  public static webpackEntry: {
    [key: string]: string;
  };
  public static webpackOutput: {
    libraryTarget: string;
    path: string;
    filename: string;
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
    this.options = {
      configuration: "webpack.config.js",
      outputDirectory: "package",
      ...serverless.service.custom["serverless-webpack-compiler"],
    };
  }

  public configureWebpack = (): void => {
    this.configureWebpackEntry();
    this.configureWebpackOutput();
  }

  public configureWebpackEntry = (): void => {
    const handlers: Array<string> = this.serverless.service.getAllFunctions();

    ServerlessWebpackCompiler.webpackEntry = handlers.reduce((webpackEntry, handlerName) => {
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

  public configureWebpackOutput = (): void => {
    ServerlessWebpackCompiler.webpackOutput = {
      libraryTarget: "commonjs2",
      path: Path.resolve(this.serverless.config.servicePath, this.options.outputDirectory),
      filename: "[name].js",
    };
  }

  public configureServerlessFunctions = (webpackOutputPath: string): void => {
    const serverlessFunctionsPath = Path.resolve(webpackOutputPath).replace(`${this.serverless.config.servicePath}/`, "");

    for (const handler of Object.keys(this.serverless.service.functions)) {
      this.serverless.service.functions[handler].handler = `${serverlessFunctionsPath}/${handler}.handler`;
    }
  }

  public beforeOfflineWatchCompile(): void {
    this.configureWebpack();

    const config = Compiler.loadConfig(this.options.configuration);

    this.configureServerlessFunctions(config.output.path);

    const compiler = new Compiler(config, this.serverless.cli.log.bind(this.serverless.cli));
    compiler.watch();
  }

  public async beforeWebpackBuildCompile(): Promise<void> {
    this.configureWebpack();

    const config = Compiler.loadConfig(this.options.configuration);

    this.configureServerlessFunctions(config.output.path);

    const compiler = new Compiler(config, this.serverless.cli.log.bind(this.serverless.cli));
    await compiler.build();
  }
}

export namespace ServerlessWebpackCompiler {
  export interface Options {
    configuration: string;
  }
}
