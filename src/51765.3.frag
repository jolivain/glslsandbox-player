/*
 * Original shader from: https://www.shadertoy.com/view/wss3zB
 */


#ifdef GL_ES
precision highp float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);

// --------[ Original ShaderToy begins here ]---------- //
// Spiral Offset II - Del 06/01/2018
// watch fullscreen, params have been tweaked to overlap and never loop... :)
// keep watching... :)

#define TAU 6.283185

vec2 rot(vec2 v, float angle)
{
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c)*v;
}

// IQ UnevenCapsule distance func
float cro(in vec2 a, in vec2 b ) { return a.x*b.y - a.y*b.x; }
float sdUnevenCapsule( in vec2 p, in vec2 pa, in vec2 pb, in float ra, in float rb )
{
    p  -= pa;
    pb -= pa;
    float h = dot(pb,pb);
    vec2  q = vec2( dot(p,vec2(pb.y,-pb.x)), dot(p,pb) )/h;
    
    //-----------
    
    q.x = abs(q.x);
    
    float b = ra-rb;
    vec2  c = vec2(sqrt(h-b*b),b);
    
    float k = cro(c,q);
    float m = dot(c,q);
    float n = dot(q,q);
    
         if( k < 0.0 ) return sqrt(h*(n            )) - ra;
    else if( k > c.x ) return sqrt(h*(n+1.0-2.0*q.y)) - rb;
                       return m                       - ra;
}

float TimerInOut(vec4 v)
{
    return smoothstep(v.y,v.y+v.w,v.x) - smoothstep(v.z-v.w,v.z,v.x);
}
float Stime(float scale)
{
    return fract(iTime*scale)*TAU;
}
float Mtime(float mval)
{
    return mod(iTime,mval);
}

// Trippy spiral calc - Del 06/01/2018
vec2 spiral(vec2 uv,float zoom, float len, float offset,vec2 capoff, float trip, float scount)
{
    float d = length(uv) * zoom;
    d=log(d*trip);
    uv = rot(uv,sin(d*offset)+d*scount);
	float v = 1.0-sdUnevenCapsule(uv,vec2(0.0,0.0)+capoff,vec2(0.4*len,0.0)+capoff,0.0,0.4*len)*14.0;
    return vec2(v,d);	// dx , dy
}

vec2 directionalWaveNormal(vec2 p, float amp, vec2 dir, float freq, float speed, float time, float k)
{	
	float a = dot(p, dir) * freq + time * speed;
	float b = 0.5 * k * freq * amp * pow((sin(a) + 1.0) * 0.5, k) * cos(a);
	return vec2(dir.x * b, dir.y * b);
}

vec3 summedWaveNormal(vec2 p)
{
    float time = iTime;
	vec2 sum = vec2(0.0);
	sum += directionalWaveNormal(p, 0.5, normalize(vec2(1, 1)), 5.0, 1.5, time, 1.0);
	sum += directionalWaveNormal(p, 0.25,normalize(vec2(1.4, 1.0)), 11.0, 2.4, time, 1.5);
	sum += directionalWaveNormal(p, 0.125, normalize(vec2(-0.8, -1.0)), 10.0, 2.0, time, 2.0);
	sum += directionalWaveNormal(p, 0.0625, normalize(vec2(1.3, 1.0)), 15.0, 4.0, time, 2.2);
	sum += directionalWaveNormal(p, 0.03125, normalize(vec2(-1.7, -1.0)), 5.0, 1.8, time, 3.0);
	return normalize(vec3(-sum.x, -sum.y, 1.0));
}
vec3 background(vec2 p)
{
	vec3 normal = summedWaveNormal(p);
	vec3 c = mix(vec3(0.1, 0.15, 0.1), vec3(0.2, 0.25, 0.4),  dot(normal, normalize(vec3(0.2, 0.2, 0.5))) * 0.5 + 0.5);
	c = mix(c, vec3(0.7, 0.9, 1.0), pow(dot(normal, normalize(vec3(-0.4, 0.1, 1.0))) * 0.5 + 0.5, 2.0));
	c = mix(c, vec3(0.95, 0.98, 1.0), pow(dot(normal, normalize(vec3(-0.1, -0.3, 0.5))) * 0.5 + 0.5, 10.0));
    return clamp(c,0.0,1.0);
}

float Bub(vec2 uv,float scale)
{
    float time = iTime*0.75;
    uv.y-=time*2./scale;
    //uv.x += time*0.2;
    uv.x+=sin(uv.y+time*.95)*0.025;	///scale;
	uv*=scale;
    vec2 s=floor(uv);
    vec2 f=fract(uv);
    float k=3.0;
	vec2 p =.5+.35*sin(11.*fract(sin((s+scale)*mat2(7.0,3.0,6.0,5.0))*5.))-f;
    float d=length(p);
    k=min(d,k);
	k=smoothstep(0.0,k,sin(f.x+f.y)*0.01);
   	return k;
}

