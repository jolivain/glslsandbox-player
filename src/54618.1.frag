#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

vec3 Julia(vec2 p,vec2 c)
{
  vec2 s = p*0.8;
  float d = 0.0, l;

  for (int i = 0; i < 256; i++) {
    s = vec2(s.x * s.x - s.y * s.y + c.x, 2.0 * s.x * s.y + c.y);
    l = length(s);
    d += l + 0.2;
    if (l > 2.0)
        break;
  }

  return vec3(sin(d * 0.3), sin(d * 0.2), sin(d * 0.1))/(1.0+0.2*length(s));
}


void main( void ) {
  vec2 position = 2.0*( 2.0*gl_FragCoord.xy -resolution.xy)/ min(resolution.x,resolution.y );
  vec3 pos=vec3(position,3.0),dir=normalize(pos-vec3(0.0,0.0,8.0));
  dir.xy = mouse.xy;
  gl_FragColor = vec4( Julia(pos.xy,dir.xy), 1.0 );
}
