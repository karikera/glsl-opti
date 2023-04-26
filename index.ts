interface GLSLOptimizerModule {
  HEAPU8: Uint8Array;

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
const optimizeGLSLRaw = Module.cwrap("optimize_glsl", "number", [
  "array",
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
  export function buffer(
    source: Uint8Array,
    target: ShaderTarget,
    isVertexShader: boolean
  ): Uint8Array {
    const ptr = optimizeGLSLRaw(source, target, isVertexShader);
    const buf = Module.HEAPU8;
    let nullterm = ptr;
    for (; buf[nullterm] !== 0; nullterm++) {}
    return buf.subarray(ptr, nullterm);
  }
}
