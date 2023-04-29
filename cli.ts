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
  cheader: string | null;
  [key: string]: string | null | boolean;
}

const options: Options = {
  target: null,
  output: null,
  fs: false,
  vs: false,
  version: false,
  cheader: null,
  help: false,
};

const shortCutMapping: Record<string, string> = {
  t: "target",
  o: "output",
};

const argv = process.argv;
const fileInputs: string[] = [];
for (let i = 2; i < argv.length; ) {
  const arg = argv[i++];
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

if (options.help) {
  const shortcut: Record<string, string> = {};
  for (const key in shortCutMapping) {
    shortcut[shortCutMapping[key]] = key;
  }

  for (const key in options) {
    const sc = shortcut[key];
    let out = "";
    if (sc !== undefined) {
      out += `-${sc} or `;
    }
    out += `--${key}`;
    if (options[key] === null) {
      out += " value";
    }
    console.log(out);
  }
  process.exit(-1);
}

if (fileInputs.length >= 2) {
  console.error(`multiple inputs are not supported.`);
  process.exit(-1);
}

let target = ShaderTarget.OpenGL;
if (options.target !== null) {
  const targetstr = options.target.toLowerCase();
  switch (targetstr) {
    case "opengl":
      target = ShaderTarget.OpenGL;
      break;
    case "opengles2":
      target = ShaderTarget.OpenGLES20;
      break;
    case "opengles3":
      target = ShaderTarget.OpenGLES30;
      break;
    default:
      console.error(`invalid target ${targetstr}.`);
      process.exit(-1);
  }
}

const input: string | undefined = fileInputs[0];
if (options.fs === false && options.vs === false) {
  switch (input !== undefined && path.parse(input).ext.toLowerCase()) {
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

abstract class AbstractWriter {
  abstract write(content: any): void;
  abstract end(): void;
}

class FileWriter extends AbstractWriter {
  constructor(private readonly fd: number) {
    super();
  }

  write(content: any): void {
    fs.writeSync(this.fd, content);
  }
  end() {
    fs.closeSync(this.fd);
  }
}

class ConsoleWriter {
  write(content: any): void {
    process.stdout.write(content);
  }
  end(): void {}
}

(async () => {
  await optimizeGLSL.load();
  const source = fs.readFileSync(input === undefined ? 0 : input);
  const res = optimizeGLSL.buffer(source, target, options.vs);
  if (
    Buffer.from(res.buffer, res.byteOffset, 6).toString("utf8") === "Error:"
  ) {
    console.error(
      Buffer.from(res.buffer, res.byteOffset, res.length).toString("utf8")
    );
    process.exit(-1);
  }

  let writer: AbstractWriter;
  if (options.output === null) {
    writer = new ConsoleWriter();
  } else {
    writer = new FileWriter(fs.openSync(options.output, "w"));

    if (options.cheader === null) {
      const output = path.parse(options.output);
      const outputExt = output.ext.toLowerCase();
      if (
        outputExt === ".h" ||
        outputExt === ".hpp" ||
        outputExt === "h++" ||
        outputExt === "hh"
      ) {
        options.cheader = "g_" + output.name.replace(/[./\\]/g, "_");
      }
    }
  }

  if (options.cheader) {
    writer.write(
      `#define __to_text_(x) #x\nconst char ${options.cheader}[] = __to_text_(\n`
    );
    writer.write(res);
    writer.write(");\n#undef __to_text_\n");
  } else {
    writer.write(res);
  }
  writer.end();
})().catch((err) => {
  console.error(err.stack);
  process.exit(-1);
});
