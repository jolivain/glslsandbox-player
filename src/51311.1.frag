/*
 * Original shader from: https://www.shadertoy.com/view/4lVyzh
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
#define iTime time
#define iResolution resolution
const vec4 iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
#define pi 3.1415926
vec3 light = vec3(0.);
float smin( float a, float b ) //iq
{	float k = 4e-3;
    // http://iquilezles.org/www/articles/smin/smin.htm
    float h = max(k-abs(a-b),0.0);
    return min(a, b) - h*h*0.25/k;
}
float ln (vec3 p, vec3 a, vec3 b, float R) { 
    float r = dot(p-a,b-a)/dot(b-a,b-a);
    r = clamp(r,0.,1.);
    p.x+= R*smoothstep(1.,0.,abs(r*2.-1.))*cos(pi*(2.*iTime));
    return length(p-a-(b-a)*r)-R*(1.5-0.4*r);
}
mat2 ro (float a) {
	float s = sin(a), c = cos(a);
    return mat2(c,-s,s,c);
}
float map (vec3 p) {
    float l = length(p-light)-1e-3;
    l = min(l,abs(p.y+0.4)-1e-2);
    l = min(l,abs(p.z-0.4)-1e-2);
    l = min(l,abs(p.x-0.7)-1e-2);
    p.y += 0.4;
    p.zx *= ro(.5*iTime);
    vec2 rl = vec2(0.02,.25+ 0.01*sin(pi*4.*iTime));
    for (int i = 1; i < 10; i++) {
        
        l = smin(l,ln(p,vec3(0),vec3(0,rl.y,0),rl.x));
    	p.y -= rl.y;
        p.xy *= ro(-0.3*sin(0.4*pi*iTime)+sin(0.543*iTime)/max(float(i),2.));
        p.x = abs(p.x);
        p.xy *= ro(0.6+0.1*sin(iTime)+0.05*float(i)*sin(2.*iTime));
        p.zx *= ro(0.5*pi+0.5*sin(0.5278*iTime)+0.1*float(i)*sin(0.212*iTime));
        
        rl *= (.7+0.015*float(i)*sin(iTime));
    }
	return min(l,length(p)-0.007);
}

vec3 march (vec3 p, vec3 d) {
    float o = 1e3;
    for (int i = 0; i < 24; i++) {
        float l = map(p);
    	p += l*d;
        if (l < 1e-3)break;
    }
    return p;
}
vec3 norm (vec3 p) { // iq
		vec2 e = vec2 (.001,0.);
		return normalize(vec3(
				map(p+e.xyy) - map(p-e.xyy),
				map(p+e.yxy) - map(p-e.yxy),
				map(p+e.yyx) - map(p-e.yyx)
			));
	}
void mainImage( out vec4 C, in vec2 U )
{   vec2 R = iResolution.xy;
    light = vec3(0.2*sin(iTime),0.5,-.5);
    if (iMouse.z > 0.) light = vec3(vec2(-0.5,0.5)+0.5*(iMouse.xy-0.5*R)/R.y,-.5);
    
    U = (U-0.5*R)/R.y;
    vec3 p = vec3(0,0,-1);
    vec3 d = normalize(vec3(U,1));
    p =  march(p,d);
    vec3 n = norm(p);
    
	C = vec4( 6.*vec3(0.7,0.5,1)*(refract(d,n,.7)*0.5+0.5),1);
    
    vec3 D = light-p;
    d = normalize(D);
    p = march(p+d*3e-3,d);
    float sh = length(D)-length(light-p);
    C *= sh*dot(d,n);
    C = atan(C)/pi*2.;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
