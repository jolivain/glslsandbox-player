/*
 * Original shader from: https://www.shadertoy.com/view/llKBDc
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

// Emulate a black texture
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
#define eps 0.01

mat2 r2d(float a){
    float s = sin(a);
	float c = cos(a);
    return mat2(c,-s,s,c);
}

float smin(float d1, float d2, float k){
        float h = exp(-k * d1) + exp(-k * d2);
        return -log(h) / k;
}
float udRoundBox( vec3 p, vec3 b, float r )
{
  return length(max(abs(p)-b,0.0))-r;
}

void partitionSpaceAndColor(inout vec3 c, inout vec3 p){
    // index the cells
    vec3 i = floor(p);
    //random y
    float ry = fract(sin(i.x*76.78+i.z*786.89)*1488.88);
    //if random number is over .49 invert y direction
    float updown = 1.0;
    updown = (ry>.49) ? 1.0 : -1.0;
    //addto and move y
    p.y += (ry*1.5 + iTime*ry*2.5)*updown;
    p.y += ry;
    //re index cells
    i=floor(p);
    //divide the space
    p=fract(p)-.5;
    //random rotation using reindexed vec3    
    float r  = fract(sin(i.x*76.68+i.y*148.34)*768.78);
    float r2 = fract(sin(i.z*76.68+i.y*148.34)*768.78);
    p.xz*=r2d(r- iTime*(r*3.));
    p.xy*=r2d(r2-iTime*(r*2.5));    
    //random color
    float c1  = fract(sin(i.x*76.68+i.y*148.34)*768.78);
    float c2 = fract(sin(i.z*76.68+i.y*148.34)*768.78);
    float c3 = fract(sin(i.z*76.68+i.x*148.34)*768.78);
    
    c = vec3(c1,c2,c3);
    
}

float map(vec3 p){
    
    vec3 dummyVec = vec3(0.0);
    partitionSpaceAndColor(dummyVec, p);
    //p += (sin(p.x*55.)*sin(p.y*55.5)*sin(p.z*56.)*.0075);
    //return smin(udRoundBox(p,vec3(.15),.015), pl, 6.); //*.75;
    return udRoundBox(p,vec3(.15),.015);
}

float trace(vec3 r, vec3 o){
    float t = 0.0;
    for(int i = 0; i < 64; i++){
        vec3 p = o + r * t;
        float d = map(p);
        t += d * 0.75;
        if(d<eps || t > 8.0) break;
    }
    return t;
}

vec3 getNormal2(in vec3 p) {
	vec2 e = vec2(eps, 0.0);
	return normalize((vec3(map(p+e.xyy), map(p+e.yxy), map(p+e.yyx)) - map(p)) / e.x);
}
// https://github.com/darrenmothersele/raymarch/blob/master/shaders/frag.glsl
vec3 getNormal(in vec3 p) {
	// 6-tap normalization. Probably the most accurate, but a bit of a cycle waster.
	return normalize(vec3(
		map(vec3(p.x+eps,p.y,p.z))-map(vec3(p.x-eps,p.y,p.z)),
		map(vec3(p.x,p.y+eps,p.z))-map(vec3(p.x,p.y-eps,p.z)),
		map(vec3(p.x,p.y,p.z+eps))-map(vec3(p.x,p.y,p.z-eps))
	));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    uv = uv * 2.0 -1.0;
    uv.x *= iResolution.x / iResolution.y;
    vec3 l = normalize(vec3(0.3, 0.4, 0.75));
    
    vec3 r = normalize(vec3(uv, 1.0 - dot(uv, uv) * .33));
    vec3 o = vec3(0.0, 0.9, -9.0);
    
    o.zy *= r2d(iTime*.15);
    //o.y = -map(sp)+.3;
    r.zy*=r2d((sin(iTime/4.)*.5));
    r.xz*=r2d(iTime*.73+sin(iTime*.25)*4.);
    
    
    float t = trace(r, o);
    
    vec3 sp = o+r * t;
    float d = map(sp);
	//vec3 sky = pow(vec3(0.1,0.1,0.65),vec3(3.*r.y));
	// https://www.shadertoy.com/view/MlcGD7
    vec4 sky= pow(vec4(.1, .7, .8, 1), vec4(4.*max(-r.y,-0.41)+2.))+(dot(r,l)*.315+.215);
    
    vec3 n = getNormal(sp);
    
    float fog = smoothstep(-0.015, .17, t*0.03);
    // Time varying pixel color
    //vec4 col = (sky);    //0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));
    
    vec3 c = vec3(0.0);
    
    // so if 'sp' or surface position was to be used later it wouldnt be changed...
    vec3 tmpSP = sp;
    partitionSpaceAndColor(c, tmpSP);
    
    if(abs(d) < .5){
        vec3 rf = reflect(r,n);
        vec3 cmp = texture(iChannel0, rf).rgb;
        fragColor = mix(vec4(0.25+cmp+vec3(c),1.0)* max(dot(n,l),0.18), vec4(sky), fog);
    }
    else
    	fragColor = vec4(sky);
}


/*
        vec3 i = floor(sp);
        float ry = fract(sin(i.x*76.78+i.z*786.89)*1488.88);
        sp.y += ry*1.5 + iTime*ry;
        sp.y += ry;
        i=floor(sp);

        sp=fract(sp)-.5;
        
        
        
    	float c1  = fract(sin(i.x*76.68+i.y*148.34)*768.78);
    	float c2 = fract(sin(i.z*76.68+i.y*148.34)*768.78);
        float c3 = fract(sin(i.z*76.68+i.x*148.34)*768.78);
        */
        //vec3 c = partitionSpaceAndColor(sp);

    //vec3 i = floor(sp);
    //vec3 rn = fract(i);
    //rn=floor(rn);



//float pl = p.y;
/*    
    vec3 i = floor(p);
    float ry = fract(sin(i.x*76.78+i.z*786.89)*1488.88);
    p.y += ry*1.5 + iTime*ry;
    p.y += ry;
    i=floor(p);
    
    p=fract(p)-.5;
    
    float r  = fract(sin(i.x*76.68+i.y*148.34)*768.78);
    float r2 = fract(sin(i.z*76.68+i.y*148.34)*768.78);
    p.xz*=r2d(r- iTime*(r*3.));
    p.xy*=r2d(r2-iTime*(r*2.5));
    */
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
