/*
 * Original shader from: https://www.shadertoy.com/view/wdBGDh
 */

#extension GL_OES_standard_derivatives : enable

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
/*--------------------------------------------------------------------------------------
License CC0 - http://creativecommons.org/publicdomain/zero/1.0/
To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
----------------------------------------------------------------------------------------
^ This means do ANYTHING YOU WANT with this code. Because we are programmers, not lawyers.
-Otavio Good
*/

// Clamp [0..1] range
#define saturate(a) clamp(a, 0.0, 1.0)

// Got this line drawing algorithm from https://www.shadertoy.com/view/4tc3DX
// This function will make a signed distance field that says how far you are from the edge
// of the line at any point U,V.
// Pass it UVs, line end points, line thickness (x is along the line and y is perpendicular),
// How rounded the end points should be (0.0 is rectangular, setting rounded to thick.y will be circular),
// dashOn is just 1.0 or 0.0 to turn on the dashed lines.
float LineDistField(vec2 uv, vec2 pA, vec2 pB, vec2 thick, float rounded) {
    // Don't let it get more round than circular.
    //thick = vec2(0.005, 0.005);
    rounded = min(thick.y, rounded);
    // midpoint
    vec2 mid = (pB + pA) * 0.5;
    // vector from point A to B
    vec2 delta = pB - pA;
    // Distance between endpoints
    float lenD = length(delta);
    // unit vector pointing in the line's direction
    vec2 unit = delta / lenD;
    // Check for when line endpoints are the same
    if (lenD < 0.0001) unit = vec2(1.0, 0.0);	// if pA and pB are same
    // Perpendicular vector to unit - also length 1.0
    vec2 perp = unit.yx * vec2(-1.0, 1.0);
    // position along line from midpoint
    float dpx = dot(unit, uv - mid);
    // distance away from line at a right angle
    float dpy = dot(perp, uv - mid);
    // Make a distance function that is 0 at the transition from black to white
    float disty = abs(dpy) - thick.y + rounded;
    float distx = abs(dpx) - lenD * 0.5 - thick.x + rounded;

    // Too tired to remember what this does. Something like rounded endpoints for distance function.
    float dist = length(vec2(max(0.0, distx), max(0.0,disty))) - rounded;
    dist = min(dist, max(distx, disty));

    return dist;
}

// This makes a line in UV units. A 1.0 thick line will span a whole 0..1 in UV space.
float FillLine(vec2 uv, vec2 pA, vec2 pB, vec2 thick, float rounded) {
    float df = LineDistField(uv, pA, pB, vec2(thick), rounded);
    return saturate(df / abs(dFdy(uv).y));
}

float Wobble(float a, float seed) {
    //seed = floor(seed) * 3.14159 * 0.5;
    a += seed;
    return sin(a) + sin(a * 2.0)*0.5 + sin(a * 4.0)*0.25;
}

