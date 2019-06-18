/*
 * Original shader from: https://www.shadertoy.com/view/ld23z3
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
#define iResolution resolution

// Emulate a black texture
#define texture(s, uv) vec4(0.08)

// --------[ Original ShaderToy begins here ]---------- //
#define NUM_BUTTERFLIES 8

// float time;

// Noise functions from IQ.
float hash( float n ) { return fract(sin(n)*43758.5453123); }
float noise( in vec2 x )
{
    vec2 p = floor(x);
    vec2 f = fract(x);
    f = f*f*(3.0-2.0*f);
	
    float n = p.x + p.y*157.0;
    return mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                   mix( hash(n+157.0), hash(n+158.0),f.x),f.y);
}

float fbm2(vec2 p)
{
   float f = 0.0, x;
   for(int i = 1; i <= 9; ++i)
   {
      x = exp2(float(i));
      f += (noise(p * x) - 0.5) / x;
   }
   return f;
}


float sq(float x)
{
	return x*x;
}

vec2 rotate(float a,vec2 v)
{
	return vec2(cos(a)*v.x+sin(a)*v.y, cos(a)*v.y-sin(a)*v.x);
}

mat3 rotateXMat(float a)
{
	return mat3(1.0, 0.0, 0.0, 0.0, cos(a), -sin(a), 0.0, sin(a), cos(a));
}

mat3 rotateYMat(float a)
{
	return mat3(cos(a), 0.0, -sin(a), 0.0, 1.0, 0.0, sin(a), 0.0, cos(a));
}

vec3 wing0Node(int i)
{
	if(i<1)
		return vec3(-0.23,0.0,1.0);
	if(i<2)
		return vec3(-0.7,0.25,1.0);
	if(i<3)
		return vec3(-0.4,0.8,1.0);
	if(i<4)
		return vec3(-0.8,0.24,1.3);
	if(i<5)
		return vec3(-0.8,0.84,0.6);
	if(i<6)
		return vec3(-0.9,0.4,1.2);
	if(i<7)
		return vec3(-1.04,0.6,1.2);
	return vec3(-0.1,-0.1,1.0);
}

vec3 wing1Node(int i)
{
	if(i<1)
		return vec3(0.1,0.3,1.0);
	if(i<2)
		return vec3(-0.3,0.4,1.0);
	if(i<3)
		return vec3(-0.3,0.2,1.0);
	if(i<4)
		return vec3(-0.25,-0.1,1.0);
	if(i<5)
		return vec3(-0.2,-0.25,1.0);
	if(i<6)
		return vec3(-0.05,-0.5,1.0);
	return vec3(0.5,-0.2,1.0);
}

vec3 wing0NodeTransformed(int i)
{
	return (wing0Node(i)+vec3(-0.7,-0.05,0.0))*vec3(vec2(1.2,1.0)*0.7,1.0);
}

vec3 wing1NodeTransformed(int i)
{
	return (wing1Node(i)+vec3(-0.7,-0.05,0.0))*vec3(vec2(1.2,1.0)*0.7,1.0);
}

vec3 wing0Tex(vec2 p)
{
	p=rotate(-0.7,p+vec2(0.3,0.0));
	
	float a=1e3;
	float b=1e3;
	
	int cn=0;
	float cnd=1e3;
	for(int i=0;i<8;i+=1)
	{
		float d=distance(p,wing0NodeTransformed(i).xy);
		if(d<cnd)
		{
			cnd=d;
			cn=i;
		}
	}
	
	float s=0.04+pow(max(0.0,-p.y*0.4),1.3)+pow(max(0.0,-p.x-1.0),1.3)*0.1;
	
	s+=0.2*(1.0-smoothstep(0.0,0.4,distance(p,vec2(-1.2,0.2)))) +
		0.2*(1.0-smoothstep(0.0,0.3,distance(p,vec2(-1.0,0.5))));
	
	float c=0.0;
	for(int j=0;j<8;j+=1)
	{
		if(j==cn)
			continue;
		
		vec3 n0=wing0NodeTransformed(cn);
		vec3 n1=wing0NodeTransformed(j);
		vec2 nd=n1.xy-n0.xy;
		float d=dot(p-(n0.xy+nd*0.5),normalize(nd))+s*n0.z;
		c+=sq(max(0.0,d));
	}
	
	float p0=sq(max(0.0,dot(p-vec2(-0.5,0.0),normalize(vec2(1.0,-0.9)))));
	
	c+=sq(max(0.0,(distance(p+vec2(0.6,1.45),vec2(0.0))-2.0+s))) + p0 +
		sq(max(0.0,dot(p-vec2(-0.6,-0.2),normalize(vec2(-0.3,-0.9)))));
	
	float c2=sq(max(0.0,(distance(p+vec2(0.6,1.55),vec2(0.0))-2.0))) + p0 +
		sq(max(0.0,dot(p-vec2(-0.6,-0.2),normalize(vec2(-0.3,-0.9)))-0.1));
	
	vec2 xa=vec2(-1.7,-0.0),xb=vec2(-0.8,-0.3);
	vec2 xs=vec2(0.6,1.0);

	vec2 u=mix(xa,xb,floor(clamp(dot(p-xa,xb-xa)/dot(xb-xa,xb-xa),0.0,1.0)*5.0+0.5)/5.0);
	
 	float x=max(1.0-smoothstep(0.06,0.07,distance(p,vec2(-1.2,0.3))),
				1.0-smoothstep(0.02,0.025,length((p-u)*xs)));
	
	return vec3(1.0-smoothstep(s-0.015,s-0.015+0.006,sqrt(c)),1.0-smoothstep(0.1,0.106,sqrt(c2)-0.03),x);
}

vec3 wing1Tex(vec2 p)
{
	p=p+vec2(0.0,0.16);
	
	float a=1e3;
	float b=1e3;
	
	int cn=0;
	float cnd=1e3;
	for(int i=0;i<7;i+=1)
	{
		float d=distance(p,wing1NodeTransformed(i).xy);
		if(d<cnd)
		{
			cnd=d;
			cn=i;
		}
	}
	
	float s=0.04+pow(max(0.0,-p.y*0.4),1.3)+pow(max(0.0,-p.x-1.0),1.3)*0.1;
	
	float c=0.0;
	for(int j=0;j<7;j+=1)
	{
		if(j==cn)
			continue;
		
		vec3 n0=wing1NodeTransformed(cn);
		vec3 n1=wing1NodeTransformed(j);
		vec2 nd=n1.xy-n0.xy;
		float d=dot(p-(n0.xy+nd*0.5),normalize(nd))+s*n0.z;
		c+=sq(max(0.0,d));
	}
	
	float p0=sq(max(0.0,dot(p-vec2(-0.5,-0.4),normalize(vec2(1.0,-0.7)))));
	float p1=sq(max(0.0,dot(p-vec2(-0.3,0.3),normalize(-vec2(0.1,-0.9)))));
	
	c+=sq(max(0.0,(distance(p+vec2(0.52,-0.1),vec2(0.0))-0.5))) + p0 + p1;
	
	float c2=sq(max(0.0,(distance(p+vec2(0.5,-0.0),vec2(0.0))-0.53))) + p0 + p1;
	
	float xr=0.7;
	vec2 xa=vec2(-0.4,0.05);
	
	vec2 pd=rotate(-0.2,p-xa);
	float ang=mix(-3.1,-1.8,floor((clamp(atan(pd.y,pd.x),-3.1,-1.8)+3.1)/1.299*6.0+0.5)/6.0);
	
	float x=1.0-smoothstep(0.02,0.025,distance(pd,vec2(cos(ang),sin(ang))*xr));

	return vec3(1.0-smoothstep(s-0.015,s-0.015+0.006,sqrt(c)),1.0-smoothstep(0.1,0.106,sqrt(c2)-0.03),x);
}

vec4 wing(vec2 p)
{
	p+=fbm2(p*4.0)*0.02;

	vec3 wc=mix(vec3(1.0,0.5,0.15),vec3(2.0,0.5,0.15)*0.3,
				fbm2(p*vec2(1.0,16.0))*0.26+pow(clamp((p.y*4.0-abs(p.x)*2.0)/3.0,0.0,1.0),2.0))*0.8;
	
	wc=pow(wc,vec3(1.5));
	
	vec3 c0=wing0Tex(p);
	vec3 c1=wing1Tex(p);
	
	vec3 col=vec3(0.0);
	
	col.rgb=mix(mix(vec3(0.0),c0.x*wc,c0.y),c1.x*wc,c1.y);
	col.rgb=mix(col.rgb,vec3(1.0),c0.z);
	col.rgb=mix(col.rgb,vec3(1.0),c1.z);
	
	return vec4(col,max(c0.y,c1.y));
}

vec3 traceButterflyWing(vec3 ro,vec3 rd,vec3 bo,vec3 bd,float flap)
{
	vec3 up=vec3(0.0,1.0,0.0);
	vec3 c=cross(bd,up);
	float flapangle=mix(radians(20.0),radians(150.0),flap);
	vec3 w=cos(flapangle)*c+sin(flapangle)*up;
	float t=-dot(ro,w)/dot(rd,w);
	vec3 s=cross(w,bd);
	vec3 rp=ro+rd*t;
	return vec3(dot(rp,s),dot(rp,bd),t);
}

vec4 traceButterfly(vec3 ro,vec3 rd,vec3 bo,vec3 bd,float flap)
{
	flap=pow(flap,0.75);
	bo.y-=flap*0.5;
	ro-=bo;
	vec3 up=vec3(0.0,1.0,0.0);
	vec3 c=cross(bd,up);
	
	vec3 w0=traceButterflyWing(ro,rd,bo,bd,flap);
	
	ro-=dot(ro,c)*2.0*c;
	rd-=dot(rd,c)*2.0*c;
	
	vec3 w1=traceButterflyWing(ro,rd,bo,bd,flap);

	if ( max(abs(w0.x),abs(w0.y)) > 2.0 && max(abs(w1.x),abs(w1.y)) > 2.0 )
		return vec4(0,0,0,1e4);
	
	vec4 c0=wing(w0.xy);
	vec4 c1=wing(w1.xy);
	
	bool u0=c0.a>0.0 && w0.z>0.0;
	bool u1=c1.a>0.0 && w1.z>0.0;
	
	if(!u0 && !u1)
		return vec4(0.0,0.0,0.0,1e4);
	else if(u0 && !u1)
		return vec4(c0.rgb,w0.z);
	else if(!u0 && u1)
		return vec4(c1.rgb,w1.z);
	else
		return mix(vec4(c0.rgb,w0.z),vec4(c1.rgb,w1.z),step(w1.z,w0.z));
}

vec3 butterflyPath(float t)
{
	return vec3(cos(t),cos(t*0.22)*1.0+sin(t*4.0)*0.1,sin(t*1.3))*4.0;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
	vec2 q=uv;
	uv=uv*2.0-vec2(1.0);
	uv.x*=iResolution.x/iResolution.y;
	// time=iTime;
	mat3 m=rotateYMat(time*0.2)*rotateXMat(cos(time*0.12)*0.7);
	
	vec3 ro=m*vec3(0.0,0.0,7.0),rd=m*normalize(vec3(uv,-1.2));
	
	vec3 c=vec3(0.0);
	float d=1e3;
	
	for(int i=0;i<NUM_BUTTERFLIES;i+=1)
	{
		float t=time+float(i)*10.2;
		vec3 bo=butterflyPath(t);
		vec4 b=traceButterfly(ro,rd,bo,vec3(normalize(butterflyPath(t+1e-2).xz-bo.xz),0.0).xzy,0.5+0.5*cos(t*9.0));
		c=mix(c,b.rgb,step(b.a,d));
		d=min(d,b.a);
	}
	
	fragColor.rgb=mix(texture(iChannel0,rd).rgb,mix(c,texture(iChannel0,rd).rgb,0.01+0.2*dot(c,vec3(1.0/3.0))),step(d,1e2));
	fragColor.rgb=sqrt(fragColor.rgb);
	// IQ's vignet.
	fragColor.rgb *= pow( 16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y), 0.1 );
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
