/*
 * Original shader from: https://www.shadertoy.com/view/MtKfWy
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
// PLENTO


// credit to Shane and Iq for teaching me a majority of what I know about raymarching.



#define FAR 80.0
#define DISTANCE_BIAS 0.6
#define HASHSCALE1 .1031
#define EPSILON 0.001

mat2 rot(float a) {
    return mat2(cos(a), -sin(a), sin(a), cos(a));
}

float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float map(vec3 rp)
{
 
    float res = 0.0;
    
    vec3 pos = rp - vec3(1.0, -0.25, 4.0);
  
    vec3 b = vec3(1.0, 1.0, 1.0);
   
    pos.xy *= rot(pos.z*0.3);
    pos.y += sin(pos.z + iTime + pos.x*1.0)*0.2;
    pos.x += cos(pos.y - pos.z * 2.0 + iTime)*0.3;
 
    pos = mod(pos, b)-0.5*b;
    
    //res = sdBox(pos, vec3(0.01, 0.01, 2.0));
   res = sdBox(pos, vec3(0.033, 0.033, 2.0));
   
  
    return res;
}

// kinda looks cleaner but slower

/*
vec3 getNormal(in vec3 p) {
	const vec2 e = vec2(0.002, 0);
	return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy),	map(p + e.yyx) - map(p - e.yyx)));
}
*/

vec3 getNormal(vec3 p)
{
    vec2 e = vec2(0.0035, -0.0035); 
    return normalize(
        e.xyy * map(p + e.xyy) + 
        e.yyx * map(p + e.yyx) + 
        e.yxy * map(p + e.yxy) + 
        e.xxx * map(p + e.xxx));
}

// swirly color thing
vec3 oc(vec3 p)
{
    p.xy *= rot(p.z*0.64);
    vec3 col = mix(vec3(0.0, 0.3, 1.3), vec3(1.2, 1.2, 0.0),  smoothstep(0.0, 1.0, p.x));
    return col;
}

vec3 color(vec3 ro, vec3 rd, vec3 norm, vec3 lp, float t)
{
    vec3 p = ro + rd * t;
    // Lighting
    vec3 ld = lp-ro;
    float lDist = max(length(ld), 0.001); // Light to surface distance.
    float atten = 1.0 / (1.0 + lDist*0.2 + lDist*lDist*0.1); // light attenuation 
    
    ld /= lDist;
    
    // Diffuse
    float diff = max(dot(norm, ld), 0.0);
    
    // specular
    float spec = pow(max( dot( reflect(-ld, norm), -rd ), 0.0 ), 12.0);
    
    //Colors
    vec3 objCol = oc(ro);
    
    objCol = oc(ro);
    
    vec3 sceneCol = (objCol*(diff + 0.15) + vec3(1.0, 1.0, 1.0)*spec*1.2) * atten;
   
    // Get final color
    return sceneCol;
    
}

float trace(vec3 ro, vec3 rd)
{
    float t = 0.0, d = 0.0; 
   
    for (int i = 0; i < 100; i++) 
    {
        d = map(ro + rd*t);
       
        if(abs(d)<EPSILON || t > FAR) break;
         
        
        t += d * DISTANCE_BIAS;
    }
    return t;
}
float traceRef(vec3 ro, vec3 rd){
    
    float t = 0.0, d = 0.0;
    
    for (int i = 0; i < 64; i++)
    {
        d = map(ro + rd*t);
      
        if(abs(d)<.0025 || t>FAR) break;
        
        t += d;
    }
    
    return t;
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = 2.0 * vec2(fragCoord.xy - 0.5*iResolution.xy)/iResolution.y; 
 
    vec3 ro = vec3(0.0, 0.0, 0.0); 
    vec3 rd = normalize(vec3(uv,2.0));
    ro.z -= iTime * 0.7;
   
    // fish eye
     rd = normalize(vec3(uv, 1.0 - dot(uv, uv) * 0.75));
    
    // light position
    vec3 lp = ro + vec3(0.0, 1.0, -0.5);
    
    
    // Scene
    float t = trace(ro, rd);
 
    ro += rd * t;
    vec3 rr = ro;
    vec3 norm = getNormal(ro); 
    
    vec3 col = color(ro, rd, norm, lp, t);
    
    float fog = t;
    
   
    // Reflection  
    rd = reflect(rd, norm);
    
    t = traceRef(ro +  rd*.01, rd);
    
    ro += rd*t;
    
    norm = getNormal(ro);
   
    col += color(ro, rd, norm, lp, t) * 0.25;
    
   
    fog = smoothstep(0.0, 0.15, fog / 130.);
    col = mix(col, vec3(0), fog);
    
   
    col *= smoothstep(2.0, 0.29, length(uv));
    
    fragColor = vec4(sqrt(clamp(col, 0.0, 1.0)), 1.0);
 
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
