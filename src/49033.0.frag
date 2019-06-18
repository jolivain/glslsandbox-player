/*
 * Original shader from: https://www.shadertoy.com/view/XtKcDm
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);
vec4  iMouse = vec4(0.0);

#define iFrame (iTime * 60.)
#define iDate  vec3(0.)

// --------[ Original ShaderToy begins here ]---------- //

#define PI 3.14159265359
#define FOV (PI*0.4)
#define rot(a) mat2(cos(a + PI*0.5*vec4(0,1,3,0)))
#define BORDER 4.0

// hash function for dithering
vec3 hash33(vec3 p3) {
	p3 = fract(p3 * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yxz+19.19);
    return fract((p3.xxy + p3.yxx)*p3.zyx);
}

// hsv function
vec3 hsv2rgb( in vec3 c ) {
    vec3 rgb = clamp(abs(mod(c.x*6.+vec3(0,4,2),6.)-3.)-1.,0.,1.);
	return c.z * mix(vec3(1), rgb, c.y);
}

// from iq filterable procedurals
float grid( in vec3 p, in vec3 dp, in float N ) {
    vec3 w = abs(dp);
    vec3 a = p + 0.5*w;                        
    vec3 b = p - 0.5*w;           
    vec3 i = (floor(a)+min(fract(a)*N,1.0)-
              floor(b)-min(fract(b)*N,1.0))/(N*w);
    return 1.0-(1.0-i.x)*(1.0-i.y)*(1.0-i.z);
}

// iq smin
float smax( in float a, in float b, in float s ) {
    float h = clamp( 0.5 + 0.5*(a-b)/s, 0.0, 1.0 );
    return mix(b, a, h) + h*(1.0-h)*s;
}

// main distance function
float de( vec3 p, float r, out float color ) {
    
    float q = p.z;
    float t = length(p.xy);
    p = fract(p)-0.5;
    float d = 9e9;
    float s = 1.0;
    for (int i = 1 ; i <= 2 ; i++) {
        float m = dot(p,p);
        p = abs(fract(p/m)-0.5);
        p.xy *= rot(q);
        s *= m;
    }
    d = (length(p.xz)-0.15)*s;
    
    color = 0.0;
    color += grid(p*10.0*s, vec3(r)*s*500.0, 30.0)*0.2;
    color += grid(p*10.0*s-0.03, vec3(r)*s*500.0, 100.0)*0.8;
    
    return smax(d,-t, 0.3);
    
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    
    if (any(greaterThan(fragCoord, iResolution.xy-BORDER)) ||
        any(lessThan(fragCoord, vec2(BORDER)))) {
        fragColor = vec4(0);
        return;
    }
    
    bool page = false;
    vec2 uv = vec2(0);
    if (iResolution.x > iResolution.y) {
        uv = fragCoord/iResolution.xy;
        uv = uv.yx-0.5;
        uv.y *= iResolution.x/iResolution.y;
        page = true;
    } else {
        fragCoord = iResolution.xy-fragCoord;
    	uv = (fragCoord - iResolution.x*0.5) / iResolution.x;
    }
        
	vec3 from = vec3(0);
	vec3 dir = normalize(vec3(uv.x, 1.0 / tan(FOV*0.5), uv.y));
    
    mat2 rotx = rot(0.0);
	mat2 roty = rot(0.0);
    
	if (iMouse.z > 0.5) {
        vec2 delt = iMouse.xy-iMouse.zw;
        if (page) {
            delt = -delt.yx;
        }
        rotx = rot(-delt.x*0.004);
        roty = rot(delt.y*0.004);
    }
	
	dir.yz  *= roty;
	dir.xy  *= rotx;
    from.z += iTime*0.1;
    
    // dithering
    vec3 dither = hash33(vec3(fragCoord.xy, iFrame));
    
    // get the sine of the angular extent of a pixel
    float sinPix = sin(FOV / iResolution.x)*1.0;
    // accumulate color front to back
    vec2 acc = vec2(0, 1);

    float totdist = 0.0;
    float dummy = 0.0;
    totdist += dither.r*de(from, 0.0, dummy)*1.0;
    
	for (int i = 0 ; i < 80 ; i++) {
		vec3 p = from + totdist * dir;
        float r = totdist*sinPix;
        float color = 0.0;
        float dist = de(p, r, color);
        color *= 1.0 - float(i) / 70.0;
        
        // cone trace the surface
        float prox = dist / r;
        float alpha = clamp(prox * -0.5 + 0.5, 0.0, 1.0);
        
        if (alpha > 0.01) {
            // accumulate color
            acc.x += acc.y * (alpha*color);
            acc.y *= (1.0 - alpha);
        }
        
        // hit a surface, stop
        if (acc.y < 0.01) {
            break;
        }
        
        // continue forward
        totdist += abs(dist*0.6);
	}
    
    // set random color per day
    vec3 rnd = hash33(iDate.xyz);
    fragColor.rgb = hsv2rgb(vec3(totdist*0.3+rnd.x,
                                 0.4+rnd.y*0.2, 0.3+rnd.z*0.2));
    fragColor.rgb *= acc.x;
    // gamma correction
    fragColor.rgb = pow(fragColor.rgb, vec3(1.0/2.2));
    // dithering
    fragColor.rgb += (dither-0.5)*0.01;
    
	fragColor.a = 1.0;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);
    iMouse = vec4(mouse * resolution, 0.0, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
