/*
 * Original shader from: https://www.shadertoy.com/view/ldKfDK
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
/**
Gameboy SDF for raymarching, hopefully not too broken.

Anyone please feel free to use it for anything!
Notice I'm using parts of http://mercury.sexy/hg_sdf/ library + my own minified versions and other inventions.

Used this blueprint for positioning:
https://www.the-blueprints.com/modules/vectordrawings/preview-wm/nintendo_gameboy_classic.jpg
Also used a wikipedia graphic for colors and official specs for body and screen dimensions.

I am aware there is a lot of code, I went for readable / tweakable dimension constants.
If there are serious performance optimizations please comment and I'd love to fix it for future reuse!
**/
/* Language extensions */
#define sat(x) clamp(x, 0.0, 1.0)

float vmin(vec2 v){return min(v.x, v.y);}
float vmin(vec3 v){return min(v.x, max(v.y, v.z));}
float vmax(vec2 v){return max(v.x, v.y);}
float vmax(vec3 v){return max(v.x, max(v.y, v.z));}

/* Spatial modifiers*/
void pR(inout vec2 p, float a){p=cos(a)*p+sin(a)*vec2(p.y,-p.x);}

// Modulo over a single axis, but limit the maximum number of steps, stopping tiling at the given start (s) and end (e) distance. Notice they should be mutliples of the size (z).
float pModInterval(inout float p,float z,float s,float e){float c=floor(p/z+.5);p=(fract(p/z+.5)-.5)*z;if(c>e){p+=z*(c-e);return e;}if(c<s){p+=z*(c-s);return s;}return c;}

/* SDF primitives(many from http://mercury.sexy/hg_sdf/)*/
// Sphere
float fSphere(vec3 p,float r){return length(p)-r;}

// Infinite box
float fBox(vec2 p,vec2 s){return vmax(abs(p)-s);}

// Box
float fBox(vec3 p,vec3 s){return vmax(abs(p)-s);}

// Cylinder with rounded caps
float fCapsule(vec3 p,float r,float h){p.y=max(0.,abs(p.y)-h);return length(p)-r;}

// first object gets a capenter-style groove cut out
float fOpGroove(float a, float b, float ra, float rb) {
	return max(a, min(a + ra, rb - abs(b)));
}

// Distance to line segment between <a> and <b>, used for fCapsule() version 2below
float fLineSegment(vec2 p, vec2 a, vec2 b) {
	vec2 ab = b - a;
	float t = sat(dot(p - a, ab) / dot(ab, ab));
	return length((ab * t + a) - p);
}

// Capsule version 2: between two end points <a> and <b> with radius r
float fCapsule(vec2 p, vec2 a, vec2 b, float r) {
	return fLineSegment(p, a, b) - r;
}

// Distance to line segment between <a> and <b>, used for fCapsule() version 2below
float fLineSegment(vec3 p, vec3 a, vec3 b) {
	vec3 ab = b - a;
	float t = sat(dot(p - a, ab) / dot(ab, ab));
	return length((ab * t + a) - p);
}

// Capsule version 2: between two end points <a> and <b> with radius r
float fCapsule(vec3 p, vec3 a, vec3 b, float r) {
	return fLineSegment(p, a, b) - r;
}

// Subtract from the result to get a round edge
float fBoxRound(vec3 p,vec3 s)
{
	vec3 q=abs(p)-s;
	return length(max(q,vec3(0)))+vmax(min(q,vec3(0)));
}
float fBoxRound(vec2 p,vec2 s)
{
	vec2 q=abs(p)-s;
	return length(max(q,vec2(0)))+vmax(min(q,vec2(0)));
}

/* SDF boolean operators */
void fOpUnion(inout float a,float b,inout vec4 m,vec4 n){if(b<a){a=b;m=n;}}
void fOpIntersection(inout float a,float b,inout vec4 m,vec4 n){if(b>a){a=b;m=n;}}
float fOpIntersectionRound(float a,float b,float r){return min(-r,max(a,b))+length(max(r+vec2(a,b),0.));}
float fOpIntersectionChamfer(float a,float b,float r){return max(a,max(b,(a+b+r)*sqrt(.5)));}

/* Main code */
const float gameBoyButtonPopOut = 0.15;
const vec3 gameBoySizeInCm = vec3(9.0, 14.8, 3.2);
const float gameBoyHalfThickness = gameBoySizeInCm.z / 2.0;

