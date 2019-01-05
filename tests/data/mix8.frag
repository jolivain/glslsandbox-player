#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D  texture0;
uniform sampler2D  texture1;
uniform sampler2D  texture2;
uniform sampler2D  texture3;
uniform sampler2D  texture4;
uniform sampler2D  texture5;
uniform sampler2D  texture6;
uniform sampler2D  texture7;
uniform sampler2D  texture8;
uniform vec2       resolution;

void main(void)
{
  vec2 uv = vec2(gl_FragCoord.x / resolution.x,
		 1.0 - gl_FragCoord.y / resolution.y);

  vec4 t;
  vec4 c;
  c = texture2D(texture0, uv);
  t = texture2D(texture1, uv);
  c = mix(c, t, t.a);
  t = texture2D(texture2, uv);
  c = mix(c, t, t.a);
  t = texture2D(texture3, uv);
  c = mix(c, t, t.a);
  t = texture2D(texture4, uv);
  c = mix(c, t, t.a);
  t = texture2D(texture5, uv);
  c = mix(c, t, t.a);
  t = texture2D(texture6, uv);
  c = mix(c, t, t.a);
  t = texture2D(texture7, uv);
  c = mix(c, t, t.a);

  gl_FragColor = c;
}
