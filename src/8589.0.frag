#
#
#
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

uniform sampler2D tex0;

float drawSphere( vec3 position, float size ) 
{ 
	return length(position)-size; 
}

float drawQuad( vec3 position, vec3 size ) 
{ 
	return length(max(abs(position)-size,0.0));
}

float drawTorus( vec3 position, vec2 size )
{
  vec2 q = vec2(length(position.xz)-size.x,position.y);
  return length(q)-size.y;
}

vec3 field(vec3 p) {
	p = abs(fract(p)-.5);
	p *= p;
	return sqrt(p+p.yzx*p.zzy)-.015;
}

vec4 ray(vec3 pos) 
{
    vec3 col = vec3(0.);
    const float ray_n= 32.;
	for(float i=0.;i<ray_n;i++)
		{
			vec3 field = field(pos);
			float sphere = drawSphere(pos-vec3(0.,1.0,1.0),0.5);
			float torus = drawTorus(pos-vec3(0.,0.,1.0),vec2(0.5,0.5));
  			float quad = drawQuad(pos-vec3(0.,-1.0,1.0),vec3(0.5));
			pos.xyz+=sphere*torus*quad;
			
			col +=  max(vec3(0.0), (0.05 - abs(sin(pos.x * i * 0.8 + time + i * 0.3) - vec3(pos.y)) * .2) * 3.) ;
			//col = vec4(vec3(sphere),.0);
		}
	return vec4(col,1.);
}

void main( void ) 
{
  vec3 p = vec3((gl_FragCoord.xy / resolution.xy) * 2. -1., 1.0);
  p.x *= resolution.x/resolution.y;
  vec3 t = vec3(0.,sin(time),0.);
  //vec3 t = vec3(0.,sin(time),sin(time));
  gl_FragColor = ray(p+t);
}
