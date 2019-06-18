#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

//Testing letters made from arcs and quads.

float dfSemiArc(float rma, float rmi, vec2 uv)
{
	return max(abs(length(uv) - rma) - rmi, uv.x-0.0);
}

float dfQuad(vec2 p0, vec2 p1, vec2 p2, vec2 p3, vec2 uv)
{
	vec2 s0n = normalize((p1 - p0).yx * vec2(-1,1));
	vec2 s1n = normalize((p2 - p1).yx * vec2(-1,1));
	vec2 s2n = normalize((p3 - p2).yx * vec2(-1,1));
	vec2 s3n = normalize((p0 - p3).yx * vec2(-1,1));
	
	return max(max(dot(uv-p0,s0n),dot(uv-p1,s1n)), max(dot(uv-p2,s2n),dot(uv-p3,s3n)));
}

float dfRect(vec2 size, vec2 uv)
{
	return max(max(-uv.x,uv.x - size.x),max(-uv.y,uv.y - size.t));
}

//--- Letters ---
void G(inout float df, vec2 uv)
{
	
	df = min(df, dfSemiArc(0.5, 0.125, uv));
	df = min(df, dfQuad(vec2(0.000, 0.375), vec2(0.000, 0.625), vec2(0.250, 0.625), vec2(0.125, 0.375), uv));
	df = min(df, dfRect(vec2(0.250, 0.50), uv - vec2(0.0,-0.625)));
	df = min(df, dfQuad(vec2(-0.250,-0.125), vec2(-0.125,0.125), vec2(0.250,0.125), vec2(0.250,-0.125), uv));	
}

void L(inout float df, vec2 uv)
{
	df = min(df, dfRect(vec2(0.250, 1.25), uv - vec2(-0.625,-0.625)));
	df = min(df, dfQuad(vec2(-0.375,-0.625), vec2(-0.375,-0.375), vec2(0.250,-0.375), vec2(0.125,-0.625), uv));	
}

void S(inout float df, vec2 uv)
{
	df = min(df, dfSemiArc(0.25, 0.125, uv - vec2(-0.250,0.250)));
	df = min(df, dfSemiArc(0.25, 0.125, (uv - vec2(-0.125,-0.25)) * vec2(-1)));
	df = min(df, dfRect(vec2(0.125, 0.250), uv - vec2(-0.250,-0.125)));
	df = min(df, dfQuad(vec2(-0.625,-0.625), vec2(-0.500,-0.375), vec2(-0.125,-0.375), vec2(-0.125,-0.625), uv));	
	df = min(df, dfQuad(vec2(-0.250,0.375), vec2(-0.250,0.625), vec2(0.250,0.625), vec2(0.125,0.375), uv));
}
//----------------------
float linstep(float x0, float x1, float xn)
{
	return (xn - x0) / (x1 - x0);
}
//----------------------
vec3 retrograd(float x0, float x1, vec2 uv)
{
	float mid = -0.2;// + sin(uv.x*24.0)*0.01;

	vec3 grad1 = mix(vec3(0.60, 0.90, 1.00), vec3(0.05, 0.05, 0.40), linstep(mid, x1, uv.y));
	vec3 grad2 = mix(vec3(1.90, 1.30, 1.00), vec3(0.10, 0.10, 0.00), linstep(x0, mid, uv.y));

	return mix(grad2, grad1, smoothstep(mid, mid + 0.008, uv.y));
}
//----------------------
const vec3 color1 = vec3(-1., 0., 0.9);
const vec3 color2 = vec3(0.9, 0., 0.9);

float cdist(vec2 v0, vec2 v1)
{
  v0 = abs(v0 - v1);
  return max(v0.x, v0.y);
}

vec3 gridColor()
{
  vec2 uv = gl_FragCoord.xy / resolution.y;
  vec2 cen = resolution.xy / resolution.y / 2.;
  vec2 gruv = uv - cen;
  gruv = vec2(gruv.x * abs(1./gruv.y), abs(1./gruv.y));
  gruv.y += time;
  gruv.x += 0.5*sin(time);

  float grid = 2. * cdist(vec2(0.5), mod(gruv,vec2(1.)));
		
  float gridmix = max(pow(grid,6.), smoothstep(0.93,0.96,grid) * 2.);

  vec3 gridcol = (mix(color1, color2, uv.y*2.) + 1.2) * gridmix;
  gridcol *= linstep(0.1, 2.0, abs(uv.y - cen.y));
  return gridcol;
}
//----------------------
void main( void ) 
{
	vec2 uv = gl_FragCoord.xy / resolution.y;
	vec2 aspect = resolution.xy / resolution.y;
	
	uv = (uv - aspect/2.0)*4.0;

	float dist = 1e6;
	float charSpace = 1.125;
	
	vec2 chuv = uv;
	chuv.x += charSpace * 1.5;
		
	G(dist, chuv); chuv.x -= charSpace;
	L(dist, chuv); chuv.x -= charSpace;
	S(dist, chuv); chuv.x -= charSpace;
	L(dist, chuv); chuv.x -= charSpace;
	
	float mask = smoothstep(4.0 / resolution.y, 0.0, dist);
	
	vec3 backcol = gridColor();

	vec3 textcol = retrograd(-0.75,0.50,uv + vec2(0.0,-pow(max(0.0,-dist*0.1),0.5)*0.2));
	
	vec3 color = mix(backcol,textcol,mask);
	
	gl_FragColor = vec4( vec3( color ), 1.0 );
}
