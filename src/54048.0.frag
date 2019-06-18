/*
 * Original shader from: https://www.shadertoy.com/view/3tX3R8
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
/*
Fractal Penrose triangle aka Selmi triangle. I came across it when John Baez
shared it a couple of months ago, and I wanted to explore the concept with a
shader. Representations of it were first posted online by Nidhal Selmi and 
Akiyoshi Kitaoka in 2009-2010.

Regarding implementation, I didn't find any super elegant or efficient way of
generating it, and ended up manually placing overlapping isometric faces.
Everything is 2D. I'm basically treating the Sierpinski triangle as a tiling,
with the Penrose triangle being the prototile. Somewhat experimentally,
everything is generated in HSV color space and converted to RGB at the end,
which makes for easy color management.

Links:
http://math.ucr.edu/home/baez/diary/march_2019.html
https://www.deviantart.com/nydhalo/art/Selmi-Triangle-136342456
http://www.psy.ritsumei.ac.jp/~akitaoka/fukano2e.html
*/


// Sets of coordinates used for the current and adjacent tiles
struct TileSpace {
	vec2 p; // current point in tile coordinates
	vec2 to; // tile origin in global coordinates
};

// Existence of neighboring tiles (left/right/bottom)
struct Neighbors {
	bool L;
	bool BL;
	bool BR;
};

// Number of iterations being displayed
int level = 0;
// Smoothed number of iterations and related values
float smoothLevel = 0., tilesize = 0., lineLightness = 0.;
// Colors in HSV space
const vec3 lightHSV = vec3(0., 0., 0.95);
const vec3 mediumHSV = vec3(0., 0., 0.4);
const vec3 darkHSV = vec3(0., 0., 0.14);
const vec3 lineHSV = vec3(0., 0., 0.);
vec3 bgHSV = vec3(0.);

// These functions angle space for the placement of isometric cube faces
vec2 isoM(vec2 p) { return vec2(p.y, 0.5*p.y - p.x); }
vec2 isoL(vec2 p) { return vec2(p.x+p.y*0.5, p.y); }
vec2 isoR(vec2 p) { return vec2(p.x+p.y*0.5, 0.5*p.y - p.x); }

// These functions repeat space to draw cheap rows of faces
float range(float x, float xmin, float xmax) {
	return max(min(fract(x), x-xmin), x-xmax);
}
vec2 xRange(vec2 p, float xmin, float xmax) {
	p.x = range(p.x, xmin, xmax);
	return p;
}
vec2 yRange(vec2 p, float ymin, float ymax) {
	p.y = range(p.y, ymin, ymax);
	return p;
}

// Draw a unit square onto ret
void square(inout vec3 ret, vec2 p, vec3 col, float aaSize) {
	p = abs(p-0.5);
	float sqgrad = max(p.x, p.y)*2.;
	vec3 lc = mix(lineHSV, col, lineLightness);
	ret = mix (ret, lc, 1.-smoothstep(1., 1.+aaSize, sqgrad));
	ret = mix(col, ret, smoothstep(1.-aaSize, 1., sqgrad));
}

/*
Construct a Penrose triangle in 2D by manually placing a bunch of angled
squares. Nothing really magic.
*/
void drawPenrose(inout vec3 ret, vec2 p, float aaSize) {
	// L to T
	square(ret, xRange(isoR(p)+vec2(0., 1.), 1., 2.), lightHSV, aaSize);
	// R to L
	square(ret, yRange(isoM(p), -3., 0.), mediumHSV, aaSize);
	square(ret, xRange(isoL(p)+vec2(0., 1.), -1., 2.), darkHSV, aaSize);
	// R to T
	square(ret, yRange(isoL(p)-vec2(3., 0.), -1., 2.), darkHSV, aaSize);
	square(ret, yRange(isoR(p)-vec2(4., 0.), -5., -1.), lightHSV, aaSize);
	// L to T cover
	square(ret, isoR(p)+vec2(-3., 1.), lightHSV, aaSize);
	square(ret, xRange(isoM(p), 1., 4.), mediumHSV, aaSize);
}

