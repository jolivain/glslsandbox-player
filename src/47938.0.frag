/*
 * Original shader from: https://www.shadertoy.com/view/Mt2yDD
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);

// --------[ Original ShaderToy begins here ]---------- //
// Shader code:
// The MIT License https://opensource.org/licenses/MIT
// Copyright © 2017 Przemyslaw Zaworski
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

mat3 rotationX( float x) 
{
	return mat3
	(
		1.0,0.0,0.0,
		0.0,cos(x),sin(x),
		0.0,-sin(x),cos(x)
	);
}

mat3 rotationY( float y) 
{
	return mat3
	(
		cos(y),0.0,-sin(y),
		0.0,1.0,0.0,
		sin(y),0.0,cos(y)
	);
}

mat3 rotationZ( float y) 
{
	return mat3
	(
		cos(y),sin(y),0.0,
		-sin(y),cos(y),0.0,
        0.0,0.0,1.0
	);
}

float hash (vec2 n) 
{ 
	return fract(sin(dot(n, vec2(12.9898, 4.1414)))*43758.5453);
}

vec3 hash3( vec2 p )
{
    vec3 q = vec3( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)), dot(p,vec2(419.2,371.9)) );
	return fract(sin(q)*43758.5453);
}

vec3 sky (vec3 p) 
{
	p.y = max(p.y,0.0);
    float k = 1.0-p.y;
	return vec3(pow(k,20.0), pow(k,3.0), 0.3+k*0.2);
}

float capsule( vec3 p, vec3 a, vec3 b, float r )
{
    vec3 pa = p - a, ba = b - a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h ) - r;
}

float map_audience (vec3 p)
{
	vec2 u = floor(p.xz*0.6);
	float h = hash(u);
	h = p.y - 0.1*length(p.xz)*pow(h,sin(iTime*h*20.0)+2.0); ;
	return max( min( h, 0.4), p.y-0.1*length(p.xz));
}

float map_cage (vec3 p)
{
	float a =  capsule(p,vec3(-52.5,0,-3.6), vec3(-52.5,3.7,-3.6), 0.2  );
    float b =  capsule(p,vec3(-52.5,0,3.6), vec3(-52.5,3.7,3.6), 0.2  );
    float c =  capsule(p,vec3(-52.5,3.7,-3.6), vec3(-52.5,3.7,3.6), 0.2  );
	float d =  capsule(p,vec3(52.5,0,-3.6), vec3(52.5,3.7,-3.6), 0.2  );
    float e =  capsule(p,vec3(52.5,0,3.6), vec3(52.5,3.7,3.6), 0.2  );
    float f =  capsule(p,vec3(52.5,3.7,-3.6), vec3(52.5,3.7,3.6), 0.2  );    
    return min(a,min(b,min(c,min(d,min(e,f)))));
}

float map (vec3 p)
{
 	vec2 u = floor(p.xz*20.0);
	float h = hash(u);
	h = p.y - 1.0 * h ;
   	if (p.x<55.5 && p.x>-55.5 && p.z<37.0 && p.z>-37.0) return min(max( min( h, 0.1), p.y-1.0 ),map_cage(p));
	else return map_audience(p);
}
			
vec4 color (vec3 ro)
{
	float m = ro.y;
	vec4 light_grass = vec4(0.2,m*0.8,0.05,1);
    vec4 dark_grass = vec4(0.2,m*0.65,0.05,1);
	vec4 line1 = vec4 (0.9);
    vec3 d = hash3(floor(ro.xz*0.6));
    if (ro.x>=55.5 || ro.x<=-55.5 || ro.z>=37.0 || ro.z<=-37.0) return vec4(d,1);
    if (ro.x<0.15 && ro.x>-0.15 && ro.z>-34.0 && ro.z<34.0 ) return line1;
    if (length(ro.xz)<9.0 && length(ro.xz)>8.7) return line1;
    if (ro.x>52.2 && ro.x<52.5 && ro.z>-34.0 && ro.z<34.0 ) return line1;
    if (ro.x<-52.2 && ro.x>-52.5 && ro.z>-34.0 && ro.z<34.0 ) return line1;
    if (ro.z>33.7 && ro.z<34.0 && ro.x>-52.2 && ro.x<52.5) return line1;
    if (ro.z<-33.7 && ro.z>-34.0  && ro.x>-52.2 && ro.x<52.5) return line1; 
    
	if (ro.x>-36.15 && ro.x<-35.85 && ro.z<20.0 && ro.z>-20.0 ) return line1;
	if (ro.x>-52.5 && ro.x<-36.15 && ro.z<20.15 && ro.z>19.85) return line1;
	if (ro.x>-52.5 && ro.x<-36.15 && ro.z>-20.15 && ro.z<-19.85) return line1;    
	if (ro.x>-47.15 && ro.x<-46.85 && ro.z<10.0 && ro.z>-10.0 ) return line1;
	if (ro.x>-52.5 && ro.x<-47.15 && ro.z<10.15 && ro.z>9.85) return line1;
	if (ro.x>-52.5 && ro.x<-47.15 && ro.z>-10.15 && ro.z<-9.85) return line1;
    if (length(ro.xz+vec2(40.0,0.0))<9.0 && length(ro.xz+vec2(40.0,0.0))>8.7 && ro.x>-36.0) return line1;
 
	if (ro.x<36.15 && ro.x>35.85 && ro.z<20.0 && ro.z>-20.0 ) return line1;
	if (ro.x<52.5 && ro.x>36.15 && ro.z<20.15 && ro.z>19.85) return line1;
	if (ro.x<52.5 && ro.x>36.15 && ro.z>-20.15 && ro.z<-19.85) return line1;    
	if (ro.x<47.15 && ro.x>46.85 && ro.z<10.0 && ro.z>-10.0 ) return line1;
	if (ro.x<52.5 && ro.x>47.15 && ro.z<10.15 && ro.z>9.85) return line1;
	if (ro.x<52.5 && ro.x>47.15 && ro.z>-10.15 && ro.z<-9.85) return line1;
    if (length(ro.xz-vec2(40.0,0.0))<9.0 && length(ro.xz-vec2(40.0,0.0))>8.7 && ro.x<36.0) return line1;
  
    if (length(ro.xz+vec2(52.5,34.0))<3.0 && length(ro.xz+vec2(52.5,34.0))>2.7 && ro.x>-52.5 && ro.z>-34.0) return line1;
    if (length(ro.xz-vec2(52.5,34.0))<3.0 && length(ro.xz-vec2(52.5,34.0))>2.7 && ro.x<52.5 && ro.z<34.0) return line1;
    if (length(ro.xz+vec2(52.5,-34.0))<3.0 && length(ro.xz+vec2(52.5,-34.0))>2.7 && ro.x>-52.5 && ro.z<34.0) return line1;
    if (length(ro.xz+vec2(-52.5,34.0))<3.0 && length(ro.xz+vec2(-52.5,34.0))>2.7 && ro.x<52.5 && ro.z>-34.0) return line1;
    
    if (mod(ro.x,10.0)<5.0) return dark_grass;

	else return light_grass;
}
			
vec4 raymarch (vec3 ro, vec3 rd)
{
	for (int i=0; i<256; i++)
	{
		float t = map(ro);
        if (ro.x>300.0 || ro.x<-300.0 || ro.z>300.0 || ro.z<-300.0) break;
		if ( t<0.001 ) return color(ro);
		ro+=t*rd;
	}
	return vec4(sky(rd),1.0);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = (2.0*fragCoord.xy-iResolution.xy)/iResolution.y;
    vec3 ro,rd;
    if (iTime<4.0)
    {
    	 ro = vec3(-30.0+iTime*15.0,63,-58.0);
    	 rd = normalize(vec3(uv,2.0)*rotationX(5.4));
    }
    else
    if (iTime<=14.0)
    {
         ro = vec3(-100.0+iTime*10.0,15.0+sin(iTime),0.0);
    	 rd = normalize(vec3(uv,2.0)*rotationY(-1.5)*rotationZ(0.4)*rotationX(sin(iTime*0.5)));
    }
    else
    if (iTime<=22.0)
    {
         ro = vec3(0.0,15.0,-70.0+iTime*5.0);    	
    	 rd = normalize(vec3(uv,2.0)*rotationX(-0.4)*rotationY(iTime));
    }    
    else
    {
         ro = vec3(0,63,-58);
    	 rd = normalize(vec3(uv,2.0)*rotationX(5.4));       
    }
	fragColor = raymarch(ro,rd);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
