/*
 * Original shader from: https://www.shadertoy.com/view/XtsfRB
 */

//#extension GL_OES_standard_derivatives : enable

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);
vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
////////////////////////////////////////////////////////////////////////////////
//
// raymarched 3D-truchet structure 
//
// Copyright 2017 Mirco Müller
//
// Author(s):
//   Mirco "MacSlow" Müller <macslow@gmail.com>
//
// This program is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License version 3, as published
// by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranties of
// MERCHANTABILITY, SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR
// PURPOSE.  See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along
// with this program.  If not, see <http://www.gnu.org/licenses/>.
//
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
//
// Just for the record... standing on the shoulder of giants like iq, Shane et al
// of course. For a first attempt ok-ish.
//
// Wanted to toss it into the public in the current form, hoping I can get some
// feedback from more experienced folks here. Thanks in advance!
//
// Interaction: LMB-drag controls pitch and yaw of the truchet-structure, when
// dragged to the right half of the "screen" a raymarch-cost (depth) view is
// displayed
//
// Update: Thanks to the input from Shane and Fabrice, I got rid of the artefacts.
// Renders much cleaner and a bit faster now (even faster in the desktop-GL version).
// Now stuff like AA and PBR are on my ToDo for this one... and I have to
// give it my own personal twist to bring something new to the table (to ShaderToy)
//
////////////////////////////////////////////////////////////////////////////////

precision highp float;

#define MAX_ITER 128
#define STEP_SIZE .95
#define EPSILON .001

const vec4 red     = vec4 (1.0, 0.0, 0.0, 1.0);
const vec4 green   = vec4 (0.0, 1.0, 0.0, 1.0);
const vec4 blue    = vec4 (0.0, 0.0, 1.0, 1.0);

mat3 rotX (in float a) {float c = cos(a); float s = sin (a); return mat3 (vec3 (1., .0, .0), vec3 (.0, c, s), vec3 (.0, -s, c));}
mat3 rotY (in float a) {float c = cos(a); float s = sin (a); return mat3 (vec3 (c, .0, s), vec3 (.0, 1., .0), vec3 (-s, .0, c));}
mat3 rotZ (in float a) {float c = cos(a); float s = sin (a); return mat3 (vec3 (c, s, .0), vec3 (-s, c, .0), vec3 (.0, .0, 1.));}
mat2 rot2d (in float a) { float c = cos (a); float s = sin (a); return mat2 (vec2 (c, s), vec2 (-s, c)); }

vec4 gradient (float v) {
    float steps = 2.;
    float step = 1. / steps;
    vec4 col = green;

    if (v >= .0 && v < step) {
        col = mix (green, blue, v * steps);
    } else if (v >= step && v < 2.0 * step) {
        col = mix (blue, red, (v - step) * steps);
    }
    
    return col;
}

// basic sdf toolbox
vec3 opRepeat (in vec3 p, in vec3 size) {return mod (p, 2. * size) - size;}
float sdTorus (in vec3 p, in vec2 t) { vec2 q = vec2 (length (p.xz) - t.x, p.y); return length (q) - t.y; }

// one single truchet-cell with the three tori
// t.x -> torus radius
// t.y -> torus "thickness"
// t.z -> the offset by which the torus should be moved from the center
float sdTruchet (in vec3 p, in vec3 t)
{
    float offset = t.z;
    vec3 p1 = vec3 (p - vec3 (offset, offset, .0)) * rotX (radians (90.));
    vec3 p2 = vec3 (p - vec3 (.0, -offset, offset)) * rotZ (radians (90.));
    vec3 p3 = vec3 (p - vec3 (-offset, .0, -offset)) * rotY (radians (90.));
    
    float t1 = sdTorus (p1, t.xy);
    float t2 = sdTorus (p2, t.xy);
    float t3 = sdTorus (p3, t.xy);

    return min (t1, min (t2, t3));
}

float scene (in vec3 p)
{
    vec2 mouse = iMouse.xy;
    if (iMouse.xy == vec2(.0)) mouse.xy = vec2 (212., 192.);
    mat3 rot = rotX (radians (180. + mouse.y / iResolution.y * 360.)) * rotY (radians (-180. + mouse.x / iResolution.x * 360.));
	p *= rot;

    // "move the camera" (actually, we're moving space)
    p.x -= iTime * .3;

    vec3 cellParam = vec3 (.5, .07 + .04 * (.5 + .5 * cos (3.*iTime)), .5);

    // these random functionsand the used values are still major WTF's for me
    float selector = fract(sin(dot(floor(p) + 13.37, vec3(7., 157., 113.)))*43758.5453);

    // I _hate_ myself for having to peek into one of Shane's truchet-examples for getting a
    // clue about the cell-rotation and not coming up with coordinate-swiveling... it's so
    // simple and obvious... argl!
    if (selector > .75) {
        p = p;
    } else if (selector > .5) {
    	p = p.yzx;
    } else if (selector > .25) {
	    p = p.zxy;
    }

    float d = sdTruchet (opRepeat (p, vec3 (.5)), cellParam);

	return d;
}

