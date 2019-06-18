//Procedural Cubemaps by nimitz (twitter: @stormoid)

/*
	Follow up on my "sphere mappings" shader(https://www.shadertoy.com/view/4sjXW1).
	Using said mapping to draw a procedural	4-way symmetrical texture.

	As far as I know, wallpaper group p4mm needs to be used for this to work
	without symmetry issues (http://en.wikipedia.org/wiki/Wallpaper_group#Group_p4mm)
	(Otherwise you need to map the faces independently)

	The procedural symmetric texture is from my "Colorful tessellation" shader
	(https://www.shadertoy.com/view/lslXDn)
*/

#ifdef GL_ES
precision mediump float;
#endif


uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

#define POST

float hash2(in vec2 n){ return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }

mat2 mm2(in float a){float c = cos(a), s = sin(a);return mat2(c,-s,s,c);}

vec2 field(in vec2 x)
{
    vec2 n = floor(x);
	vec2 f = fract(x);
	vec2 m = vec2(5.,1.);
	for(int j=0; j<=1; j++)
	for(int i=0; i<=1; i++)
    {
		vec2 g = vec2( float(i),float(j) );
		vec2 r = g - f;
        float d = length(r)*(sin(time*0.12)*0.5+1.5); //any metric can be used
        d = sin(d*5.+abs(fract(time*0.1)-0.5)*1.8+0.2);
		m.x *= d;
		m.y += d*1.2;
    }
	return abs(m);
}

vec3 tex(in vec2 p, in float ofst)
{    
    vec2 rz = field(p*ofst*0.5);
	vec3 col = sin(vec3(2.,1.,.1)*rz.y*.2+3.+ofst*2.)+.9*(rz.x+1.);
	col = col*col*.5;
    col *= sin(length(p)*9.+time*5.)*0.35+0.65;
	return col;
}

vec3 cubem(in vec3 p, in float ofst)
{
    p = abs(p);
    if (p.x > p.y && p.x > p.z) return tex( vec2(p.z,p.y)/p.x,ofst );
    else if (p.y > p.x && p.y > p.z) return tex( vec2(p.z,p.x)/p.y,ofst );
    else return tex( vec2(p.y,p.x)/p.z,ofst );
}

float sphere(in vec3 ro, in vec3 rd)
{
    float b = dot(ro, rd);
    float c = dot(ro, ro) - 1.;
    float h = b*b - c;
    if(h <0.0) return -1.;
    else return -b - sqrt(h);
}

void main()
{	
	vec2 p = gl_FragCoord.xy / resolution.xy-0.5;
    vec2 bp = p+0.5;
	p.x*=resolution.x/resolution.y;
	vec2 um = mouse.xy / resolution.xy-.5;
	um.x *= resolution.x/resolution.y;
	
    //camera
	vec3 ro = vec3(0.,0.,4.);
    vec3 rd = normalize(vec3(p,-1.6));
    mat2 mx = mm2(time*0.25+um.x*5.);
    mat2 my = mm2(time*0.27+um.y*5.); 
    ro.xz *= mx;rd.xz *= mx;
    ro.xy *= my;rd.xy *= my;
    
    float sel = mod(floor(time*0.3),4.);
    
    float t = sphere(ro,rd);
    vec3 col = vec3(0);
    float bg = clamp(dot(-rd,vec3(0.577))*0.3+.6,0.,1.);
    col = cubem(rd,3.)*bg*.4;
    
    if (t > 0.)
    {
    	vec3 pos = ro+rd*t;
        vec3 rf = reflect(rd,pos);
        float dif = clamp(dot(rd,vec3(0.577))*0.3+.6,0.,1.);
        col = (cubem(rf,3.)*0.015+cubem(pos,1.)*0.7)*dif;
    }
    
    #ifdef POST
    //vign from iq (very nice!)
	col *= pow(16.0*bp.x*bp.y*(1.0-bp.x)*(1.0-bp.y),.45);
    col *= sin(bp.y*450.*resolution.y+time*0.1)*0.02+1.;
    #endif
    
	gl_FragColor = vec4(pow(col,vec3(0.7)), 1.0);
}