/*
Construct a Penrose triangle and connect it to its neighbors by adding some more
angled squares.
*/
void drawSelmi(inout vec3 ret, TileSpace t, Neighbors n, float aaSize) {
	vec2 p = t.p*4.-vec2(2., 0.);
	p *= vec2(0.5, 0.578);
	p += vec2(3., 1.3);
	if (n.BL) {
		square(ret, yRange(isoR(p)+vec2(0., 0.), -3., -2.), lightHSV, aaSize);
	}
	if (n.BR) {
		square(ret, isoM(p)+vec2(2., 4.), mediumHSV, aaSize);
	}
	drawPenrose(ret, p, aaSize);
	if (n.L) {
		square(ret, isoL(p)+vec2(1., 0.), darkHSV, aaSize);
		square(ret, isoL(p)+vec2(2., 1.), darkHSV, aaSize);
		square(ret, isoR(p), lightHSV, aaSize);
	}
	if (n.BL) {
		square(ret, isoR(p)+vec2(1., 1.), lightHSV, aaSize);
		square(ret, isoM(p)+vec2(1., 0.), mediumHSV, aaSize);
	}
	if (n.BR) {
		square(ret, isoR(p)+vec2(-3., 5.), lightHSV, aaSize);
		square(ret, isoR(p)-vec2(4., -6.), lightHSV, aaSize);
		square(ret, isoM(p)+vec2(1., 4.), mediumHSV, aaSize);
	}
}

/*
Convert coordinates to "Sierpinski tile" coordinates. I originally rolled my own
Sierpinski function, but then I saw iq's smugly superior version so I
rage-deleted all my code and based my new version on his:
https://www.shadertoy.com/view/Md2GzR
which itself was probably inspired by Syntopia's Sierpinski code:
http://blog.hvidtfeldts.net/index.php/2011/08/distance-estimated-3d-fractals-iii-folding-space/
*/
const vec2 va = vec2(0.0, 1.73-0.85);
const vec2 vb = vec2(1.0, 0.00-0.85);
const vec2 vc = vec2(-1.0, 0.00-0.85);
float length2(vec2 p) { return dot(p,p); }
TileSpace sierpSpace(vec2 pin) {
	float a = 0.0;
	vec2 p = pin;
	vec2 c;
	float dist, d, t;
	for (int i = 0; i<7; i++) {
		if (i>=level) continue;
		d = length2(p-va);                 c = va; dist=d; t=0.0;
        d = length2(p-vb); if (d < dist) { c = vb; dist=d; t=1.0; }
        d = length2(p-vc); if (d < dist) { c = vc; dist=d; t=2.0; }
		p = c + 2.0*(p - c);
		a = t + a*3.0;
	}
	vec2 to = (pin - p*tilesize);
	return TileSpace(p, to);
}

/*
I'm resorting to an utterly barbaric way of determining if the tile has
neighbors to connect to: re-running down the entire fractal for each neighboring
side to check. There's got to be a way of getting all of this in a single pass,
but I couldn't figure it out. Oh well, at least I reduced it to 3 taps instead
of having to check all 6 possible neighbors, by offsetting the tile contents so
that it's only affected by the bottom-left connections.
*/
#define EPSILON 0.001
bool approx(vec2 a, vec2 b) { return all(lessThan(abs(a-b), vec2(EPSILON))); }
Neighbors getNeighbors(vec2 p, TileSpace t) {
	Neighbors n;
	float eps = tilesize*0.002;
    // check if the tile origin is equal to the tile origin of neighboring points
	n.L = !approx(t.to, sierpSpace(t.to-tilesize*vec2(1.1, 0.)).to);
	n.BL = !approx(t.to, sierpSpace(t.to-tilesize*vec2(0.92, 0.92)).to);
	n.BR = !approx(t.to, sierpSpace(t.to-tilesize*vec2(-0.92, 0.92)).to);
	return n;
}

/*
Equilateral triangle distance by iq, used for the big blurry shadow.
(Todo: project it onto the plane because right now it looks wrong.)
Also used for the transition effect between levels of iteration.
*/
float sdEquilateralTriangle(vec2 p)
{
    const float k = sqrt(3.0);
    p.x = abs(p.x) - 1.0;
    p.y = p.y + 1.0/k;
    if( p.x + k*p.y > 0.0 ) p = vec2( p.x - k*p.y, -k*p.x - p.y )/2.0;
    p.x -= clamp( p.x, -2.0, 0.0 );
    return -length(p)*sign(p.y);
}

