export namespace Serverless {
  export interface CommandMap { [key: string]: Serverless.Command; }
  export interface Command {
    usage?: string;
    lifecycleEvents?: Array<string>;
    commands?: Serverless.CommandMap;
  }
}