float raymarch (in vec3 ro, in vec3 rd, out int iter)
{
    float t = .0;

    for (int i = 0; i < MAX_ITER; i++)
    {
        iter = i;
        vec3 p = ro + t * rd;
        float d = scene (p);
        if (abs (d) < EPSILON * (1. + .125*d)) break;
        t += d * STEP_SIZE;
    }

    return t;
}

vec3 normal (in vec3 p)
{
    vec3 e = vec3(.0001, .0, .0);
    float d = scene (p);
    vec3 n = vec3 (scene (p + e.xyy) - d, scene (p + e.yxy) - d, scene (p + e.yyx) - d);
    return normalize(n);
}

float shadow (in vec3 p, in vec3 n, in vec3 lPos)
{
    float distanceToLight = distance (p, lPos);
    int ignored = 0;
    float distanceToObject = raymarch (p + .01*n, normalize (lPos - p), ignored);
    bool isShadowed = distanceToObject < distanceToLight;
    return isShadowed ? .1 : 1.;
}

// blinn-phong shading... as much as I can remember it
vec3 shade (in vec3 ro, in vec3 rd, in float d)
{
    vec3 p = ro + d * rd;

    vec3 ambColor = vec3 (.1, .05, .05);
    vec3 diffColor = vec3 (1.9, 1.4, 1.2);
    vec3 specColor = vec3 (.95, .85, .85);
    float shininess = 120.;

    vec3 lightPos = ro + vec3 (cos (iTime) * .5, .5, sin (iTime) * .5);
    vec3 lightDir = lightPos - p;
    vec3 lightNDir = normalize (lightDir);
    vec3 nor = normal (p);
    vec3 h = normalize (lightDir - rd);

    float diffuse = max (dot (lightNDir, nor), .0);
    float specular = pow (max (dot (h, nor), .0), shininess);

    float sha = shadow (p, nor, lightPos);
    float distanceToLight = distance (p, lightPos);
    float attenuation = 1. / (distanceToLight*distanceToLight);

    vec3 specTerm = ((sha > .1) ? attenuation * specular * specColor : vec3 (.0));
    return ambColor + sha * attenuation * diffuse * diffColor + specTerm;
}

void mainImage (out vec4 fragColor, in vec2 fragCoord)
{
    // normalizing and aspect-correction
	vec2 uvRaw = fragCoord.xy / iResolution.xy;
	vec2 uv = uvRaw;
    uv = uv * 2. - 1.;
    uv.x *= iResolution.x / iResolution.y;

    // create origin and view-ray
    vec3 ro = vec3 (.0, .0, -.75);
    vec3 rd = normalize (vec3 (uv, 1.) - ro);

    // "shake the camera" around a bit
    rd.xy *= rot2d (cos (iTime) * .075);
    rd.xz *= rot2d (sin (iTime) * .15);

    // do the ray-march...
    int iter = 0;
    float d = raymarch (ro, rd, iter);
    float depth = float (iter) / float (MAX_ITER);
    vec3 cc = gradient (depth).rgb;
    float fog = 1. / (1. + d * d * .1);
    vec3 c = shade (ro, rd, d);

    // secondary/1st reflection-ray
    vec3 p = ro + d*rd;
    vec3 n = normal (p);
    vec3 refl = normalize (reflect (rd, n));
    float refd = raymarch (p + .01*n, refl, iter);
    vec3 refp = p + refd*refl;
    vec3 refcol = shade (p, refl, refd);

    // restricting (fresnel) reflections to grazing view-angles
	float fakeFresnel = pow (1. - max (dot (n, -rd), .0), 1.25);
    vec3 lPos = ro + vec3 (cos (iTime) * .5, .5, sin (iTime) * .5);
    float lDist = distance (lPos, p);
    float attenuation = 1. / (lDist*lDist);
    c += fakeFresnel*attenuation*.125*refcol;

    // fog, tonemapping, "gamma-correction", tint, vignette
    c *= fog;
	c = c / (1. + c);
    c = .2 * c + .8 * sqrt (c);
    c *= vec3 (.9, .8, .7);
    c *= .2 + .8 * pow (16. * uvRaw.x * uvRaw.y * (1. - uvRaw.x) * (1. - uvRaw.y), .3);

    if (iMouse.x / iResolution.x < .5) {
		fragColor = vec4(c, 1.);
    } else {
		fragColor = vec4(cc, 1.);
    }
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
