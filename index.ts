interface GLSLOptimizerModule {
  then(cb: (v: GLSLOptimizerModule) => void): GLSLOptimizerModule;

  ccall(
    fnname: string,
    returnType: string,
    argTypes: string[],
    args: unknown[]
  ): any;

  cwrap(
    name: string,
    returnType: string,
    argTypes: string[]
  ): (...args: unknown[]) => any;
}

export enum ShaderTarget {
  OpenGL = 1,
  OpenGLES20 = 2,
  OpenGLES30 = 3,
}

const Module = require("glsl-optimizer-js")() as GLSLOptimizerModule;
export declare function optimizeGLSL(
  source: string,
  target: ShaderTarget,
  isVertexShader: boolean
): string;

exports.optimizeGLSL = Module.cwrap("optimize_glsl", "string", [
  "string",
  "number",
  "boolean",
]);

const modulePromise = new Promise<void>((resolve) => {
  Module.then((v) => {
    resolve();
  });
});
export namespace optimizeGLSL {
  export function load(): Promise<void> {
    return modulePromise;
  }
}
