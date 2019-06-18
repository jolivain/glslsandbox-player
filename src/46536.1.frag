/*
 * Original shader from: https://www.shadertoy.com/view/XdcfR8
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
const vec3 iMouse = vec3(0.);

// --------[ Original ShaderToy begins here ]---------- //
#define PI 3.14159265359
#define rot(a) mat2(cos(a+PI*vec4(0,1.5,0.5,0)))
#define SCALE 4.0
#define FOV 1.0

//f (x)=sin(a*x)*b
//f'(x)=a*b*cos(a*x)
#define PATHA vec2(0.1147, 0.2093)
#define PATHB vec2(13.0, 3.0)
vec3 camPath( float z ) {
    return vec3(sin(z*PATHA)*PATHB, z);
}
vec3 camPathDeriv( float z ) {
    return vec3(PATHA*PATHB*cos(PATHA*z), 1.0);
}

float sdBox( in vec3 p, in vec3 b, in float r, out vec3 color ) {
   	vec3 d = abs(p) - b;
    color = normalize(smoothstep(vec3(-r), vec3(0.0), d));
	return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float de( in vec3 p, in float r, out vec3 color ) {
    
    // wrap world around camera path
    vec3 wrap = camPath(p.z);
    vec3 wrapDeriv = normalize(camPathDeriv(p.z));
    p.xy -= wrap.xy;
    p -= wrapDeriv*dot(vec3(p.xy, 0), wrapDeriv)*0.5*vec3(1,1,-1);
    
    // change the fractal rotation along an axis
    float q=p.z*0.074;
    
    // accumulate scale and distance
    float s = 1.0;
    float d = 9e9;
    
    // accumulate color
    vec3 albedo = vec3(0);
    float colorAcc = 0.0;
    
    for (float i = 0.5 ; i < 4.0 ; i += 1.14124) {
        p.xy *= rot(-i*1.5*q);
        p.xyz = p.zxy;
        p.xy = abs(fract(p.xy)*SCALE-SCALE*0.5);
        p.z *= SCALE;
        
        s /= SCALE;
        
        vec3 cube = vec3(0);
        float dist = sdBox(p, vec3(1.07, 0.54+i*0.5, 4.47+i*0.1), r, cube)*s;
        float co = cube.x*0.2+cube.y*0.4+cube.z*0.8;
        vec3 col = clamp(vec3(co*i*0.1), vec3(0), vec3(0.6));
        
        float alpha = max(0.001, smoothstep(r, -r, dist));
        albedo += col*alpha;
        colorAcc += alpha;

        if (i < 2.0) {
        	d = min(d, dist);
        } else {
            d = max(d,-dist);
        }
    }
    
    color = albedo/colorAcc;
    
    return d;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    
    float z = iTime*1.0;
    vec3 from = camPath(z);
    vec2 uv = (fragCoord - iResolution.xy*0.5)/iResolution.y;
    vec3 forward = normalize(camPathDeriv(z));
    vec3 right = normalize(cross(forward, vec3(0, 1, 0)));
    vec3 up = cross(right, forward);
    vec3 dir = normalize(forward/tan(FOV*0.5)+right*uv.x+up*uv.y);
    
    if (iMouse.z > 0.5) {
        dir.yz *= rot((iMouse.y-iResolution.y*0.5)*0.01);
        dir.xz *= rot((iMouse.x-iResolution.x*0.5)*-0.01);
    }
    
   	// get the sine of the angular extent of a pixel
    float sinPix = sin(FOV / iResolution.y);
    // accumulate color front to back
    vec4 acc = vec4(0, 0, 0, 1);

    float totdist = 0.0;
    for (int i = 0 ; i < 100 ; i++) {
		vec3 p = from + totdist * dir;
        float r = totdist*sinPix;
        vec3 color = vec3(1);
        float dist = de(p, r, color);
        
        // compute color
        float ao = 1.0 - float(i)/100.0;
        color *= ao*ao;
        
        // cone trace the surface
        float prox = dist / r;
        float alpha = clamp(prox * -0.5 + 0.5, 0.0, 1.0);

        // accumulate color
        acc.rgb += acc.a * (alpha*color.rgb);
        acc.a *= (1.0 - alpha);
        
        // hit a surface, stop
        if (acc.a < 0.01) {
            break;
        }
        
        // continue forward
        totdist += abs(dist*0.9);
	}
    
    // add fog
    fragColor.rgb = clamp(acc.rgb, vec3(0), vec3(1));
    float fog = clamp(totdist/20.0, 0.0, 1.0);
    fragColor.rgb = mix(fragColor.rgb, vec3(0.4, 0.5, 0.7), fog);
    // gamma correction
    fragColor.rgb = pow(fragColor.rgb, vec3(1.0/2.2));
    // vignetting
    vec2 vig = fragCoord/iResolution.xy*2.0-1.0;
    fragColor.rgb = mix(fragColor.rgb, vec3(0), dot(vig, vig)*0.2);
    
	fragColor.a = 1.0;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