// makes a dancer in the 0..1 uv space. Seed is which dancer to draw.
float Dancer(vec2 uv, vec2 seed)
{
    float time = iTime*4.0;

    float legLen = 0.18;
    float armLen = 0.15;

    // Define joint positions
    vec2 hipA = vec2(0.57,0.33);
    vec2 kneeA = vec2(0.65 + Wobble(time, seed.x*7.6543)*0.1, 0.2);
    vec2 footA = vec2(0.6 + Wobble(time, seed.x*237.6543)*0.1, 0.0);
    // Constrain joints to be a fixed length
    kneeA = normalize(kneeA - hipA) * legLen + hipA;
    footA = normalize(footA - kneeA) * legLen + kneeA;

    vec2 hipB = vec2(0.43,0.33);
    vec2 kneeB = vec2(0.35 + Wobble(time, seed.x*437.6543)*0.1, 0.2);
    vec2 footB = vec2(0.4 + Wobble(time, seed.x*383.6543)*0.1, 0.0);
    kneeB = normalize(kneeB - hipB) * legLen + hipB;
    footB = normalize(footB - kneeB) * legLen + kneeB;

    vec2 shoulderA = vec2(0.62, 0.67);
    vec2 elbowA = vec2(0.8, 0.43 + Wobble(time, seed.x*7.6543)*0.3);
    vec2 handA = elbowA + vec2(.14, 0.0 + Wobble(time, seed.x*73.6543)*0.5);
    elbowA = normalize(elbowA - shoulderA) * armLen + shoulderA;
    handA = normalize(handA - elbowA) * armLen + elbowA;

    vec2 shoulderB = vec2(0.38, 0.67);
    vec2 elbowB = vec2(0.2, 0.43 + Wobble(time, seed.x*17.6543)*0.3);
    vec2 handB = elbowB + vec2(-0.14, 0.0 + Wobble(time, seed.x*173.6543)*0.5);
    elbowB = normalize(elbowB - shoulderB) * armLen + shoulderB;
    handB = normalize(handB - elbowB) * armLen + elbowB;

    vec2 headPos = vec2(0.5 + Wobble(time, seed.x*573.6543)*0.03, 0.83 + sin(time*2.0)* 0.01);

    // Find an approximate center of mass on the x axis
    float balance = (kneeA.x + kneeB.x + footA.x + footB.x +
                    elbowA.x + elbowB.x + handA.x + handB.x +
                    headPos.x * 1.0) - (0.5*9.0);

    // Make the dancer stick to the ground even when they lift their legs.
    float ground = min(footA.y, footB.y);
    uv.y += ground - 0.025;
    // Make them counter-balance based on approximate center of mass
    uv.x += balance*0.1;

    // Torso
    float l = max(0.0, FillLine(uv, vec2(0.5,0.45), vec2(0.5,0.6), vec2(0.12,0.12), 0.0));

    // Legs
    l = min(l, FillLine(uv, kneeA, hipA, vec2(0.05,0.05), 1.0));
    l = min(l, FillLine(uv, kneeA, footA, vec2(0.05,0.05), 1.0));
    l = min(l, FillLine(uv, kneeB, hipB, vec2(0.05,0.05), 1.0));
    l = min(l, FillLine(uv, kneeB, footB, vec2(0.05,0.05), 1.0));

    // Arms
    l = min(l, FillLine(uv, elbowA, shoulderA, vec2(0.05,0.05), 1.0));
    l = min(l, FillLine(uv, elbowA, handA, vec2(0.05,0.05), 1.0));
    l = min(l, FillLine(uv, elbowB, shoulderB, vec2(0.05,0.05), 1.0));
    l = min(l, FillLine(uv, elbowB, handB, vec2(0.05,0.05), 1.0));

    // Head
    l = min(l, FillLine(uv, headPos, headPos, vec2(0.1,0.1), 1.0));

    // Optional skirt
    if (fract(seed.x*123.4567) > 0.5) {
        l = min(l, FillLine(uv, vec2(0.5, 0.55), vec2(0.65, 0.33), vec2(0.05,0.05), 1.0));
        l = min(l, FillLine(uv, vec2(0.5, 0.55), vec2(0.35, 0.33), vec2(0.05,0.05), 1.0));
        l = min(l, FillLine(uv, vec2(0.35, 0.33), vec2(0.65, 0.33), vec2(0.05,0.05), 1.0));
    }

    return l;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
	uv.x *= iResolution.x / iResolution.y;
	uv.x += iTime * 0.05;	// scroll left with time

	// make a grid for drawing.
	uv *= 3.0;// * (sign(iMouse.z) + 2.0);
	uv.y *= 0.8;
    uv.y += 0.3;
	vec2 newSeed = floor(uv);

    // Make those dancing people!
	float finalLine = Dancer(fract(uv), newSeed-0.41);
    finalLine *= mod(newSeed.y, 2.0);  // the mod kills every other line.

    float lseed = length(newSeed);
    vec3 backColor = vec3(sin(lseed), cos(lseed*918.7654), sin(lseed * 3.4567))*0.5+0.5;
    backColor = normalize(max(backColor, vec3(0.1,0.1,0.1)));
    vec3 finalColor = backColor * finalLine;

	fragColor = vec4(sqrt(finalColor),1.0);
}


// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
