/*
 * Original shader from: https://www.shadertoy.com/view/wtf3Df
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

// --------[ Original ShaderToy begins here ]---------- //
vec2 R = vec2(0.);

float sdCap(vec3 p, vec3 a, vec3 b, float r){
	vec3 ab = b-a;
	vec3 ap = p-a;
	float t = dot(ab, ap) / dot(ab, ab);
	t = clamp(t, 0., 1.);
	vec3 c = a + t*ab;
	return length(p-c) - r;
}

float opSub( float d1, float d2 ) { return max(-d1,d2); }

// Dave Hoskin hash hehe
float hash(float p){
    p = fract(p * .1071);
    p *= p + 19.19;
    p *= p + p;
    return fract(p);
}
// I cant remember where I found this noise function, but it made for something
// good to trace through
float noise3d(vec3 x) {
	vec3 p = floor(x);
	vec3 f = fract(x);
	f = f * f * (3. - 2. * f);

	float n = p.x + p.y * 157. + 113. * p.z;
	return mix(
			mix(mix(hash(n + 0.0), hash(n + 1.), f.x),
					mix(hash(n + 157.), hash(n + 158.), f.x), f.y),
			mix(mix(hash(n + 113.), hash(n + 114.), f.x),
					mix(hash(n + 270.), hash(n + 271.), f.x), f.y), f.z);
}
float map(vec3 p)
{
    float d;
    vec3 b = vec3(0., 0., 1.);
   
    p.z+=iTime*5.;
    d = noise3d(p*.85)*.2;
    p = mod(p, b)-.5*b;
    d = opSub(sdCap(p, vec3(0., 0., 1.),vec3(0., 0., -1.), 2.2 ), d);
    
    return d;
}


void mainImage( out vec4 f, in vec2 u )
{
    R = iResolution.xy;
    vec2 uv = 13. * vec2(u.xy - .5*R.xy)/R.y; 
   
    vec3 rd = normalize(vec3(uv,2.));
  
    float t = 0., d, c = 0., ns; 
    vec3 col = vec3(0.), p, ro = vec3(0);
   
    // Raymarch and accumulate color here.
	// When we hit a surface, add some color, nudge the ray out a bit and continue
    for (int i = 0; i < 64; i++) 
    {
        d = map(ro + rd*t);
        
        if(d <= .14)
        {
            p = ro + rd * t;
            p.z+=iTime*5.;
            ns = sin(p.z*4.);
            col += mix(vec3(1),vec3(0., 1.2, 1.2), ns) *d*12.;
            ro = ro + rd*.25;
            c++;
        }
        t += d * .75; 
    }
    
    col /= c;
    
    float drk = smoothstep(0.0, 0.33, t / 72.);
    col *= drk;
    
    col = clamp(col, .0, 1.);
	
    
    col = mix(vec3(.8), col, smoothstep(.0, .08, length(uv/9.)));
    
    f = vec4(col, 1.);
        
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
