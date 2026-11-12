/**
 * WebGL2 Film Simulation Renderer
 * Applies authentic 3D LUTs with grain, softness, halation, vignette and color adjustments
 */

import { LUTData, createIdentityLUT } from './lut-loader';

export interface RenderSettings {
  intensity: number;   // 0 to 1
  grain: number;       // 0 to 1
  softness: number;    // 0 to 1
  halation: number;    // 0 to 1
  vignette: number;    // 0 to 1
  exposure: number;    // -2 to 2 (EV stops)
  contrast: number;    // -1 to 1
  saturation: number;  // -1 to 1
  temperature: number; // -1 to 1
  highlights: number;  // -1 to 1
  shadows: number;     // -1 to 1
}

export const defaultSettings: RenderSettings = {
  intensity: 1.0,
  grain: 0.0,
  softness: 0.0,
  halation: 0.0,
  vignette: 0.0,
  exposure: 0.0,
  contrast: 0.0,
  saturation: 0.0,
  temperature: 0.0,
  highlights: 0.0,
  shadows: 0.0,
};

const VERT_SRC = `#version 300 es
layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texCoord;
out vec2 v_texCoord;
void main() {
  v_texCoord = a_texCoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const MAIN_FRAG_SRC = `#version 300 es
precision highp float;
precision highp sampler3D;

in vec2 v_texCoord;
layout(location = 0) out vec4 fragColor;

uniform sampler2D u_image;
uniform sampler3D u_lut3d;
uniform float u_intensity;
uniform float u_grain;
uniform float u_vignette;
uniform float u_exposure;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_temperature;
uniform float u_highlights;
uniform float u_shadows;
uniform float u_time;
uniform int u_lutSize;

