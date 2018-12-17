import { Serverless } from "./serverless";
import { Compiler } from "./compiler";

export class ServerlessWebpackCompiler {
  public commands: Serverless.CommandMap = {
  	webpack: {
  		commands: {
  			build: {
  				lifecycleEvents: [ "compile" ]
  			}
  		},
  	},
  }

  public hooks: { [key: string]: any } = {
  	"before:offline:start": this.beforeOfflineWatchCompile.bind(this),
  	"before:webpack:build:compile": this.beforeWebpackBuildCompile.bind(this),
  	"before:package:createDeploymentArtifacts": this.beforeWebpackBuildCompile.bind(this),
  }

  public options: ServerlessWebpackCompiler.Options;
  
  constructor (
  	private serverless: any,
 	) {
  	this.options = serverless.service.custom["serverless-webpack-compiler"];
  }

  public beforeOfflineWatchCompile (): void {
  	const config = Compiler.loadConfig(this.options.configuration);
  	const compiler = new Compiler(config, this.serverless.cli.log.bind(this.serverless.cli));
  	compiler.watch();
  }

  public async beforeWebpackBuildCompile (): Promise<void> {
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