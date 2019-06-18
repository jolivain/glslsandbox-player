/*
 * Original shader from: https://www.shadertoy.com/view/tdj3zt
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
uniform vec4 date;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);
vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
mat2 rotate(float a)
{
    float c = cos(a);
    float s = sin(a);
    return mat2(c, s, -s, c);
}

float sphere(vec3 p, float r)
{
    return length(p) - r;
}

float caps(vec3 p, float r, float l)
{
    return length(p - vec3(0., clamp(p.y, -l, l), 0.)) - r;
}

float map(vec3 p)
{
    p.xz = mod(p.xz+vec2(1.5), 3.5)-vec2(1.5);
    //p.xz *= rotate(iTime);
    //p.yz *= rotate(iTime);
    
    vec3 symp = p;
    symp.x = abs(symp.x);
    
    // Head
    float mask = caps(p-vec3(0., -.06, 0.), .25, .1);
    float negMask = caps(p-vec3(0., -.2, -.26), .3, .1);
    float eyeHole = sphere(symp-vec3(.13, -.01, .21), .023);
    float mouthHole = sphere(p-vec3(0., -.26, .26), .045);
    float axle = caps(p.yxz, .12, .2);
    axle = max(axle, symp.x-.21);
    float head = max(max(max(mask, -negMask), -eyeHole), -mouthHole);
    // Flatten sides
    head = max(head, symp.x-.2);
    head = min(head, axle);
    //vec3 fp = symp;
    
    
    // Body
    vec3 bp = symp;
    bp.y += 1.;
    bp.xy *= rotate(-.25);
    float body = caps(bp, .3, .3);
    float bottomNeg = caps(symp.xzy-vec3(0.5, 0., -1.2), .4, .3);
    float backNeg = caps(p-vec3(0., -1., -.1), .3, .3);
    float armNeg = caps(symp.yxz-vec3(-.7, 0., -.1), .2, .3);
    float neckHole = sphere(p-vec3(0., -.25, 0.), .4);
    body = max(max(max(max(body, -bottomNeg), -backNeg), -armNeg), -neckHole);
    
    // Pelvis
    float pelvis = caps(p.yxz-vec3(-1.45, .0, .0), .13, .3);
    pelvis = max(pelvis, abs(p).x-.25);
    
    // Core
    vec3 cp = p*20.;
    float verteb = floor(cp.y);
    cp.y = mod(cp.y, 1.);
    cp.z -= sin((verteb)*.2)*2.;
    float core = max(sphere(cp, 1.)/20., abs(p-vec3(0., -.7, 0.)).y-.7);
    
    // Legs
    vec3 lp = symp;
    lp -= vec3(.2, -1.2, -.15);
    lp.yz *= rotate(-.7);
    float legs = caps(lp, .07, .3);
    lp = symp;
    lp -= vec3(.2, -.3, -.15);
    lp.yz *= rotate(-.3);
    float lower = caps(lp-vec3(.0, -1.3, -.4), .07, .7);
    legs = min(legs, lower);
    
    // Arms
    vec3 ap = symp;
    ap.xy *= rotate(.2);
    float arms = caps(ap.yxz-vec3(-.5, 0., 0.), .02, .2);
    float shoulder = sphere(symp-vec3(.3, -.55, .0), .1);
    float upper = caps(symp-vec3(.35, -.75, 0.), .05, .2);
    vec3 lowap = ap-vec3(0.15, -1.3, 0.15);
    lowap.yz *= rotate(-.5);
    float lowera = caps(lowap, .06, .3);
    arms = min(min(min(arms, shoulder), upper), lowera);
    
	// Floor
    float flo = p.y + 2.5;
    
    return min(min(min(min(min(min(head, body), pelvis), core), legs), arms), flo);
}

float march(vec3 ro, vec3 rd)
{
    float t = 0.;
    for(int i=0; i<328; ++i) {
    	float d = map(ro+rd*t);
        if(d < .0001) break;
        if(t > 100.) return -1.;
        t += d;
    }
    return t;
}

vec3 getNormal(vec3 p)
{
    vec3 eps = vec3(.001, 0., 0.);
    return normalize(vec3(
    	map(p+eps.xyy) - map(p-eps.xyy),
        map(p+eps.yxy) - map(p-eps.yxy),
        map(p+eps.yyx) - map(p-eps.yyx)
    ));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy - vec2(.5);
    uv.x *= iResolution.x/iResolution.y;
	
    vec3 eye = vec3(0.5, -1., 2.);
    vec3 dir = normalize(vec3(uv.x, uv.y, -1.));
    eye.x += iTime*.5;
    dir.yz *= rotate(-.3);
    dir.xz *= rotate(.6);
    
    float d = march(eye, dir);
    vec3 p = eye+dir*d;
    
    vec3 col;
    if(d < 0.) {
        col = vec3(1., .2, .2)/pow((uv.y+.4), 1.1);
    } else {
        vec3 normal = getNormal(p);
        col = vec3(.95, .95, 1.) * (1.-pow(max(0., dot(normal, -dir)), 2.));
        col *= vec3(.3, .27, .27) * max(0., dot(normal, vec3(0., 1., 0.)));
        col += vec3(1., .5, .5) * pow(max(0., dot(normal, -dir)), 200.);
        col += vec3(.8, .8, 1.) * pow(max(0., dot(normal, vec3(0., 1., .5))), 30.);
        col += vec3(.1, 0., 0.) * d/10.;
        col += vec3(1.) * d/50.;
    }
	
    col *= 1.-length(uv)*.8;
    col = pow(col, vec3(.6));
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
