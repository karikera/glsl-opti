## glsl-opti

Wrapper of https://www.npmjs.com/package/glsl-optimizer-js

### CLI Example

```sh
npm i -g glsl-opti # installation
glsl-opti shader.vert -t opengl -o shader.min.vert # optimize OpenGL Vertex Shader
glsl-opti shader.frag -t opengl -o shader.min.frag # optimize OpenGL Fragment Shader
glsl-opti shader2.glsl -t opengles2 --vs -o shader2.min.glsl # optimize OpenGLES 2.0 Vertex Shader
glsl-opti shader3.glsl -t opengles3 --fs -o shader3.min.glsl # optimize OpenGLES 3.0 Fragment Shader
```

### Library Example

```ts
import { optimizeGLSL, ShaderTarget } from "glsl-opti";

(async () => {
  await optimizeGLSL.load();

  const optimized = optimizeGLSL(
    "#define A 2.0\nattribute vec2 attr;varying vec2 vary;void main(){ vary=attr*A;}",
    ShaderTarget.OpenGLES20,
    true
  );
  console.log(optimized);
})().catch(console.error);
```
