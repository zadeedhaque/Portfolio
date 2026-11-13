// Draws a fluid Field as a halftone dot grid with one small WebGL2 program.
// The field is uploaded as an RG16F texture: R = water height, G = dye / smoke density.
import type { Field } from "./wave";

const VERT = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }`;

const FRAG = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform sampler2D t; uniform vec2 px; uniform vec3 bg, ac, hi; uniform float gas;
uniform vec2 res; uniform float cell;
void main() {
  // One dot per screen cell, sized by how disturbed the fluid is at the cell centre.
  vec2 pos = uv * res, mid = (floor(pos / cell) + .5) * cell, c = mid / res, loc = (pos - mid) / cell;
  float I; vec3 dotc;
  if (gas > .5) {                                                   // smoke density
    I = 1. - exp(-max(texture(t, c).g, 0.) * 1.5);
    dotc = mix(ac, hi, I * I * .25);
  } else {                                                          // water: slope lighting plus dye
    float dye = clamp(texture(t, c).g, 0., 1.);
    float hx = texture(t, c + vec2(px.x, 0.)).r - texture(t, c - vec2(px.x, 0.)).r;
    float hy = texture(t, c + vec2(0., px.y)).r - texture(t, c - vec2(0., px.y)).r;
    vec3 n = normalize(vec3(-hx * 2.4, -hy * 2.4, 1.));
    vec3 L = normalize(vec3(-.45, -.55, .7));
    float shade = dot(n, L) - L.z;                                  // 0 on still water
    float spec = pow(max(dot(reflect(-L, n), vec3(0., 0., 1.)), 0.), 48.);
    I = clamp(abs(shade) * 2.2 + spec + dye * .7, 0., 1.);
    dotc = mix(ac, hi, clamp(shade * 2.5 + spec, 0., 1.) * .7);
  }
  float r = .47 * sqrt(I);
  float d = gas > .5 ? max(abs(loc.x), abs(loc.y)) : length(loc);   // square pixels for gas, round dots for water
  float m = (1. - smoothstep(r - 1.2 / cell, r, d)) * step(.02, I);
  o = vec4(mix(bg, dotc, m * .9), 1.);
}`;

export type Rgb = [number, number, number];
export interface Tint { bg: Rgb; ac: Rgb; hi: Rgb }
export interface Renderer {
  /** Call when the canvas size, the grid size or the fluid kind changes. */
  configure(gridW: number, gridH: number, gas: boolean, cellPx: number): void;
  draw(field: Field, tint: Tint): void;
}

/** Returns null when WebGL2 is unavailable or the program fails to build. */
export function createRenderer(canvas: HTMLCanvasElement): Renderer | null {
  let gl: WebGL2RenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
  } catch {
    gl = null;
  }
  if (!gl) return null;
  const g = gl;

  const compile = (type: number, src: string) => {
    const s = g.createShader(type);
    if (!s) return null;
    g.shaderSource(s, src);
    g.compileShader(s);
    return s;
  };
  const prog = g.createProgram();
  const vs = compile(g.VERTEX_SHADER, VERT), fs = compile(g.FRAGMENT_SHADER, FRAG);
  if (!prog || !vs || !fs) return null;
  g.attachShader(prog, vs);
  g.attachShader(prog, fs);
  g.linkProgram(prog);
  if (!g.getProgramParameter(prog, g.LINK_STATUS)) return null;
  g.useProgram(prog);

  g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer());
  g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
  const at = g.getAttribLocation(prog, "p");
  g.enableVertexAttribArray(at);
  g.vertexAttribPointer(at, 2, g.FLOAT, false, 0, 0);

  const U = (name: string) => g.getUniformLocation(prog, name);
  const uPx = U("px"), uBg = U("bg"), uAc = U("ac"), uHi = U("hi"), uGas = U("gas"), uRes = U("res"), uCell = U("cell");

  g.bindTexture(g.TEXTURE_2D, g.createTexture());
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);

  let tex = new Float32Array(0);
  let w = 0, h = 0;
  return {
    configure(gridW, gridH, gas, cellPx) {
      w = gridW;
      h = gridH;
      tex = new Float32Array(w * h * 2);
      g.viewport(0, 0, canvas.width, canvas.height);
      g.texImage2D(g.TEXTURE_2D, 0, g.RG16F, w, h, 0, g.RG, g.FLOAT, tex);
      g.uniform2f(uPx, 1 / w, 1 / h);
      g.uniform1f(uGas, gas ? 1 : 0);
      g.uniform2f(uRes, canvas.width, canvas.height);
      g.uniform1f(uCell, cellPx);
    },
    draw(field, tint) {
      const height = field.height, dye = field.dye;
      for (let i = 0, j = 0; i < height.length; i++) {
        tex[j++] = height[i]!;
        tex[j++] = dye[i]!;
      }
      g.texSubImage2D(g.TEXTURE_2D, 0, 0, 0, w, h, g.RG, g.FLOAT, tex);
      g.uniform3fv(uBg, tint.bg);
      g.uniform3fv(uAc, tint.ac);
      g.uniform3fv(uHi, tint.hi);
      g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
    },
  };
}
