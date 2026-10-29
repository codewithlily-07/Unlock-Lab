import React, { useEffect, useRef } from 'react';
import './LightTunnel.css';

const INTRO_SECONDS = 1.6;

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform vec2 uCenter;
uniform float uScale;
uniform float uRatio;
uniform float uTime;
uniform float uDrift;
uniform vec2 uSteer;
uniform float uBend;
uniform float uCount;
uniform float uSwing;
uniform float uWave;
uniform float uWidth;
uniform float uPulseWidth;
uniform float uHead;
uniform float uTail;
uniform float uChance;
uniform float uSpacing;
uniform float uPulseSpeed;
uniform float uFlow;
uniform float uHalo;
uniform float uGlow;
uniform float uBrightness;
uniform float uVariance;
uniform float uBody;
uniform float uFadeNear;
uniform float uFadeFar;
uniform vec3 uCable;
uniform vec3 uPulse;
uniform vec3 uTunnel;
uniform vec3 uSurge;
uniform float uReveal;
uniform float uGrain;
uniform float uSeed;
uniform float uLight;
uniform float uOpacity;
out vec4 outColor;

const float TAU = 6.2831853;

vec3 inkOf(vec3 color, float depthOfInk) {
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float peak = max(color.r, max(color.g, color.b));
  float chroma = (peak - min(color.r, min(color.g, color.b))) / max(peak, 0.001);
  return color * min(1.0, mix(depthOfInk, depthOfInk * 1.7, chroma) / max(luma, 0.001));
}

float hash(float n) {
  return fract(sin(n * 127.1 + uSeed * 311.7) * 43758.5453);
}

