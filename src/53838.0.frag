/*
 * Original shader from: https://www.shadertoy.com/view/wd2Sz3
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

// Emulate a black texture
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
#define NUM_STEPS 128
#define FUDGE_AMOUNT 0.75
#define EPS 0.001
#define FAR 50.0

#define PI 3.1415926535898


vec3 tri(in vec3 x){return abs(x-floor(x)-.5);} // Triangle function.

float surfFunc(in vec3 p){
	return dot(tri(p*0.5 + tri(p*0.25).yzx), vec3(0.777));
}

vec2 path(in float z){ float s = sin(z/34.)*cos(z/12.)*cos(sin(z/20.)); return vec2(s*12.+sin(s)*6.1, s*15.); }

mat3 lookAtMatrix(vec3 origin, vec3 target, float roll) {
    vec3 rr = vec3(sin(roll), cos(roll), 0.0);
    vec3 ww = normalize(target - origin);
    vec3 uu = normalize(cross(ww, rr));
    vec3 vv = normalize(cross(uu, ww));

    return mat3(uu, vv, ww);
}

mat2 r2(float a){
    float s = sin(a);
    float c = cos(a);
    return mat2(s, -c, c, s);
}

float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return length(max(d,0.0))
         + min(max(d.x,max(d.y,d.z)),0.0); // remove this line for an only partially signed sdf 
}

float sdRoundBox( vec3 p, vec3 b, float r )
{
  vec3 d = abs(p) - b;
  return length(max(d,0.0)) - r
         + min(max(d.x,max(d.y,d.z)),0.0); // remove this line for an only partially signed sdf 
}

float trackPlanks(vec3 tp){
    tp.xy = (tp.xy - path(tp.z))*vec2(0.5, 0.47071);
    tp.z = mod(tp.z, 1.) -0.5;
    float bmp2 = texture(iChannel1, tp.xz/4.).r*.015;
    return sdBox(vec3(tp.x,tp.y+1.4,tp.z), vec3(1., .05152, .2))+bmp2;
}
float trackRails(vec3 tp){
    tp.xy = (tp.xy - path(tp.z))*vec2(0.5, 0.47071);
    tp.z = mod(tp.z, 1.) -0.5;
    tp.x = abs(tp.x)-1.;
    return sdRoundBox(vec3(tp.x, tp.y+1.3, tp.z), vec3(.015, .015, .5), .12);
}
float map(vec3 p){
    //float ground = p.y+2.5+surfFunc(p)-tri(p).y;
    float ground = p.y + (sin(sin(p.z*0.1253) - p.x*0.311)*1.31 + cos(p.z*0.53 + sin(p.x*0.127))*0.12)*1.7 + 0.2;
    ground += tri(p).y;
    //float bmp = texture(iChannel0, p.xz/10.).r*.1;
    //float tx = textureLod(iChannel0, p.xz/16. + p.xy/80., 0.0).x;

    //ground+=bmp;
    // Round tunnel.
    // For a round tunnel, use the Euclidean distance: length(tun.y)
    vec2 tun = (p.xy - path(p.z))*vec2(0.5, 0.47071);
    float n = 1.- length(tun) + (0.5);
    n += surfFunc(p/2.);
    //n+=bmp;
    vec3 tp = p;
    
    tp.xy = tun;
    
    
    float planks = trackPlanks(p);
    float rails = trackRails(p);
        
    return min(min(max(ground, n), planks), rails);
}

float trace(vec3 o, vec3 r){
    float t = 0.0;
    for(int i = 0; i < NUM_STEPS; i++){
        float d = map(o+r*t);
        t += d * FUDGE_AMOUNT;
        if(abs(d) < EPS || t > FAR) break;
    }
    return t;
}
// Surface normal.
vec3 getNormal(in vec3 p) {
	
	const float eps = 0.001;
	return normalize(vec3(
		map(vec3(p.x + eps, p.y, p.z)) - map(vec3(p.x - eps, p.y, p.z)),
		map(vec3(p.x, p.y + eps, p.z)) - map(vec3(p.x, p.y - eps, p.z)),
		map(vec3(p.x, p.y, p.z + eps)) - map(vec3(p.x, p.y, p.z - eps))
	));

}

#define tex3D(tex, p, n) vec3(0.)

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    uv -= .5; uv.x *= iResolution.x / iResolution.y;
    vec3 r = normalize(vec3(uv, 1.0 - dot(uv, uv) * .33));
    vec3 o = vec3(0.0, 0.0, iTime*22.0);
    
    vec3 lookAt = o + vec3(0.0, -0.05,.245);
    o.xy += path(o.z);
    lookAt.xy +=path(lookAt.z);    
    
    mat3 camMat = lookAtMatrix(o, lookAt, -o.x/15.);  //clamp(o.x/3.,-.3,.3));
    r = normalize(camMat * r);
    

    
    float hit = trace(o, r);
    vec3 surfPos = o + r * hit;
    vec3 n = getNormal(surfPos);
    vec4 bg = vec4(0.0);
    vec3 l = normalize(vec3(-0.1, 0.38, -0.2));
    //l.xz *= r2(iTime*3.);
    float diff = max(dot(n,l), 0.5);
	bg = pow(vec4(.1, .7, .8, 1), vec4(4.*max(r.y,-0.141)+1.5)); //+(dot(r,l)*.315+.215);
    float fog = smoothstep(0.75, 01.75, hit*0.03);
    fragColor=vec4(0.0);
    
    float d = map(surfPos);
    float d2 = trackRails(surfPos);
    float d3 = trackPlanks(surfPos);
    
    if(abs(d) < EPS+.4){
        vec3 tx = tex3D(iChannel2, surfPos/8., n);
        fragColor = mix(vec4(1.0*diff), bg, fog);        //+ hit* -.04;
        if(abs(d2)<EPS+.01){
            fragColor = vec4(1.0, 0.0, 0.0, 1.0)*diff;
        }
        else if(abs(d3) < EPS+0.1){
            vec4 tx = texture(iChannel1, surfPos.xz);
            fragColor = vec4(0.0, 1.0, 0.0, 1.0)*diff;
        }
    }
    else
        fragColor = vec4(bg);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