void fABButton(inout float r, inout vec4 m, vec3 p)
{
    const float gameBoyButtonBevel = 0.02;
    const float gameBoyButtonSize = 0.55;

    // cylinder for the button
    float a = length(p.xy) - gameBoyButtonSize;
    // sphere for the cap
    float b = length(p + vec3(0.0, 0.0, 0.25)) - 0.25 - gameBoyHalfThickness - gameBoyButtonPopOut;
    // cut off at the back
    float ir = max(-p.z, fOpIntersectionRound(a, b, gameBoyButtonBevel));
    // create inset
    r = fOpIntersectionRound(r, -ir + 0.03, 0.03);
    // intersect round for the final shape
    fOpUnion(r, ir, m, vec4(p, 3));
}

float fGameboy(vec3 p, out vec4 m)
{
    // I made it mirrored, oops
    p.xz = -p.xz;
    // animate it a bit
    pR(p.xz, sin(iTime) * 0.4 + -0.2);
    
    vec2 quadrant = sign(p.xy);
    const float cornerRadius = 0.2;
    // one corner is rounder
    float offset = cornerRadius;
    if(quadrant.x == -1.0 && quadrant.y == -1.0)
        offset = 1.7;

    // body
    float r = fOpIntersectionRound(abs(p.z) - gameBoyHalfThickness, fBoxRound(p.xy, gameBoySizeInCm.xy / 2.0 - offset) - offset, cornerRadius);
    m = vec4(p, 0);

    // top groove
    const vec2 grooveInCm = vec2(0.03, 0.06);
    const float topGrooveOffset = 6.65;
    r = fOpGroove(r, min(p.y - topGrooveOffset, max(-p.y + topGrooveOffset, abs(p.x) - 3.8)), grooveInCm.x, grooveInCm.y);

    // speaker grooves
    vec3 cpy = p;
    cpy.z -= gameBoyHalfThickness;
    cpy.y += 5.8;
    cpy.x += 2.85;
    pR(cpy.xy, radians(-29.));
    pModInterval(cpy.x, 0.5, -2., 3.);
    float insetDepth = 0.08;
    r = max(r, -max(gameBoyHalfThickness - p.z - insetDepth, fBoxRound(cpy.xy, vec3(0.0, 0.7, 0.0).xy) - 0.15));

    // window inset
    const vec2 insetSize = vec2(7.7, 5.7);
    const vec2 screenSize = vec2(4.7, 4.3);
    p.y -= 3.3;
    quadrant = sign(p.xy);
    offset = 0.3;
    if(quadrant.x == -1.0 && quadrant.y == -1.0)
        offset = 1.0;
    insetDepth = 0.02;
    float ir = max(-p.z + gameBoyHalfThickness - insetDepth, fBoxRound(p.xy, insetSize / 2.0 - offset) - offset);
    fOpIntersection(r, -ir, m, vec4(p, 1));

    // screen inset
    insetDepth = 0.05;
    ir = max(-p.z + gameBoyHalfThickness - insetDepth, fBox(p.xy, screenSize / 2.0));
    if(r <= -ir)
        m = vec4(p, 2);
    r = fOpIntersectionRound(r,-ir,insetDepth);

    // battery
    ir = fSphere(p - vec3(3.3, 0.7, gameBoyHalfThickness), 0.1);
    fOpUnion(r, ir, m, vec4(2.0, 0.1, 0.1, -1));

    // indent AB
    p.xy += vec2(3.3, 5.5);
    float radius = 3.5;
    ir = fCapsule(p, vec3(0.0, 0.0, gameBoyHalfThickness + radius),
                     vec3(1.55, -0.7, gameBoyHalfThickness + radius),
                      radius + 0.1);
    r = max(r, -ir);
    // A & B buttons
    fABButton(r, m, p);
    p.xy += vec2(-1.55, 0.7);
    fABButton(r, m, p);

    // indent D-Pad
    p.xy -= vec2(4.43, 0.25);
    radius = 8.0;
    ir = fSphere(p - vec3(0.0, 0.0, gameBoyHalfThickness + radius), radius + 0.1);
    r = max(r, -ir);

    // D-pad
    const float buttonBevel = 0.06;
    const float crossThickness = 0.28;
    const float crossSize = 1.0;
    const float curveRadius = 18.0;
    const float dimpleCurveRadius = 0.2;

    // create an infinite cross
    vec2 q = abs(p.xy);
    ir = max(-p.z, max(vmax(q) - crossSize, vmin(q) - crossThickness));
    // dimple
    ir = max(ir, 0.04 + dimpleCurveRadius - length(p - vec3(0.0, 0.0, gameBoyHalfThickness + gameBoyButtonPopOut + dimpleCurveRadius)));
    // cut off the front with a curve
    cpy = p;
    cpy.z -= curveRadius + gameBoyHalfThickness + gameBoyButtonPopOut;
    cpy.z = min(cpy.z, 0.0);
    ir = fOpIntersectionRound(curveRadius - length(cpy), ir, buttonBevel);

    fOpUnion(r, ir, m, vec4(p, 4));

    // indent start and select
    ir = fCapsule(p.xy, vec3(-1.05, -2.4, gameBoyHalfThickness).xy, vec3(-1.75, -2.05, gameBoyHalfThickness).xy, -0.05);
    ir = min(ir, fCapsule(p.xy + vec2(1.55, 0.0), vec3(-1.05, -2.4, gameBoyHalfThickness).xy, vec3(-1.75, -2.05, gameBoyHalfThickness).xy, -0.05));
    float squishy = 3.0;
    r = fOpIntersectionChamfer(r * squishy, -ir, 0.37) / squishy;

    // select
    ir = fCapsule(p, vec3(-1.05, -2.4, gameBoyHalfThickness), vec3(-1.75, -2.05, gameBoyHalfThickness), 0.15);
    fOpUnion(r, ir, m, vec4(p, 5));
    // start
    p.x += 1.55;
    ir = fCapsule(p, vec3(-1.05, -2.4, gameBoyHalfThickness), vec3(-1.75, -2.05, gameBoyHalfThickness), 0.15);
    fOpUnion(r, ir, m, vec4(p, 5));


    return r;
}
float fGameboy(vec3 p){vec4 m;return fGameboy(p,m);}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec3 rayDir = normalize(vec3((fragCoord * 2.0 - iResolution.xy) / iResolution.y, 4.0));
    vec3 rayOrigin = vec3(0.0, 0.0, -40.0);
    float s,t=0.1;
    vec4 m;
    vec3 p;
    for(int i = 0 ; i < 100 ; ++i)
    {
        p=rayOrigin+rayDir*t;
        s=fGameboy(p,m);
        if(s<0.0001)break;
        t+=s;
        if(t>100.)break;
    }
    vec2 e = vec2(0.001, 0.0);
    vec3 n = normalize(vec3(fGameboy(p+e.xyy),fGameboy(p+e.yxy),fGameboy(p+e.yyx))-s);
    
    vec3 albedo = vec3(0.0);
    float cosinePower = 100.0;
    float specularity = 0.1;
    vec3 additive = vec3(0.0);
    
    int objectId = int(m.w);
    if(objectId==-1) // emissive
    {additive = vec3(1.0, 0.05, 0.1);}
    if(objectId==0) // body
    {albedo = vec3(0.6, 0.55, 0.5); cosinePower = 20.0;}
    if(objectId==1) // gray plate
    {albedo = vec3(0.2); specularity = 0.3; cosinePower = 2000.0;}
    if(objectId==2) // screen
    {albedo = vec3(0.3, 0.5, 0.1);}
    if(objectId==3) // AB
    {albedo = vec3(0.5, 0.02, 0.15); specularity = 0.4;}
    if(objectId==4) // D-pad
    {albedo = vec3(0.1); specularity = 0.4;}
    if(objectId==5) // start & select
    {albedo = vec3(0.2); cosinePower = 1.0;}
    
    
    vec3 L = normalize(vec3(-0.5, 0.3, -1.8));
    vec3 col = dot(n,L) * albedo; // basic lambert
    col *= (1.0 - specularity);
    col += specularity * pow(max(0.0,dot(reflect(rayDir,n),L)), cosinePower); // basic phong
    col += additive;
    vec3 background = vec3(0.05, 0.1, 0.3);
    col = mix(col * 1.5, background, pow(sat(t/100.),8.));
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
