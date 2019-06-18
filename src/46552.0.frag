#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform sampler2D texture0;

const vec4 col = vec4(0.5, 0., 0., 0.25);
const float speed2 = .7;

float hash( float n ) {
  return fract( sin(n) * 43758.5453123 );
}

vec4 tv(vec4 col, vec2 pos) {
  vec4 sl2;
  sl2 = vec4(sin(( pos.y + 0.0002 + sin(time * 64.) * 0.0002 ) * resolution.y * .02 + time * speed2));
  sl2 = clamp(sl2, 0.5, 0.56);
  col *= sl2;

  float grain = hash( ( pos.x + hash(pos.y) ) * time ) * 0.15;
  col += grain;

  float flicker = ( sin(hash(time)) + 0.5 ) * 0.025 + 0.05;
  col += flicker;

  vec2 vign = 1.0 * (pos);
  vign *= vign;
  float d = 1.0 - clamp( length( vign ), 0.0, 0.9 );
  col *= d;

  return col;
}

void main(void) {
  vec2 uv1 = gl_FragCoord.xy / resolution.xy;
  vec2 uv = -1.0 + 2.0 * uv1;
  uv *= vec2(0.9);
  gl_FragColor = tv(col, uv);
  gl_FragColor *= mod(gl_FragCoord.y, 2.0);
}
