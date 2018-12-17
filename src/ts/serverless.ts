export namespace Serverless {
	export type CommandMap = { [key: string]: Serverless.Command }
  export interface Command {
    usage?: string;
    lifecycleEvents?: Array<string>;
    commands?: Serverless.CommandMap;
  }
}