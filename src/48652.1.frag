/*
 * Original shader from: https://www.shadertoy.com/view/XtGyWh
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
const vec4  iMouse = vec4(0.0);

mat3 inverse(mat3 m)
{
    float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2];
    float a10 = m[1][0], a11 = m[1][1], a12 = m[1][2];
    float a20 = m[2][0], a21 = m[2][1], a22 = m[2][2];

    float b01 =  a22 * a11 - a12 * a21;
    float b11 = -a22 * a10 + a12 * a20;
    float b21 =  a21 * a10 - a11 * a20;

    float det = a00 * b01 + a01 * b11 + a02 * b21;

    return mat3(b01, (-a22 * a01 + a02 * a21), (a12 * a01 - a02 * a11),
                b11, (a22 * a00 - a02 * a20), (-a12 * a00 + a02 * a10),
                b21, (-a21 * a00 + a01 * a20), (a11 * a00 - a01 * a10)) / det;
}

// --------[ Original ShaderToy begins here ]---------- //
// --------------------------------------------------------
// OPTIONS
// --------------------------------------------------------

// Disable to see more colour variety
//#define SEAMLESS_LOOP
#define COLOUR_CYCLE
#define HIGH_QUALITY

// --------------------------------------------------------
// http://www.neilmendoza.com/glsl-rotation-about-an-arbitrary-axis/
// --------------------------------------------------------

mat3 rotationMatrix(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat3(
        oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
        oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
        oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c
    );
}


// --------------------------------------------------------
// http://math.stackexchange.com/a/897677
// --------------------------------------------------------

mat3 orientMatrix(vec3 A, vec3 B) {
    mat3 Fi = mat3(
        A,
        (B - dot(A, B) * A) / length(B - dot(A, B) * A),
        cross(B, A)
    );
    mat3 G = mat3(
        dot(A, B),              -length(cross(A, B)),   0,
        length(cross(A, B)),    dot(A, B),              0,
        0,                      0,                      1
    );
    return Fi * G * inverse(Fi);
}


// --------------------------------------------------------
// HG_SDF
// https://www.shadertoy.com/view/Xs3GRB
// --------------------------------------------------------

#define PI 3.14159265359
#define PHI (1.618033988749895)


float t = 0.;


float vmax(vec3 v) {
    return max(max(v.x, v.y), v.z);
}

float sgn(float x) {
	return (x<0.)?-1.:1.;
}

// Rotate around a coordinate axis (i.e. in a plane perpendicular to that axis) by angle <a>.
// Read like this: R(p.xz, a) rotates "x towards z".
// This is fast if <a> is a compile-time constant and slower (but still practical) if not.
void pR(inout vec2 p, float a) {
    p = cos(a)*p + sin(a)*vec2(p.y, -p.x);
}

// Reflect space at a plane
float pReflect(inout vec3 p, vec3 planeNormal, float offset) {
    float t = dot(p, planeNormal)+offset;
    if (t < 0.) {
        p = p - (2.*t)*planeNormal;
    }
    return sign(t);
}

// Repeat around the origin by a fixed angle.
// For easier use, num of repetitions is use to specify the angle.
float pModPolar(inout vec2 p, float repetitions) {
	float angle = 2.*PI/repetitions;
	float a = atan(p.y, p.x) + angle/2.;
	float r = length(p);
	float c = floor(a/angle);
	a = mod(a,angle) - angle/2.;
	p = vec2(cos(a), sin(a))*r;
	// For an odd number of repetitions, fix cell index of the cell in -x direction
	// (cell index would be e.g. -5 and 5 in the two halves of the cell):
	if (abs(c) >= (repetitions/2.)) c = abs(c);
	return c;
}

// Repeat around an axis
void pModPolar(inout vec3 p, vec3 axis, float repetitions, float offset) {
    vec3 z = vec3(0,0,1);
	mat3 m = orientMatrix(axis, z);
    p *= inverse(m);
    pR(p.xy, offset);
    pModPolar(p.xy, repetitions);
    pR(p.xy, -offset);
    p *= m;
}

// --------------------------------------------------------
// IQ
// https://www.shadertoy.com/view/ll2GD3
// --------------------------------------------------------

vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
    return a + b*cos( 6.28318*(c*t+d) );
}

vec3 spectrum(float n) {
    return pal( n, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.0,0.33,0.67) );
}


// --------------------------------------------------------
// knighty
// https://www.shadertoy.com/view/MsKGzw
// --------------------------------------------------------

int Type=5;
vec3 nc = vec3(0.);
vec3 pbc = vec3(0.);
vec3 pca = vec3(0.);
void initIcosahedron() {//setup folding planes and vertex
    float cospin=cos(PI/float(Type)), scospin=sqrt(0.75-cospin*cospin);
    nc=vec3(-0.5,-cospin,scospin);//3rd folding plane. The two others are xz and yz planes
    pbc=vec3(scospin,0.,0.5);//No normalization in order to have 'barycentric' coordinates work evenly
    pca=vec3(0.,scospin,cospin);
    pbc=normalize(pbc); pca=normalize(pca);//for slightly better DE. In reality it's not necesary to apply normalization :) 

}

void pModIcosahedron(inout vec3 p) {
    p = abs(p);
    pReflect(p, nc, 0.);
    p.xy = abs(p.xy);
    pReflect(p, nc, 0.);
    p.xy = abs(p.xy);
    pReflect(p, nc, 0.);
}

float splitPlane(float a, float b, vec3 p, vec3 plane) {
    float split = max(sign(dot(p, plane)), 0.);
    return mix(a, b, split);
}

float icosahedronIndex(inout vec3 p) {
    vec3 sp, plane;
    float x, y, z, idx;

    sp = sign(p);
    x = sp.x * .5 + .5;
    y = sp.y * .5 + .5;
    z = sp.z * .5 + .5;

    plane = vec3(-1. - PHI, -1, PHI);

    idx = x + y * 2. + z * 4.;
    idx = splitPlane(idx, 8. + y + z * 2., p, plane * sp);
    idx = splitPlane(idx, 12. + x + y * 2., p, plane.yzx * sp);
    idx = splitPlane(idx, 16. + z + x * 2., p, plane.zxy * sp);

    return idx;
}

vec3 icosahedronVertex(vec3 p) {
    vec3 sp, v, v1, v2, v3, result, plane;
    float split;
    v = vec3(PHI, 1, 0);
    sp = sign(p);
    v1 = v.xyz * sp;
    v2 = v.yzx * sp;
    v3 = v.zxy * sp;

    plane = vec3(1, PHI, -PHI - 1.);

    split = max(sign(dot(p, plane.xyz * sp)), 0.);
    result = mix(v2, v1, split);
    plane = mix(plane.yzx * -sp, plane.zxy * sp, split);
    split = max(sign(dot(p, plane)), 0.);
    result = mix(result, v3, split);

    return normalize(result);
}

// Nearest vertex and distance.
// Distance is roughly to the boundry between the nearest and next
// nearest icosahedron vertices, ensuring there is always a smooth
// join at the edges, and normalised from 0 to 1
vec4 icosahedronAxisDistance(vec3 p) {
    vec3 iv = icosahedronVertex(p);
    vec3 originalIv = iv;

    vec3 pn = normalize(p);
    pModIcosahedron(pn);
    pModIcosahedron(iv);

    float boundryDist = dot(pn, vec3(1, 0, 0));
    float boundryMax = dot(iv, vec3(1, 0, 0));
    boundryDist /= boundryMax;

    float roundDist = length(iv - pn);
    float roundMax = length(iv - vec3(0, 0, 1.));
    roundDist /= roundMax;
    roundDist = -roundDist + 1.;

    float blend = 1. - boundryDist;
    blend = pow(blend, 6.);
    
    float dist = mix(roundDist, boundryDist, blend);

    return vec4(originalIv, dist);
}

// Twists p around the nearest icosahedron vertex
void pTwistIcosahedron(inout vec3 p, float amount) {
    vec4 a = icosahedronAxisDistance(p);
    vec3 axis = a.xyz;
    float dist = a.a;
    mat3 m = rotationMatrix(axis, dist * amount);
    p *= m;
}

void pTwistIcosahedron(inout vec3 p, vec3 center, float amount) {
    p += center;
    pTwistIcosahedron(p, amount);
    p -= center;
}


// --------------------------------------------------------
// MAIN
// --------------------------------------------------------

struct Model {
    float dist;
    vec3 colour;
    float id;
};
     
Model fInflatedIcosahedron(vec3 p, vec3 axis) {
    float d = 1000.;
    
    # ifdef SEAMLESS_LOOP
        // Radially repeat along the rotation axis, so the
        // colours repeat more frequently and we can use
        // less frames for a seamless loop
        pModPolar(p, axis, 3., PI/2.);
    # endif
    
    float idx = icosahedronIndex(p);

    d = length(p) - .9;

    // Colour each icosahedron face differently
    # ifdef SEAMLESS_LOOP
        if (idx == 3.) {
            idx = 2.;
        }
        idx /= 10.;
    # else
        idx /= 20.;
    # endif
    # ifdef COLOUR_CYCLE
        idx = mod(idx + t*1.75, 1.);
    # endif

    vec3 colour = spectrum(idx);
    
    d *= .6;
    return Model(d, colour, 1.);
}

Model model(vec3 p) {
    
    float rate = PI/6.;
    vec3 axis = pca;

    vec3 twistCenter = vec3(0);
    twistCenter.x = cos(0. * rate * -3.) * .6;
	twistCenter.y = sin(0. * rate * -3.) * .6;

	mat3 m = rotationMatrix(
        reflect(axis, vec3(0,1,0)),
        t * -rate
   	);
    p *= m;
    twistCenter *= m;

    pTwistIcosahedron(p, twistCenter, 10.5);

	return fInflatedIcosahedron(p, axis);
}


// The MINIMIZED version of https://www.shadertoy.com/view/Xl2XWt

const float MAX_TRACE_DISTANCE = 6.0;           // max trace distance
const float INTERSECTION_PRECISION = 0.001;        // precision of the intersection
#ifdef HIGH_QUALITY
	const float FUDGE_FACTOR = .2;
#else
	const float FUDGE_FACTOR = .6;
#endif
//--------------------------------
// Modelling
//--------------------------------
Model map( vec3 p ){
    return model(p);
}


//----
// Camera Stuffs
//----
mat3 calcLookAtMatrix( in vec3 ro, in vec3 ta, in float roll )
{
    vec3 ww = normalize( ta - ro );
    vec3 uu = normalize( cross(ww,vec3(sin(roll),cos(roll),0.0) ) );
    vec3 vv = normalize( cross(uu,ww));
    return mat3( uu, vv, ww );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    initIcosahedron();
    t = iTime - .25;
    //t = mod(t, 4.);
    
    vec2 p = (-iResolution.xy + 2.0*fragCoord.xy)/iResolution.y;
    vec2 m = iMouse.xy / iResolution.xy;

    vec3 camPos = vec3(3.,0,0);
    vec3 camTar = -camPos;
    float camRoll = 0.;

    // camera matrix
    mat3 camMat = calcLookAtMatrix( camPos, camTar, camRoll );  // 0.0 is the camera roll

    // create view ray
    vec3 rd = normalize( camMat * vec3(p.xy,2.0) ); // 2.0 is the lens length

    vec3 color = pow(vec3(.15,0,.2), vec3(2.2));    
    
    vec3 ro = camPos;
    float t = 0.0;
    float h = INTERSECTION_PRECISION * 2.0;
    float res = -1.0;
    vec3 colour;

    for( int i=0; i< 500 ; i++ ){

        if( t > MAX_TRACE_DISTANCE ) break;
        Model m = map( ro+rd*t );
        h = abs(m.dist);
        t += max(INTERSECTION_PRECISION, h * FUDGE_FACTOR);
        color += m.colour * pow(max(0., (.01 - h)) * 42., 10.) * 150.;
        color += m.colour * .005 * FUDGE_FACTOR;
    }
    
    color = pow(color, vec3(1./1.8)) * 1.5;
    color = pow(color, vec3(1.2));
    
    fragColor = vec4(color,1.0);
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
