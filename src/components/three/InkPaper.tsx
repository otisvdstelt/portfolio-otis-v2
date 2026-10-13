import { useFrame, useThree } from '@react-three/fiber'
import { Effect, EffectAttribute } from 'postprocessing'
import { useEffect, useMemo } from 'react'
import { Uniform } from 'three'
import { air } from '../../lib/air'
import { look } from './look'

const fragment = /* glsl */ `
  uniform vec3 uInk;
  uniform vec3 uPaper;
  uniform float uReveal;
  uniform float uDpr;
  uniform float uBorder;

  float inkHash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float inkNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(inkHash(i), inkHash(i + vec2(1.0, 0.0)), f.x), mix(inkHash(i + vec2(0.0, 1.0)), inkHash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float inkFbm(vec2 p) {
    float sum = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      sum += amplitude * inkNoise(p);
      p = p * 2.03 + 7.1;
      amplitude *= 0.5;
    }
    return sum;
  }
  vec3 hue(vec3 c) {
    return c / (c.r + c.g + c.b + 0.12);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
    // Everything below is measured in CSS pixels, so the line weight is the same on any screen.
    vec2 size = resolution / uDpr;
    vec2 px = uv * size;
    vec2 one = uDpr * texelSize;

    // No hand is perfectly steady: every edge in the picture wanders by a pixel or so.
    vec2 p = uv + (vec2(inkNoise(px * 0.035), inkNoise(px * 0.035 + 31.7)) - 0.5) * 2.6 * one;
    vec3 colour = texture2D(inputBuffer, p).rgb;

    // --- Ink from depth: a line wherever one thing stands in front of another.
    // The depth buffer is flat across any plane, so its second difference is zero
    // on the ground however steeply it recedes, and jumps at a silhouette.
    float d0 = readDepth(p);
    float dl = readDepth(p - vec2(one.x, 0.0));
    float dr = readDepth(p + vec2(one.x, 0.0));
    float dd = readDepth(p - vec2(0.0, one.y));
    float du = readDepth(p + vec2(0.0, one.y));
    float nearest = min(d0, min(min(dl, dr), min(dd, du)));
    float z = -getViewZ(nearest);
    float jump = abs(dl + dr + dd + du - 4.0 * d0);
    float slope = max(abs(dr - dl), abs(du - dd)) * 0.5;
    float outline = smoothstep(0.004, 0.014, (jump - slope) * z / cameraNear);

    // --- Ink from colour: a line where two differently coloured things touch.
    // Comparing hue instead of brightness keeps shadows and shading bands unlined.
    vec3 cl = texture2D(inputBuffer, p - vec2(one.x, 0.0)).rgb;
    vec3 cr = texture2D(inputBuffer, p + vec2(one.x, 0.0)).rgb;
    vec3 cd = texture2D(inputBuffer, p - vec2(0.0, one.y)).rgb;
    vec3 cu = texture2D(inputBuffer, p + vec2(0.0, one.y)).rgb;
    vec3 h0 = hue(colour);
    float seam = max(max(distance(h0, hue(cl)), distance(h0, hue(cr))), max(distance(h0, hue(cd)), distance(h0, hue(cu))));
    float detail = smoothstep(0.05, 0.12, seam) * step(nearest, 0.99999);

    // Close to, every object carries its own inked outline, a hull drawn round the mesh.
    // That line is measured in the world, so it thins to nothing with distance; this one
    // takes over there, and keeps the far things drawn.
    float far = smoothstep(16.0, 44.0, z) * (1.0 - 0.6 * smoothstep(90.0, 260.0, z)) * (1.0 - smoothstep(320.0, 620.0, z));
    float pressure = 0.62 + 0.5 * inkNoise(px * 0.07);
    float ink = clamp(max(outline * far, detail * 0.4) * pressure, 0.0, 1.0);
    colour = mix(colour, uInk, ink * 0.86);

    // --- Paper: the tooth of the sheet, and pigment pooling in slow blotches.
    float tooth = inkFbm(px * 0.85);
    float pool = inkFbm(px * 0.011 + 3.0);
    colour *= 1.0 + (tooth - 0.5) * 0.11 + (pool - 0.5) * 0.09;
    colour = mix(colour, uPaper, smoothstep(0.62, 0.9, tooth) * 0.07);

    // --- The edge of the painting: the wash stops short of the sheet's edge, raggedly,
    // and the pigment gathers into a darker rim where it stopped.
    float margin = min(min(px.x, size.x - px.x), min(px.y, size.y - px.y));
    float ragged = margin - uBorder + (inkFbm(px * 0.018) - 0.5) * uBorder * 3.2 + (inkNoise(px * 0.13) - 0.5) * 5.0;
    float painted = smoothstep(0.0, 9.0, ragged);

    // --- The reveal: paint spreading outward from the middle of the sheet.
    float spread = uReveal * 2.0 - length((uv - vec2(0.5, 0.45)) * vec2(aspect, 1.0)) - (inkFbm(px * 0.006 + 9.0) - 0.5) * 0.7;
    painted *= smoothstep(0.0, 0.16, spread);

    float rim = painted * (1.0 - painted) * 4.0;
    colour *= 1.0 - rim * 0.16;
    outputColor = vec4(mix(uPaper, colour, painted), 1.0);
  }
`

class InkPaperEffect extends Effect {
  constructor() {
    super('InkPaperEffect', fragment, {
      attributes: EffectAttribute.DEPTH | EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ['uInk', new Uniform(look.ink)],
        ['uPaper', new Uniform(look.paper)],
        ['uReveal', new Uniform(0)],
        ['uDpr', new Uniform(1)],
        ['uBorder', new Uniform(12)],
      ]),
    })
  }
}

/**
 * The pass that turns the render into a painting on paper: the tooth of the
 * sheet and pooled pigment over everything, a ragged edge where the wash
 * stops short, ink for the things too far away to carry their own outline,
 * and the wash that spreads in when a scene arrives.
 */
export function InkPaper() {
  const effect = useMemo(() => new InkPaperEffect(), [])
  const dpr = useThree((s) => s.viewport.dpr)
  const width = useThree((s) => s.size.width)

  useEffect(() => () => effect.dispose(), [effect])

  useFrame(() => {
    effect.uniforms.get('uReveal')!.value = air.reveal.value
    effect.uniforms.get('uDpr')!.value = dpr
    // A narrower strip of bare paper on a phone, where every pixel of picture counts.
    effect.uniforms.get('uBorder')!.value = width < 640 ? 7 : 13
  })

  return <primitive object={effect} dispose={null} />
}
