import * as fs from "fs";
import * as path from "path";
import * as webpack from "webpack";

export class Compiler {

  public static loadConfig(filename: string) {
    const webpackConfigExists = fs.existsSync(path.join(process.cwd(), String(filename)));

    if (!webpackConfigExists) {
      throw new Error(`[Webpack Compiler] cannot find webpack configuration file "${filename}"`);
    }

    const webpackConfig = require(path.join(process.cwd(), filename));

    return webpackConfig;
  }

  constructor(
    config: Compiler.Config | Array<Compiler.Config>,
    private logger: (...args: Array<any>) => void,
  ) {
    this.configs = Array.isArray(config) ? config : [config];
    this.initialize();
  }
  private configs: Array<Compiler.Config>;
  private compilers: Array<webpack.Compiler>;
  private stats: Array<{ start: number; end: number; }>;

  public initialize(): void {
    this.compilers = this.configs.map((config) => webpack(config));
    this.stats = this.configs.map(() => ({ start: 0, end: 0 }));
    this.logger(`[Webpack Compiler] initialized (${this.compilerNames()})`);
  }

  public build(): Promise<Array<webpack.Stats>> {
    const compilePromises = [];

    this.logger(`[Webpack Compiler] build started (${this.compilerNames()})`);

    for (let iter = 0; iter < this.compilers.length; iter++) {
      const compiler = this.compilers[iter];
      compiler.hooks.run.tap("Serverless", () => {
        this.stats[iter].start = new Date().getTime();
      });

      compiler.hooks.compilation.tap("Serverless", (compilation) => {
        const compilerName = this.compilerName(compiler, iter);
        compilation.hooks.chunkAsset.tap("Serverless", (compilationModule) => {
          this.logger(`[Webpack Compiler] (${compilerName}) compiled: ${compilationModule.name}`);
        });
      });

      compilePromises.push(new Promise<webpack.Stats>((resolve, reject) => {

        compiler.run((error, stats) => {
          this.stats[iter].end = new Date().getTime();

          if (error || stats.hasErrors()) {
            this.logger(`webpack build failure (${this.compilerName(compiler, iter)})`);
            this.logger(error || stats.toString("minimal"));

            return reject(error);
          }

          this.logger(`[Webpack Compiler] build success (${this.compilerName(compiler, iter)}:${stats.hash}) in ${this.stats[iter].end - this.stats[iter].start}ms`);

          return resolve(stats);
        });
      }));
    }

    return Promise.all(compilePromises);
  }

  public watch(): void {
    this.logger(`[Webpack Compiler] watching (${this.compilerNames()})`);
    for (let iter = 0; iter < this.compilers.length; iter++) {
      const compiler = this.compilers[iter];

      compiler.hooks.watchRun.tap("Serverless", () => {
        this.logger(`[Webpack Compiler] ${this.stats[iter].start === 0 ? "build" : "rebuild"} started (${this.compilerName(compiler, iter)})`);

        this.stats[iter].start = new Date().getTime();
      });

      const moduleHashes: {[key: string]: string} = {};

      compiler.hooks.compilation.tap("Serverless", (compilation) => {
        const compilerName = this.compilerName(compiler, iter);
        compilation.hooks.chunkAsset.tap("Serverless", (compilationModule) => {
          if (!moduleHashes[compilationModule.name] || moduleHashes[compilationModule.name] !== compilationModule.hash) {
            this.logger(`[Webpack Compiler] (${compilerName}) compiled: ${compilationModule.name}`);
            moduleHashes[compilationModule.name] = compilationModule.hash;
          }
        });
      });

      compiler.watch({}, (error, stats) => {
        this.stats[iter].end = new Date().getTime();

        if (error || stats.hasErrors()) {
          this.logger(`[Webpack Compiler] build failure (${this.compilerName(compiler, iter)})`);
          this.logger(error || stats.toString("minimal"));

          return;
        }

        this.logger(`[Webpack Compiler] build success (${this.compilerName(compiler, iter)}:${stats.hash}) in ${this.stats[iter].end - this.stats[iter].start}ms`);
      });
    }
  }

  private compilerName(compiler: webpack.Compiler, iter: number): string {
    return compiler.name ? compiler.name : `#${iter + 1}`;
  }

  private compilerNames(): string {
    return this.compilers.map((compiler, index) => this.compilerName(compiler, index)).join(", ");
  }
}

export namespace Compiler {
  export interface Config extends webpack.Configuration {}
}