float random(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

float luminance(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

vec3 applyLUT(vec3 color) {
  float size = float(u_lutSize);
  // Map 0..1 color space to voxel centers in 3D texture
  vec3 scale = vec3((size - 1.0) / size);
  vec3 offset = vec3(0.5 / size);
  vec3 coord = clamp(color, 0.0, 1.0) * scale + offset;
  return texture(u_lut3d, coord).rgb;
}

void main() {
  vec4 texColor = texture(u_image, v_texCoord);
  vec3 color = texColor.rgb;

  // 1. Exposure adjustment (in EV stops: 2^u_exposure)
  color *= pow(2.0, u_exposure);

  // 2. White Balance / Temperature adjustment
  color.r *= (1.0 + u_temperature * 0.15);
  color.b *= (1.0 - u_temperature * 0.15);

  // 3. 3D LUT film stock color grading (only if intensity > 0)
  if (u_intensity > 0.001) {
    vec3 lutColor = applyLUT(color);
    color = mix(color, lutColor, u_intensity);
  }

  // 4. Contrast adjustment around midpoint (0.5)
  color = (color - 0.5) * (1.0 + u_contrast) + 0.5;

  // 5. Highlights and Shadows tonal adjustments
  float lum = luminance(color);
  float highlightMask = smoothstep(0.4, 0.95, lum);
  float shadowMask = 1.0 - smoothstep(0.05, 0.6, lum);
  color += color * (u_highlights * highlightMask * 0.35);
  color += color * (u_shadows * shadowMask * 0.35);

  // 6. Saturation adjustment
  float gray = luminance(color);
  color = mix(vec3(gray), color, 1.0 + u_saturation);

  // 7. Film Grain (procedural film grain with luminance sensitivity)
  if (u_grain > 0.001) {
    float n1 = random(v_texCoord * 1200.0 + u_time * 0.13);
    float n2 = random(v_texCoord * 650.0 - u_time * 0.09);
    float grainVal = (n1 + n2) * 0.5 - 0.5;
    float grainResponse = 1.0 - abs(lum - 0.5) * 1.2;
    grainResponse = clamp(grainResponse, 0.2, 1.0);
    color += grainVal * u_grain * 0.18 * grainResponse;
  }

  // 8. Vignette effect
  if (u_vignette > 0.001) {
    vec2 vigUV = v_texCoord - 0.5;
    float vigDist = length(vigUV);
    float vigAmount = 1.0 - vigDist * vigDist * u_vignette * 1.6;
    color *= clamp(vigAmount, 0.0, 1.0);
  }

  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

const BLUR_FRAG_SRC = `#version 300 es
precision highp float;
in vec2 v_texCoord;
layout(location = 0) out vec4 fragColor;
uniform sampler2D u_texture;
uniform vec2 u_direction;
uniform vec2 u_resolution;
uniform float u_radius;

void main() {
  vec2 texelSize = 1.0 / u_resolution;
  vec2 step = u_direction * texelSize * u_radius;
  vec4 result = texture(u_texture, v_texCoord) * 0.2270270270;
  result += texture(u_texture, v_texCoord + step * 1.3846153846) * 0.3162162162;
  result += texture(u_texture, v_texCoord - step * 1.3846153846) * 0.3162162162;
  result += texture(u_texture, v_texCoord + step * 3.2307692308) * 0.0702702703;
  result += texture(u_texture, v_texCoord - step * 3.2307692308) * 0.0702702703;
  fragColor = result;
}
`;

const COMPOSITE_FRAG_SRC = `#version 300 es
precision highp float;
in vec2 v_texCoord;
layout(location = 0) out vec4 fragColor;
uniform sampler2D u_main;
uniform sampler2D u_glow;
uniform float u_amount;

void main() {
  vec4 mainCol = texture(u_main, v_texCoord);
  vec3 glowCol = texture(u_glow, v_texCoord).rgb;
  vec3 finalRgb = mainCol.rgb + glowCol * u_amount * 0.45;
  fragColor = vec4(clamp(finalRgb, 0.0, 1.0), 1.0);
}
`;

interface ProgramInfo {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation>;
}

export class FilmRenderer {
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;

  private mainProg!: ProgramInfo;
  private blurProg!: ProgramInfo;
  private compositeProg!: ProgramInfo;

  private imageTexture: WebGLTexture | null = null;
  private lutTexture: WebGLTexture | null = null;

  private mainFBO: { fbo: WebGLFramebuffer; texture: WebGLTexture } | null = null;
  private blurFBO1: { fbo: WebGLFramebuffer; texture: WebGLTexture } | null = null;
  private blurFBO2: { fbo: WebGLFramebuffer; texture: WebGLTexture } | null = null;
  private fboW = 0;
  private fboH = 0;

  private quadVAO!: WebGLVertexArrayObject;

  private settings: RenderSettings = { ...defaultSettings };
  private lutSize = 8;
  private startTime = Date.now();
  private animFrame: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', {
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      antialias: false,
    });
    if (!gl) throw new Error('WebGL2 not supported');
    this.gl = gl;
    this.init();
  }

  private compileShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader compile error: ${log}`);
    }
    return shader;
  }

  private createProgramInfo(vsSrc: string, fsSrc: string, uniformNames: string[]): ProgramInfo {
    const gl = this.gl;
    const vs = this.compileShader(gl.VERTEX_SHADER, vsSrc);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSrc);
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('Program link error: ' + gl.getProgramInfoLog(program));
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    const uniforms: Record<string, WebGLUniformLocation> = {};
    for (const name of uniformNames) {
      const loc = gl.getUniformLocation(program, name);
      if (loc !== null) uniforms[name] = loc;
    }

    return { program, uniforms };
  }

  private init() {
    const gl = this.gl;

    this.mainProg = this.createProgramInfo(VERT_SRC, MAIN_FRAG_SRC, [
      'u_image', 'u_lut3d', 'u_intensity', 'u_grain', 'u_vignette',
      'u_exposure', 'u_contrast', 'u_saturation', 'u_temperature',
      'u_highlights', 'u_shadows', 'u_time', 'u_lutSize',
    ]);
    this.blurProg = this.createProgramInfo(VERT_SRC, BLUR_FRAG_SRC, [
      'u_texture', 'u_direction', 'u_resolution', 'u_radius',
    ]);
    this.compositeProg = this.createProgramInfo(VERT_SRC, COMPOSITE_FRAG_SRC, [
      'u_main', 'u_glow', 'u_amount',
    ]);

    // Create Quad VAO with location 0 for position and location 1 for texCoord
    this.quadVAO = gl.createVertexArray()!;
    gl.bindVertexArray(this.quadVAO);

    // Fullscreen quad covering NDC [-1, 1]
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);
    // Standard texture coordinates with y=0 bottom, y=1 top
    const texCoords = new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      0, 1,
      1, 0,
      1, 1,
    ]);

    const posBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const texBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuf);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    // Image 2D texture
    this.imageTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // 3D LUT Texture
    this.lutTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_3D, this.lutTexture);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

    // Initialize with identity LUT
    this.loadLUT(createIdentityLUT(8));
  }

  loadImage(image: HTMLImageElement | HTMLCanvasElement) {
    const gl = this.gl;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image as TexImageSource);
  }

  loadLUT(lut: LUTData) {
    const gl = this.gl;
    this.lutSize = lut.size;
    const numPixels = lut.size * lut.size * lut.size;
    const rgba = new Uint8Array(numPixels * 4);

    for (let i = 0; i < numPixels; i++) {
      rgba[i * 4 + 0] = Math.max(0, Math.min(255, Math.round(lut.data[i * 3 + 0] * 255)));
      rgba[i * 4 + 1] = Math.max(0, Math.min(255, Math.round(lut.data[i * 3 + 1] * 255)));
      rgba[i * 4 + 2] = Math.max(0, Math.min(255, Math.round(lut.data[i * 3 + 2] * 255)));
      rgba[i * 4 + 3] = 255;
    }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.bindTexture(gl.TEXTURE_3D, this.lutTexture);
    gl.texImage3D(
      gl.TEXTURE_3D,
      0,
      gl.RGBA8,
      lut.size,
      lut.size,
      lut.size,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      rgba
    );
  }

  private createFBO(w: number, h: number) {
    const gl = this.gl;
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fbo, texture };
  }

  private ensureFBOs(w: number, h: number) {
    if (this.fboW !== w || this.fboH !== h) {
      this.invalidateFBOs();
      this.fboW = w;
      this.fboH = h;
    }
    if (!this.mainFBO) this.mainFBO = this.createFBO(w, h);
    if (!this.blurFBO1) this.blurFBO1 = this.createFBO(w, h);
    if (!this.blurFBO2) this.blurFBO2 = this.createFBO(w, h);
  }

  private invalidateFBOs() {
    const gl = this.gl;
    const dispose = (obj: { fbo: WebGLFramebuffer; texture: WebGLTexture } | null) => {
      if (!obj) return;
      gl.deleteFramebuffer(obj.fbo);
      gl.deleteTexture(obj.texture);
    };
    dispose(this.mainFBO);
    dispose(this.blurFBO1);
    dispose(this.blurFBO2);
    this.mainFBO = null;
    this.blurFBO1 = null;
    this.blurFBO2 = null;
  }

  setSettings(s: Partial<RenderSettings>) {
    this.settings = { ...this.settings, ...s };
  }

  getSettings(): RenderSettings {
    return { ...this.settings };
  }

  render() {
    const gl = this.gl;
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (w === 0 || h === 0) return;

    this.ensureFBOs(w, h);
    gl.viewport(0, 0, w, h);
    gl.bindVertexArray(this.quadVAO);

    const needsBlur = this.settings.softness > 0.001 || this.settings.halation > 0.001;
    const time = (Date.now() - this.startTime) / 1000;

    if (needsBlur) {
      // Pass 1: Main shader render to mainFBO
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.mainFBO!.fbo);
      this.drawMain(w, h, time);

      // Pass 2: Horizontal blur to blurFBO1
      const blurRadius = Math.max(this.settings.softness, this.settings.halation) * 8.0;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.blurFBO1!.fbo);
      this.drawBlur(this.mainFBO!.texture, [1, 0], w, h, blurRadius);

      // Pass 3: Vertical blur to blurFBO2
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.blurFBO2!.fbo);
      this.drawBlur(this.blurFBO1!.texture, [0, 1], w, h, blurRadius);

      // Pass 4: Composite main image with blur glow directly onto screen
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this.drawComposite(this.mainFBO!.texture, this.blurFBO2!.texture);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this.drawMain(w, h, time);
    }

    gl.bindVertexArray(null);
  }

  private drawMain(w: number, h: number, time: number) {
    const gl = this.gl;
    const { program, uniforms: u } = this.mainProg;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
    if (u['u_image'] !== undefined) gl.uniform1i(u['u_image'], 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_3D, this.lutTexture);
    if (u['u_lut3d'] !== undefined) gl.uniform1i(u['u_lut3d'], 1);

    const s = this.settings;
    if (u['u_intensity'] !== undefined) gl.uniform1f(u['u_intensity'], s.intensity);
    if (u['u_grain'] !== undefined) gl.uniform1f(u['u_grain'], s.grain);
    if (u['u_vignette'] !== undefined) gl.uniform1f(u['u_vignette'], s.vignette);
    if (u['u_exposure'] !== undefined) gl.uniform1f(u['u_exposure'], s.exposure);
    if (u['u_contrast'] !== undefined) gl.uniform1f(u['u_contrast'], s.contrast);
    if (u['u_saturation'] !== undefined) gl.uniform1f(u['u_saturation'], s.saturation);
    if (u['u_temperature'] !== undefined) gl.uniform1f(u['u_temperature'], s.temperature);
    if (u['u_highlights'] !== undefined) gl.uniform1f(u['u_highlights'], s.highlights);
    if (u['u_shadows'] !== undefined) gl.uniform1f(u['u_shadows'], s.shadows);
    if (u['u_time'] !== undefined) gl.uniform1f(u['u_time'], time);
    if (u['u_lutSize'] !== undefined) gl.uniform1i(u['u_lutSize'], this.lutSize);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private drawBlur(src: WebGLTexture, dir: number[], w: number, h: number, radius: number) {
    const gl = this.gl;
    const { program, uniforms: u } = this.blurProg;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, src);
    if (u['u_texture'] !== undefined) gl.uniform1i(u['u_texture'], 0);
    if (u['u_direction'] !== undefined) gl.uniform2f(u['u_direction'], dir[0], dir[1]);
    if (u['u_resolution'] !== undefined) gl.uniform2f(u['u_resolution'], w, h);
    if (u['u_radius'] !== undefined) gl.uniform1f(u['u_radius'], radius);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private drawComposite(mainTex: WebGLTexture, glowTex: WebGLTexture) {
    const gl = this.gl;
    const { program, uniforms: u } = this.compositeProg;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, mainTex);
    if (u['u_main'] !== undefined) gl.uniform1i(u['u_main'], 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, glowTex);
    if (u['u_glow'] !== undefined) gl.uniform1i(u['u_glow'], 1);

    const amount = Math.max(this.settings.softness, this.settings.halation);
    if (u['u_amount'] !== undefined) gl.uniform1f(u['u_amount'], amount);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  startAnimation() {
    if (this.animFrame !== null) return;
    const loop = () => {
      this.render();
      this.animFrame = requestAnimationFrame(loop);
    };
    loop();
  }

  stopAnimation() {
    if (this.animFrame !== null) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }

  resize(w: number, h: number) {
    this.canvas.width = w;
    this.canvas.height = h;
    this.ensureFBOs(w, h);
  }

  destroy() {
    this.stopAnimation();
    this.invalidateFBOs();
    const gl = this.gl;
    if (this.imageTexture) gl.deleteTexture(this.imageTexture);
    if (this.lutTexture) gl.deleteTexture(this.lutTexture);
    if (this.mainProg) gl.deleteProgram(this.mainProg.program);
    if (this.blurProg) gl.deleteProgram(this.blurProg.program);
    if (this.compositeProg) gl.deleteProgram(this.compositeProg.program);
  }
}