vec2 bendAt(float depth) {
  float reach = 1.0 - exp(-max(depth, 0.0) * 0.55);
  vec2 wobble = vec2(sin(uDrift * 0.37 + depth * 0.31), cos(uDrift * 0.29 + depth * 0.23)) * uBend;
  return (wobble + uSteer) * reach;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution - uCenter) / uScale;
  float depth = -log(max(length(p), 1e-5));
  vec2 q = p;
  for (int i = 0; i < 4; i++) {
    q = p - bendAt(depth);
    depth = -log(max(length(q), 1e-5));
  }
  float r = length(q);
  float px = r * uScale;
  float turn = atan(q.y, q.x) / TAU;
  float s = turn - uSwing - uWave * sin(depth * 1.2 + uDrift * 0.5);
  float cell = floor(s * uCount);
  float spacing = TAU * px / uCount;
  float near = smoothstep(0.55, 1.25, r);
  float width = uWidth * (1.0 + near * 1.2);
  float soft = uRatio * (0.55 + near * 0.9);
  float tight = uRatio * uHalo * (1.0 + near);
  float wide = tight * 4.5;

  float lines = 0.0;
  float body = 0.0;
  vec3 glow = vec3(0.0);
  float strokes = 0.0;
  for (int k = -3; k <= 3; k++) {
    float i = cell + float(k);
    float id = mod(i, uCount);
    float h1 = hash(id);
    float h2 = hash(id + 17.0);
    float h3 = hash(id + 41.0);
    float h4 = hash(id + 73.0);
    float center = (i + 0.5 + (h1 - 0.5) * 0.55) / uCount;
    center += 0.12 * sin(depth * (0.8 + h2 * 0.9) + uDrift * (0.4 + h3 * 0.5) + h4 * TAU) / uCount;
    float d = abs(s - center) * TAU * px;
    float shade = 1.0 + uVariance * (h3 - 0.5) * 0.9;
    float reach = smoothstep(spacing * 2.4, spacing * 1.4, d);

    lines += smoothstep(width + soft, width - soft, d) * shade;
    body += exp(-d / max(spacing * 0.22, 0.001)) * shade * reach;

    float x = depth * uSpacing + uTime * uPulseSpeed * (0.55 + h2 * 0.6) * uFlow + h4 * 7.0;
    float lead = (fract(x) - 0.5) / uSpacing * uFlow;
    float lit = step(hash(id * 3.7 + floor(x) * 13.1), uChance);
    float limit = 0.5 / uSpacing;
    float head = exp(-pow(max(-lead, 0.0) / uHead, 2.0)) * smoothstep(-limit, -limit * 0.8, lead);
    float tail = exp(-max(lead, 0.0) / uTail) * smoothstep(limit, limit * 0.55, lead);
    float pulse = (lead < 0.0 ? head : tail) * lit;
    float ring = uSurge.y * exp(-pow((depth - uSurge.x) / uSurge.z, 2.0));
    pulse = max(pulse, ring);
    float hot = pulse * (lead < 0.0 ? 1.0 : exp(-max(lead, 0.0) / (uTail * 0.35)));

    float core = uPulseWidth * width + 0.35 * uRatio;
    float stroke = smoothstep(core + soft, core - soft, d);
    float bloom = (exp(-d / tight) * 0.7 + exp(-d / wide) * 0.18) * uGlow * reach;
    vec3 tint = mix(uPulse, vec3(1.0), hot * 0.55 * (1.0 - uLight));
    glow += tint * pulse * (stroke * 1.5 + bloom) * shade;
    strokes += pulse * stroke * shade;
  }

  float lod = smoothstep(4.0, 1.2, spacing);
  float average = min(2.0 * uWidth / max(spacing, 0.001), 1.0);
  lines = mix(lines, average, lod);
  glow = mix(glow, uPulse * average * 0.6 * uChance, lod);
  strokes = mix(strokes, average * 0.6 * uChance, lod);
  body = mix(body, 1.0, lod) * uBody;

  float rr = r * 0.25;
  float fade = smoothstep(0.0, uFadeNear, rr) * (1.0 - smoothstep(uFadeFar * 0.55, uFadeFar, rr));
  fade *= smoothstep(uReveal - 0.6, uReveal, depth);

  float grain = 1.0;
  if (uGrain > 0.0) {
    grain += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + uTime * 7.0) * 43758.5453) - 0.5) * uGrain * 4.0;
  }

  if (uLight > 0.5) {
    float hairline = clamp(lines * 0.26 + body * 0.2, 0.0, 1.0);
    float stroke = clamp(strokes * 1.6, 0.0, 1.0);
    float haze = clamp(length(glow) * 0.12, 0.0, 0.25);
    float ink = clamp(hairline + stroke + haze, 0.0, 1.0) * fade * uOpacity * grain;
    vec3 tone = mix(inkOf(uCable, 0.3), inkOf(uPulse, 0.16), clamp(stroke + haze * 2.0, 0.0, 1.0));
    tone = mix(tone, inkOf(uTunnel, 0.3), clamp(body * uBody, 0.0, 1.0) * 0.5);
    outColor = vec4(tone * ink, ink);
    return;
  }

  // Emerald / Sage fiber color (#126B4F / #8FBFA9)
  vec3 fiberColor = mix(uCable, uTunnel, 0.4);
  // Rich champagne-gold and amber pulse color (#D8BE72 / #D87E3A)
  vec3 pulseColor = mix(uPulse, vec3(0.95, 0.78, 0.38), 0.4);

  float fiberAlpha = clamp(lines * 0.75 + body * uBody * 0.5, 0.0, 1.0);
  float pulseAlpha = clamp(strokes * 1.6 + length(glow) * 0.5, 0.0, 1.0);

  vec3 color = mix(fiberColor * 0.55, pulseColor, clamp(strokes * 1.3, 0.0, 1.0));
  color += glow * 0.5;

  float totalAlpha = clamp(fiberAlpha + pulseAlpha, 0.0, 1.0) * fade * uOpacity * grain;
  outColor = vec4(color * totalAlpha, totalAlpha);
}`;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Fast, reliable color parser without canvas allocation
const parseColor = (hexOrRgb, fallback) => {
  if (!hexOrRgb) return fallback;
  if (typeof hexOrRgb === 'string' && hexOrRgb.startsWith('#')) {
    let hex = hexOrRgb.slice(1);
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    if (hex.length === 6) {
      const num = parseInt(hex, 16);
      return [(num >> 16 & 255) / 255, (num >> 8 & 255) / 255, (num & 255) / 255];
    }
  }
  return fallback;
};

const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  console.warn('LightTunnel shader compile failed:', gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
};

const link = (gl) => {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('LightTunnel program link failed:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  const uniforms = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
};

export const LightTunnel = ({
  cableColor = '#8FBFA9',
  pulseColor = '#D8BE72',
  tunnelColor = '#B8D4B8',
  tunnelOpacity = 0.3,
  speed = 0.7,
  flowDirection = 'inward',
  pulseSpeed = 2.5,
  pulseLength = 0.35,
  pulseBlend = 0.65,
  pulseWidth = 1.2,
  pulseDensity = 0.65,
  cableCount = 56,
  thickness = 0.4,
  rimWidth = 0.2,
  waviness = 0.3,
  sway = 0.4,
  bend = 0.4,
  size = 1,
  centerX = 0,
  centerY = 0,
  glow = 1.2,
  fadeNear = 0.3,
  fadeFar = 2.5,
  brightness = 1.2,
  colorVariance = true,
  grain = false,
  grainIntensity = 0.05,
  opacity = 1,
  mouseInteraction = false,
  mouseStrength = 0.1,
  clickSurge = false,
  intro = true,
  variation = 0,
  lightMode = false,
  fadeOut = false,
  dpr,
  className = '',
  style,
  ...rest
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const wakeRef = useRef(null);

  const settings = {
    cableColor,
    pulseColor,
    tunnelColor,
    tunnelOpacity: clamp(tunnelOpacity, 0, 1),
    speed: Math.max(0, speed),
    flow: flowDirection === 'outward' ? 1 : -1,
    pulseSpeed: Math.max(0, pulseSpeed),
    pulseLength: clamp(pulseLength, 0.02, 1),
    pulseBlend: clamp(pulseBlend, 0, 1),
    pulseWidth: clamp(pulseWidth, 0.1, 3),
    pulseDensity: clamp(pulseDensity, 0, 1),
    cableCount: clamp(Math.round(cableCount), 4, 200),
    thickness: clamp(thickness, 0.05, 2),
    rimWidth: clamp(rimWidth, 0, 1),
    waviness: Math.max(0, waviness),
    sway: Math.max(0, sway),
    bend: Math.max(0, bend),
    size: Math.max(0.05, size),
    centerX,
    centerY,
    glow: Math.max(0, glow),
    fadeNear: Math.max(0.001, fadeNear),
    fadeFar: Math.max(0.01, fadeFar),
    brightness: Math.max(0, brightness),
    colorVariance,
    grain,
    grainIntensity: Math.max(0, grainIntensity),
    opacity: clamp(opacity, 0, 1),
    mouseInteraction,
    mouseStrength: Math.max(0, mouseStrength),
    clickSurge,
    intro,
    variation,
    lightMode,
    fadeOut,
    dpr,
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
    });
    if (!gl) {
      console.warn('LightTunnel: WebGL2 context not available');
      return undefined;
    }

    const program = link(gl);
    if (!program) return undefined;
    const u = program.uniforms;

    const buffer = gl.createBuffer();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const pointer = { x: 0, y: 0, inside: false };
    const steer = { x: 0, y: 0 };
    const surge = { age: 10 };
    let time = 0;
    let drift = 0;
    let reveal = settingsRef.current.intro && !reduce ? 0 : 1;
    let fadeOutFactor = 1.0;
    let raf = 0;
    let last = 0;

    const render = () => {
      const s = settingsRef.current;
      const width = canvas.width || 800;
      const height = canvas.height || 600;
      const clientWidth = container.clientWidth || window.innerWidth || 800;
      const ratio = width / Math.max(1, clientWidth);
      const minSide = Math.min(width, height);
      const flow = s.flow;
      const span = 3.4;
      const travel = surge.age * 2.6;
      const surgeDepth = flow > 0 ? span - travel : -0.6 + travel;
      const surgeLevel = surge.age < 2.4 ? Math.min(1, surge.age / 0.12) * Math.exp(-surge.age * 1.1) : 0;
      const eased = reveal * reveal * (3 - 2 * reveal);

      gl.viewport(0, 0, width, height);
      gl.useProgram(program.program);
      gl.bindVertexArray(vao);

      if (u.uResolution) gl.uniform2f(u.uResolution, width, height);
      if (u.uCenter) gl.uniform2f(u.uCenter, s.centerX * minSide, s.centerY * minSide);
      if (u.uScale) gl.uniform1f(u.uScale, minSide * 0.5 * s.size);
      if (u.uRatio) gl.uniform1f(u.uRatio, ratio);
      if (u.uTime) gl.uniform1f(u.uTime, time);
      if (u.uDrift) gl.uniform1f(u.uDrift, drift);
      if (u.uSteer) gl.uniform2f(u.uSteer, steer.x, steer.y);
      if (u.uBend) gl.uniform1f(u.uBend, s.bend * 0.45);
      if (u.uCount) gl.uniform1f(u.uCount, s.cableCount);
      if (u.uSwing) gl.uniform1f(u.uSwing, (Math.sin(drift * 0.9) * s.sway * 0.5) / (Math.PI * 2));
      if (u.uWave) gl.uniform1f(u.uWave, s.waviness * 0.15);
      if (u.uWidth) gl.uniform1f(u.uWidth, (0.25 + s.thickness * 1.5) * ratio);
      if (u.uPulseWidth) gl.uniform1f(u.uPulseWidth, 0.6 + s.pulseWidth * 0.9);

      const length = s.pulseLength * 1.2;
      if (u.uHead) gl.uniform1f(u.uHead, length * (0.08 + s.pulseBlend * 0.22));
      if (u.uTail) gl.uniform1f(u.uTail, length * (0.5 + s.pulseBlend * 0.7));
      if (u.uChance) gl.uniform1f(u.uChance, s.pulseDensity);
      if (u.uSpacing) gl.uniform1f(u.uSpacing, 0.4);
      if (u.uPulseSpeed) gl.uniform1f(u.uPulseSpeed, s.pulseSpeed * 4);
      if (u.uFlow) gl.uniform1f(u.uFlow, flow);
      if (u.uHalo) gl.uniform1f(u.uHalo, 1.2 + s.rimWidth * 8);
      if (u.uGlow) gl.uniform1f(u.uGlow, s.glow);
      if (u.uBrightness) gl.uniform1f(u.uBrightness, s.brightness);
      if (u.uVariance) gl.uniform1f(u.uVariance, s.colorVariance ? 1 : 0);
      if (u.uBody) gl.uniform1f(u.uBody, s.tunnelOpacity);
      if (u.uFadeNear) gl.uniform1f(u.uFadeNear, s.fadeNear);
      if (u.uFadeFar) gl.uniform1f(u.uFadeFar, s.fadeFar);
      if (u.uCable) gl.uniform3fv(u.uCable, parseColor(s.cableColor, [0.56, 0.75, 0.66]));
      if (u.uPulse) gl.uniform3fv(u.uPulse, parseColor(s.pulseColor, [0.85, 0.75, 0.45]));
      if (u.uTunnel) gl.uniform3fv(u.uTunnel, parseColor(s.tunnelColor, [0.72, 0.83, 0.72]));
      if (u.uSurge) gl.uniform3f(u.uSurge, surgeDepth, surgeLevel, 0.22);
      // Reveal sweeps smoothly from 0.8 down to -2.0, revealing fibers immediately
      if (u.uReveal) gl.uniform1f(u.uReveal, 0.8 - eased * 2.8);
      if (u.uGrain) gl.uniform1f(u.uGrain, s.grain ? s.grainIntensity : 0);
      if (u.uSeed) gl.uniform1f(u.uSeed, s.variation);
      if (u.uLight) gl.uniform1f(u.uLight, s.lightMode ? 1 : 0);
      if (u.uOpacity) gl.uniform1f(u.uOpacity, s.opacity * fadeOutFactor);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now) => {
      raf = 0;
      if (document.hidden) return;
      const s = settingsRef.current;
      const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;
      last = now;
      const motion = reduce ? 0 : 1;
      time += dt * s.speed * motion;
      drift += dt * (s.speed + 0.2) * motion;
      surge.age += dt;

      if (s.intro && !reduce && reveal < 1) {
        reveal = Math.min(1, reveal + dt / INTRO_SECONDS);
      } else if (!s.intro || reduce) {
        reveal = 1;
      }

      // Smooth exit fade over 0.5s (1.8s to 2.3s)
      if (s.fadeOut) {
        fadeOutFactor = Math.max(0, fadeOutFactor - dt / 0.5);
      } else {
        fadeOutFactor = 1.0;
      }

      const engaged = s.mouseInteraction && pointer.inside && !reduce;
      const reach = s.mouseStrength * 2.5;
      const target = engaged ? [pointer.x * reach, pointer.y * reach] : [0, 0];
      const follow = 1 - Math.exp(-dt / 0.6);
      steer.x += (target[0] - steer.x) * follow;
      steer.y += (target[1] - steer.y) * follow;

      render();

      if (fadeOutFactor > 0.001) {
        raf = requestAnimationFrame(frame);
      } else {
        last = 0;
      }
    };

    const wake = () => {
      if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      const s = settingsRef.current;
      const width = container.clientWidth || window.innerWidth || 800;
      const height = container.clientHeight || window.innerHeight || 600;
      const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      render();
      wake();
    };

    const locate = (event) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      pointer.inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      const scale = Math.min(rect.width, rect.height) * 0.5;
      pointer.x = (x - rect.width / 2) / Math.max(1, scale);
      pointer.y = (rect.height / 2 - y) / Math.max(1, scale);
    };

    const onPointerMove = (event) => {
      locate(event);
      wake();
    };

    const onPointerDown = (event) => {
      locate(event);
      if (!pointer.inside || !settingsRef.current.clickSurge || reduce) return;
      surge.age = 0;
      wake();
    };

    const onPointerUp = (event) => {
      if (event.pointerType !== 'mouse') pointer.inside = false;
    };

    const onPointerLeave = () => {
      pointer.inside = false;
    };

    const onVisibility = () => {
      last = 0;
      wake();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);

    resize();

    let lastDpr = settingsRef.current.dpr;
    wakeRef.current = () => {
      const s = settingsRef.current;
      if (s.dpr !== lastDpr) {
        lastDpr = s.dpr;
        resize();
        return;
      }
      if (!raf) render();
      wake();
    };

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteProgram(program.program);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
    };
  }, []);

  useEffect(() => {
    wakeRef.current?.();
  });

  return (
    <div
      ref={containerRef}
      className={`light-tunnel-container${className ? ` ${className}` : ''}`}
      style={style}
      {...rest}
    >
      <canvas ref={canvasRef} className="light-tunnel-canvas" aria-hidden="true" />
    </div>
  );
};

export default LightTunnel;
