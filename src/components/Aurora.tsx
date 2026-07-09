import { useEffect, useRef } from 'react'
import { Mesh, Program, Renderer, Triangle } from 'ogl'

const VERT = /* glsl */ `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

/* Aurora ribbon — simplex-noise height field with a three-stop color ramp,
   in the spirit of the React Bits Aurora background. */
const FRAG = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec3 ramp(float factor) {
  vec3 color = mix(uColorStops[0], uColorStops[1], smoothstep(0.0, 0.5, factor));
  return mix(color, uColorStops[2], smoothstep(0.5, 1.0, factor));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float noise = snoise(vec2(uv.x * 2.0 + uTime * 0.08, uTime * 0.22));
  float height = exp(noise * 0.5 * uAmplitude);
  float field = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.62 * field;

  float midPoint = 0.2;
  float alpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  vec3 color = intensity * ramp(uv.x);

  gl_FragColor = vec4(color * alpha, alpha);
}
`

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

type AuroraProps = {
  colorStops?: [string, string, string]
  amplitude?: number
  blend?: number
  speed?: number
  /** flip vertically, so the ribbon hangs from the bottom edge */
  flip?: boolean
  className?: string
}

export default function Aurora({
  colorStops = ['#e0537f', '#ffb38a', '#b89be6'],
  amplitude = 1.0,
  blend = 0.55,
  speed = 1.0,
  flip = false,
  className = '',
}: AuroraProps) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let renderer: Renderer
    try {
      renderer = new Renderer({
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        dpr: Math.min(window.devicePixelRatio || 1, 1.5),
      })
    } catch {
      return // no WebGL — the CSS glow fallback below still shows
    }

    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)
    Object.assign(gl.canvas.style, { width: '100%', height: '100%', display: 'block' })
    host.appendChild(gl.canvas as HTMLCanvasElement)

    const stops = new Float32Array(colorStops.flatMap(hexToRgb))
    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uBlend: { value: blend },
        uColorStops: { value: stops },
        uResolution: { value: new Float32Array([1, 1]) },
      },
    })
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program })

    const resize = () => {
      renderer.setSize(host.clientWidth, host.clientHeight)
      program.uniforms.uResolution.value.set([gl.drawingBufferWidth, gl.drawingBufferHeight])
    }
    const ro = new ResizeObserver(resize)
    ro.observe(host)
    resize()

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let rafId = 0
    let running = false
    const frame = (t: number) => {
      rafId = requestAnimationFrame(frame)
      program.uniforms.uTime.value = (t / 1000) * speed
      renderer.render({ scene: mesh })
    }
    const start = () => {
      if (running || reduced) return
      running = true
      rafId = requestAnimationFrame(frame)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(rafId)
    }

    // static single frame for reduced motion, live loop otherwise
    if (reduced) {
      program.uniforms.uTime.value = 12
      renderer.render({ scene: mesh })
    }

    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), {
      rootMargin: '80px',
    })
    io.observe(host)

    const onVisibility = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      gl.canvas.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
      style={flip ? { transform: 'scaleY(-1)' } : undefined}
    >
      {/* CSS glow fallback + depth bed under the shader */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(58% 42% at 50% 0%, rgb(224 83 127 / 0.16), transparent 70%)',
        }}
      />
      <div ref={hostRef} className="absolute inset-0" />
    </div>
  )
}
