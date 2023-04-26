#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { optimizeGLSL, ShaderTarget } from ".";

interface Options {
  target: string | null;
  output: string | null;
  fs: boolean;
  vs: boolean;
  version: boolean;
  [key: string]: string | null | boolean;
}

const options: Options = {
  target: null,
  output: null,
  fs: false,
  vs: false,
  version: false,
};

const shortCutMapping: Record<string, string> = {
  t: "target",
  o: "output",
};

const argv = process.argv;
const fileInputs: string[] = [];
for (let i = 2; i < argv.length; i++) {
  const arg = argv[i];
  if (arg.startsWith("-")) {
    const firstChar = arg.charAt(1);
    let key: string;
    let next: string;
    if (firstChar === "-") {
      key = arg.substr(2);
      next = "";
    } else {
      key = shortCutMapping[firstChar];
      if (key === undefined) {
        console.error(`unknown option -${firstChar}.`);
        continue;
      }
      next = arg.substr(2);
    }

    const prevVal = options[key];
    if (prevVal === undefined) {
      console.error(`unknown option --${key}.`);
      continue;
    }
    if (prevVal === true) {
      console.error(`multiple --${key} defined.`);
      continue;
    }
    if (prevVal === false) {
      options[key] = true;
      continue;
    }

    if (next === "") {
      next = argv[i++];
      if (next === undefined) {
        console.error(`--${key} needs value. but not defined.`);
        continue;
      }
    }
    if (prevVal !== null) {
      console.error(`multiple ${key} defined. previous one will be ignored.`);
    }
    options[key] = next;
  } else {
    fileInputs.push(arg);
  }
}

if (options.version) {
  console.log(require("./package.json").version);
  process.exit(-1);
}

if (fileInputs.length === 0) {
  console.error(`no inputs.`);
  process.exit(-1);
}
if (fileInputs.length >= 2) {
  console.error(`multiple inputs are not supported.`);
  process.exit(-1);
}

const input = fileInputs[0];
let target = ShaderTarget.OpenGL;
if (options.target !== null) {
  switch (options.target.toLowerCase()) {
    case "opengl":
      target = ShaderTarget.OpenGL;
      break;
    case "opengles2":
      target = ShaderTarget.OpenGLES20;
      break;
    case "opengles3":
      target = ShaderTarget.OpenGLES30;
      break;
  }
}

const parsed = path.parse(input);
if (options.output === null) {
  options.output = path.join(parsed.dir, parsed.name + ".min" + parsed.ext);
}

if (options.fs === false && options.vs === false) {
  switch (parsed.ext.toLowerCase()) {
    case ".vert":
      options.vs = true;
      break;
    case ".frag":
      options.fs = true;
      break;
    default:
      console.error(`the shader type is not defined. use --vs or --fs.`);
      process.exit(-1);
  }
}

(async () => {
  await optimizeGLSL.load();
  const source = fs.readFileSync(input, "utf8");
  const res = optimizeGLSL(source, target, options.vs);
  fs.writeFileSync(options.output!, res);
})().catch(console.error);
