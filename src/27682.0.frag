
// Rotating Hexagonal Grid

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

const float tau = 6.28318;

mat3 Rotate3D(vec3 angles)
{
    vec3 c = cos(angles),   s = sin(angles);
    mat3 rotX = mat3( 1.0, 0.0, 0.0, 0.0,c.x,s.x, 0.0,-s.x, c.x);
    mat3 rotY = mat3( c.y, 0.0,-s.y, 0.0,1.0,0.0, s.y, 0.0, c.y);
    mat3 rotZ = mat3( c.z, s.z, 0.0,-s.z,c.z,0.0, 0.0, 0.0, 1.0);
    return rotX*rotY*rotZ;
}

mat2 Rotate2D(float angle)
{
    float c = cos(angle),   s = sin(angle);
    return mat2(c,s,-s,c);
}

vec2 hex0 = vec2(cos(tau * (1.0/12.0)), sin(tau * (1.0/12.0)));
vec2 hex1 = vec2(cos(tau * (3.0/12.0)), sin(tau * (3.0/12.0)));
vec2 hex2 = vec2(cos(tau * (5.0/12.0)), sin(tau * (5.0/12.0)));

float dhex(vec2 uv, float r)
{
    r *= cos(tau / 12.0);
    return max(max(abs(dot(uv, hex0)), abs( dot(uv, hex1) )), abs(dot(uv, hex2))) - r;
}

float dhexgrid(vec2 uv, float r)
{
	float sr = r * cos(tau / 12.0);
	
	vec2 repsz = vec2(r * 1.5, sr * 2.0);

	uv -= repsz;
	uv = mod(uv, repsz*2.0) - repsz;
	
	float d = dhex(uv, r);
	d = min(d, dhex(uv - vec2(r + r * 0.5, sr), r));
	d = min(d, dhex(uv - vec2(r + r * 0.5,-sr), r));
	d = min(d, dhex(uv + vec2(r + r * 0.5, sr), r));
	d = min(d, dhex(uv + vec2(r + r * 0.5,-sr), r));
	d = min(d, dhex(uv - vec2(0.0, sr + sr), r));
	d = min(d, dhex(uv + vec2(0.0, sr + sr), r));
	
	return d;
}

vec4 plane(vec3 o, vec3 d)
{
	vec3 n = normalize(vec3(0,1,0));
	float t = (dot(o, n) / max(0.0,dot(d, -n)));
	return vec4(o + d * t, t);
}

void main( void ) 
{
	vec2 aspect = resolution.xy / resolution.y;
	vec2 uv = (gl_FragCoord.xy / resolution.y);
	uv -= aspect/2.0;
	
	//Camera
	vec3 corig = vec3(0.4,0.8,-0.6);
	vec3 cdir = normalize(vec3(uv,1.0));
	cdir *= Rotate3D(vec3(-0.9,0.3,0.2));
	
	vec4 pl = plane(corig, cdir);   //3D Plane (w = depth)
	pl.xz *= Rotate2D(time * 0.1);  //Rotate the plane's surface
	
	//Shading
	float hdist = dhexgrid(pl.xz,0.08);
	float lnscale = pl.w / resolution.y;
	float cmix = smoothstep(0.0,-2.0*lnscale, (sin(time)*0.4+0.8)*hdist) + hdist;
	vec3 color = mix(vec3(3.1, 3.1, 0.5),vec3(0),cmix);
	color *= smoothstep(0.8,0.3,length(pl.xz));

	gl_FragColor = vec4(color, 1.0 );
}
