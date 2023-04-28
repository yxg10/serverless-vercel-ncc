declare module "@vercel/ncc" {
  interface Options {
    externals: Array<string>;
    minify?: boolean;
    sourceMap?: boolean;
    sourceMapRegister?: boolean;
    quiet?: boolean;
  }

  interface Output {
    code: string;
    map: any;
    assets?: { [id: string]: { source: Buffer; permissions?: number } };
  }

  const compiler: (path: string, options: Options) => Promise<Output>;

  // eslint-disable-next-line import/no-default-export
  export = compiler;
}