// Smooth HSV: https://www.shadertoy.com/view/MsS3Wc
vec3 hsv2rgb_smooth(vec3 c)
{
	return c.z * (1.-c.y*smoothstep(2.,1., abs(mod(c.x*6.+vec3(0,4,2), 6.) -3.)));
}

// Convert to ground-plane coordinates
vec2 groundP(vec2 p)
{
	p.y += 0.184;
	p.x = 2.*(p.x/8.)/(.5-p.y);
	p.y = p.y / (p.y-.5);
	p.y += smoothLevel*0.46;
	p *= 7.;
	return p;
}

/*
Return a drawable grid on the ground-plane.
Todo: get the AA size with the derivative of groundP instead of this shitty
numerical approximation.
*/
float ground(vec2 pin)
{
	pin.x = abs(pin.x);
	vec2 p = groundP(pin);
	vec2 p2 = groundP(pin-vec2(1./iResolution));
	float aax = min(0.5, abs(p.x-p2.x)*1.5);
	float aay = min(0.5, abs(p.y-p2.y)*1.5);
	float ret = smoothstep(0.5-aax, 0.5, abs(fract(p.x)-0.5));
	ret = max(ret, smoothstep(0.5-aay, 0.5, abs(fract(p.y)-0.5)));
	return ret*(0.5-aay)*2.;
}

//  Dave_Hoskins hash, used for film grain effect
float hash13(vec3 p3)
{
	p3 = fract(p3 * .1031);
	p3 += dot(p3, p3.yzx + 19.19);
	return fract((p3.x + p3.y) * p3.z);
}

void mainImage(out vec4 fragColor, vec2 fragCoord)
{
    vec2 uv = fragCoord/iResolution.xy;
	vec2 p = uv-0.5;
	p.x *= iResolution.x/iResolution.y;
	
	// Slowly increase and decrease the fractal's iteration count
	smoothLevel = 0.7+(4.5-0.7)*(0.5-0.5*cos(iTime*0.2));
	float trans = sdEquilateralTriangle(-0.2*(p-vec2(0., 0.33)))+0.66;
	level = int(smoothLevel-trans);
	tilesize = 1./pow(2.,float(level));
	lineLightness = smoothLevel*0.18;
	float zoom = pow(2.,smoothLevel)*1.09*tilesize;
	float aaSize = 22.*zoom*(1.0/length(iResolution))/tilesize;

	// Prepare some colors and background grid on plane
	bgHSV = vec3(float(level)*0.16+0.5, 0.6, 1.);
	vec3 bg2 = vec3(bgHSV.x+0.25, 0., 1.);
	bgHSV = mix(bgHSV, bg2, sqrt(uv.y));
	bgHSV.z *= 1.-ground(p)*0.75;
	vec3 ret = bgHSV;

	// Prepare coordinates for the object
	p = (p-vec2(0., 0.33-0.1/smoothLevel))*zoom+vec2(0.5, 0.94);
	TileSpace t = sierpSpace(p*2.-1.);
	Neighbors n = getNeighbors(p, t);

	// Shadow
	vec2 sp = (p-vec2(0.35, 0.2));
	sp.y *= 2.;
	sp.x += sp.y*0.3;
	float s = sdEquilateralTriangle(sp * 2.);
	float samp = 1.5/(max(sp.y+2.,0.)+1.);
	samp *= 2.2-1.2*smoothstep(-1., 4., float(level));
	ret.z *= 1. - samp/(max(s, 0.)+1.);
	
	// Draw the object
	drawSelmi(ret, t, n, aaSize);

	// Draw white transition triangle
	vec3 c2 = vec3(bgHSV.x, 0., 0.9);
	ret = mix(c2, ret, clamp(abs(fract(smoothLevel-trans+0.49)-0.5)*400.-4., 0., 1.));

	// Film grain effect
	float hash = hash13(vec3(fragCoord, iTime*1500.+50.));
	ret.z *= 1.-hash*0.13*(1.-ret.y);
	ret.x += hash*0.13*ret.y;

	// Convert to RGB
    fragColor = vec4(hsv2rgb_smooth(ret), 1.0);
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