vec3 Bubbles(vec2 uv,float head,float d)
{
	float c = Bub(uv,30.)*.3;
	c+=Bub(uv,20.)*.5;
	c+=Bub(uv,15.)*.8;
	c+=Bub(uv,10.);
	c+=Bub(uv,8.);
	c+=Bub(uv,6.);
	c+=Bub(uv,5.);
    vec3 scol = vec3(clamp(c*0.3,0.0,0.3));
    return scol;
}

vec3 checks(vec2 p)
{
    //p*=1.0+(sin(p.y+p.x+Stime(0.25))*0.15);
    //float f = mod( floor(5.5*p.x) + floor(5.5*p.y), 2.0);
    //vec3 col = 0.05 + 0.1*f+0.2*vec3(0.1,0.1,0.1);
    //return col;
    
    float d = length(p);
    float head = 1.0-length(p);
    d+=(0.5+sin(iTime*2.0)*0.5)*0.25;
    p *= 0.25;
    return Bubbles(p*(d+0.5), head,d);
}

vec3 hsv2rgb_smooth( in vec3 c )
{
    vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );

	rgb = rgb*rgb*(3.0-2.0*rgb); // cubic smoothing	

	return c.z * mix( vec3(1.0), rgb, c.y);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;

    // Create some blends over time...
    float t1 = TimerInOut(vec4(Mtime(9.6),1.0, 7.2, 1.8));
    float t2 = TimerInOut(vec4(Mtime(12.0),1.0, 9.0, 1.5));
    float t3 = TimerInOut(vec4(Mtime(21.0),6.0, 14.2, 2.8));
    float t4 = TimerInOut(vec4(Mtime(60.0),15.0,45.0,1.0));
    float t5 = TimerInOut(vec4(Mtime(85.0),57.0, 67.0, 3.1));
    float t6 = TimerInOut(vec4(Mtime(123.0),77.0,101.0,10.0));
    float t7 = TimerInOut(vec4(Mtime(50.0),28.0,45.0,3.5));
    float t8 = TimerInOut(vec4(Mtime(20.0),1.0,13.0,3.1));
    float t9 = TimerInOut(vec4(Mtime(200.0),100.0,199.0,0.5));
    float t10 = TimerInOut(vec4(Mtime(45.0),21.0,31.0,0.75));

    // various spiral modifiers applied over time
    float t = Stime(0.4);
    float offset = 25.0 * t1;
	float zoom = 1.0 + (sin(Stime(0.17))*0.5) * t2;
    vec2 capoff = vec2(sin(uv.y*4.0+Stime(0.125))*0.25, sin(uv.x*2.0+Stime(0.25))*0.75) * t3;
    float m = 0.48+sin(Stime(0.15)+uv.y+uv.x)*0.5;
    float trip = 1.0-(m*t4);
    float scmod = sin(Stime(0.176));
    float scount = 5.0+((3.0+(scmod*5.0))*t5);
    
    // debug... (disable effects)
    //scount = 5.0;
    //offset=0.0;
    //zoom = 1.0;
    //trip = 1.0;
    //capoff = vec2(0.0);
    
	vec2 dist = spiral(uv, zoom, t, offset, capoff, trip, scount);
	
    float distmod = 0.49+sin(dist.x*0.34+dist.y*1.6+sin(Stime(.1)))*0.5;
    dist.x = mix(dist.x, dist.x*distmod, t10);
	
	
	float v2 = smoothstep(0.5-0.1,0.5+0.1,dist.x);
	float v = mix(v2,clamp(dist.x,0.0,3.0), t6);
    //vec3 col = vec3(v*1.0-l/t);
    vec3 col1 = checks(uv);	////vec3(0.0,0.0,0.2);
    vec3 col2 = vec3(1.0,0.6,0.5);
    // rainbow flavour...
    col2 = mix(col2,hsv2rgb_smooth(vec3(fract(iTime*0.1)+dist.x*0.1,1.0,v)),t9);
	
    vec3 col3 = background(uv);	//vec3(0.5,0.7,0.5);
    col1 = mix(col1,col3*0.3, t7);
    col2 = mix(col2,col3, t8);
    vec3 col = mix(col1,col2,v*1.0-dist.y/t);

    // vignette
 	vec2 q = fragCoord/iResolution.xy;
    col *= 0.3 + 0.7*pow(16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y),0.25);    
    
    fragColor = vec4(col, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
