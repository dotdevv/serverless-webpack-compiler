import * as fs from "fs";
import * as path from "path";
import * as webpack from "webpack";

export class Compiler {
  private configs: Compiler.Config[];
  private compilers: webpack.Compiler[];

  constructor(
    config: Compiler.Config | Compiler.Config[],
    private logger: (...args: Array<any>) => void
  ) {
    this.configs = Array.isArray(config) ? config : [config];
    this.initialize();
  }

  public static loadConfig (filename: string) {
    const webpackConfigExists = fs.existsSync(path.join(process.cwd(), String(filename)));

    if(!webpackConfigExists) {
      throw new Error(`[Webpack Compiler] cannot find webpack configuration file "${filename}"`);
    }

    const webpackConfig = require(path.join(process.cwd(), filename));

    return webpackConfig;
  }

  public initialize (): void {
    this.compilers = this.configs.map(config => webpack(config));
    this.logger(`[Webpack Compiler] initialized (${this.compilerNames()})`);
  }

  private compilerName (compiler: webpack.Compiler, iter: number): string {
    return compiler.name ? compiler.name : `#${iter + 1}`;
  }

  private compilerNames (): string {
    return this.compilers.map((compiler, index) => this.compilerName(compiler, index)).join(", ");
  }

  public build (): Promise<Array<webpack.Stats>> {
    const compilePromises = [];

    this.logger(`[Webpack Compiler] build started (${this.compilerNames()})`);

    for(let iter = 0; iter < this.compilers.length; iter++) {
      const compiler = this.compilers[iter];
      compilePromises.push(new Promise<webpack.Stats>((resolve, reject) => {
        compiler.run((error, stats) => {
          if(error || stats.hasErrors()) {
            this.logger(`webpack build failure (${this.compilerName(compiler, iter)})`);
            this.logger(error || stats.toString("minimal"));

            return reject(error);
          }

          this.logger(`[Webpack Compiler] build success (${this.compilerName(compiler, iter)}:${stats.hash})`);

          return resolve(stats);
        });
      }));
    }

    return Promise.all(compilePromises);
  }

  public watch (): void {
    this.logger(`[Webpack Compiler] watching (${this.compilerNames()})`);
    for(let iter = 0; iter < this.compilers.length; iter++) {
      const compiler = this.compilers[iter];
      compiler.watch({}, (error, stats) => {
        if(error || stats.hasErrors()) {
          this.logger(`[Webpack Compiler] build failure (${this.compilerName(compiler, iter)})`);
          this.logger(error || stats.toString("minimal"));

          return;
        }

        this.logger(`[Webpack Compiler] build success (${this.compilerName(compiler, iter)}:${stats.hash})`);
      });
    }
  }
}

export namespace Compiler {
  export interface Config extends webpack.Configuration {}
}
