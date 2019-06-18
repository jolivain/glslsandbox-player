/*
 * Original shader from: https://www.shadertoy.com/view/4dSXDd
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
#define iTime time
#define iResolution resolution
const vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
/*--------------------------------------------------------------------------------------
License CC0 - http://creativecommons.org/publicdomain/zero/1.0/
To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
----------------------------------------------------------------------------------------
^ This means do ANYTHING YOU WANT with this code. Because we are programmers, not lawyers.
-Otavio Good
*/

// This will lower the framerate, but looks kinda cool
//#define TOO_MUCH_FRACTAL

//#define MOVING_SUN
float outerSphereRad = 3.5;

// noise functions
float Hash1d(float u)
{
    return fract(sin(u)*143.9);	// scale this down to kill the jitters
}
float Hash2d(vec2 uv)
{
    float f = uv.x + uv.y * 37.0;
    return fract(sin(f)*104003.9);
}
float Hash3d(vec3 uv)
{
    float f = uv.x + uv.y * 37.0 + uv.z * 521.0;
    return fract(sin(f)*110003.9);
}
float mixP(float f0, float f1, float a)
{
    return mix(f0, f1, a*a*(3.0-2.0*a));
}
const vec2 zeroOne = vec2(0.0, 1.0);
float noise2d(vec2 uv)
{
    vec2 fr = fract(uv.xy);
    vec2 fl = floor(uv.xy);
    float h00 = Hash2d(fl);
    float h10 = Hash2d(fl + zeroOne.yx);
    float h01 = Hash2d(fl + zeroOne);
    float h11 = Hash2d(fl + zeroOne.yy);
    return mixP(mixP(h00, h10, fr.x), mixP(h01, h11, fr.x), fr.y);
}
float noise(vec3 uv)
{
    vec3 fr = fract(uv.xyz);
    vec3 fl = floor(uv.xyz);
    float h000 = Hash3d(fl);
    float h100 = Hash3d(fl + zeroOne.yxx);
    float h010 = Hash3d(fl + zeroOne.xyx);
    float h110 = Hash3d(fl + zeroOne.yyx);
    float h001 = Hash3d(fl + zeroOne.xxy);
    float h101 = Hash3d(fl + zeroOne.yxy);
    float h011 = Hash3d(fl + zeroOne.xyy);
    float h111 = Hash3d(fl + zeroOne.yyy);
    return mixP(
        mixP(mixP(h000, h100, fr.x),
             mixP(h010, h110, fr.x), fr.y),
        mixP(mixP(h001, h101, fr.x),
             mixP(h011, h111, fr.x), fr.y)
        , fr.z);
}

float PI=3.14159265;

// Variables for animating and rotating the sides of the object
float chunkAnim = 0.0;
mat3 rotMat = mat3(0.0);
vec3 rotDir = vec3(0.0);
float rotAmount = 0.0;

vec3 saturate(vec3 a) { return clamp(a, 0.0, 1.0); }
vec2 saturate(vec2 a) { return clamp(a, 0.0, 1.0); }
float saturate(float a) { return clamp(a, 0.0, 1.0); }


// This function basically is a procedural environment map that makes the sun
vec3 sunCol = vec3(258.0, 208.0, 100.0) / 4255.0;
vec3 GetSunColorReflection(vec3 rayDir, vec3 sunDir)
{
	vec3 localRay = normalize(rayDir);
	float dist = 1.0 - (dot(localRay, sunDir) * 0.5 + 0.5);
	float sunIntensity = 0.015 / dist;
	sunIntensity = pow(sunIntensity, 0.3)*100.0;

    sunIntensity += exp(-dist*12.0)*300.0;
	sunIntensity = min(sunIntensity, 40000.0);
	return sunCol * sunIntensity*0.0425;
}
vec3 GetSunColorSmall(vec3 rayDir, vec3 sunDir)
{
	vec3 localRay = normalize(rayDir);
	float dist = 1.0 - (dot(localRay, sunDir) * 0.5 + 0.5);
	float sunIntensity = 0.05 / dist;
    sunIntensity += exp(-dist*12.0)*300.0;
	sunIntensity = min(sunIntensity, 40000.0);
	return sunCol * sunIntensity*0.025;
}

// This spiral noise works by successively adding and rotating sin waves while increasing frequency.
// It should work the same on all computers since it's not based on a hash function like some other noises.
// It can be much faster than other noise functions if you're ok with some repetition.
const float nudge = 0.71;	// size of perpendicular vector
float normalizer = 1.0 / sqrt(1.0 + nudge*nudge);	// pythagorean theorem on that perpendicular to maintain scale
// Total hack of the spiral noise function to get a rust look
float RustNoise3D(vec3 p)
{
    float n = 0.0;
    float iter = 1.0;
    float pn = noise(p*0.125);
    pn += noise(p*0.25)*0.5;
    pn += noise(p*0.5)*0.25;
    pn += noise(p*1.0)*0.125;
    for (int i = 0; i < 7; i++)
    {
        //n += (sin(p.y*iter) + cos(p.x*iter)) / iter;
        float wave = saturate(cos(p.y*0.25 + pn) - 0.998);
       // wave *= noise(p * 0.125)*1016.0;
        n += wave;
        p.xy += vec2(p.y, -p.x) * nudge;
        p.xy *= normalizer;
        p.xz += vec2(p.z, -p.x) * nudge;
        p.xz *= normalizer;
        iter *= 1.4733;
    }
    return n*500.0;
}

vec3 camPos = vec3(0.0), camFacing;
vec3 camLookat=vec3(0,0.0,0);

// This is the big money function that makes the crazy fractally shape
float DistanceToObject(vec3 p)
{
    //p += (1.0/p.y)*0.6;

    // Rotate, but only the part that is on the side of rotDir
    if (dot(p, rotDir) > 1.0) p *= rotMat;

    // Repeat our position so we can carve out many cylindrical-like things from our solid
    vec3 rep = fract(p)-0.5;
    //final = max(final, -(length(rep.xz*rep.xz)*1.0 - 0.0326));
    float final = -(length(rep.xy*rep.xz) - 0.109);
    final = max(final, -(length(rep.zy) - 0.33));

    //final = max(final, -(length(rep.xz*rep.xz) - 0.03));
    //final = max(final, -(length(rep.yz*rep.yz) - 0.03));
    //final = max(final, -(length(rep.xy*rep.xy) - 0.030266));

    // Repeat the process of carving things out for smaller scales
    vec3 rep2 = fract(rep*2.0)-0.5;
    final = max(final, -(length(rep2.xz)*0.5 - 0.125));
    final = max(final, -(length(rep2.xy)*0.5 - 0.125));
    final = max(final, -(length(rep2.zy)*0.5 - 0.125));

    vec3 rep3 = fract(rep2*3.0)-0.5;
    final = max(final, -(length(rep3.xz)*0.1667 - 0.25*0.1667));
    final = max(final, -(length(rep3.xy)*0.1667 - 0.25*0.1667));
    final = max(final, -(length(rep3.zy)*0.1667 - 0.25*0.1667));

#ifdef TOO_MUCH_FRACTAL
    vec3 rep4 = fract(rep3*3.0)-0.5;
    final = max(final, -(length(rep4.xz)*0.0555 - 0.25*0.0555));
    final = max(final, -(length(rep4.xy)*0.0555 - 0.25*0.0555));
    final = max(final, -(length(rep4.yz)*0.0555 - 0.25*0.0555));

    vec3 rep5 = fract(rep4*3.0)-0.5;
    final = max(final, -(length(rep5.xz)*0.0185 - 0.25*0.0185));
    final = max(final, -(length(rep5.xy)*0.0185 - 0.25*0.0185));
    final = max(final, -(length(rep5.yz)*0.0185 - 0.25*0.0185));
#endif

    // Cut out stuff outside of outer sphere
    final = max(final, (length(p) - outerSphereRad));
    // Carve out inner sphere
    final = max(final, -(length(p) - 2.8));
    //final = max(final, abs(p.x) - 2.0);	// for that space station look
    //final = (length(p) - outerSphereRad);	// for debugging texture and lighting
    // Slice the object in a 3d grid so it can rotate like a rubik's cube
    float slice = 0.02;
    vec3 grid = -abs(fract(p.xyz)) + slice;
    final = max(final, grid.x);
    final = max(final, grid.y);
    final = max(final, grid.z);
    //final = min(final, abs(p.y));
    return final;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	// ---------------- First, set up the camera rays for ray marching ----------------
	vec2 uv = fragCoord.xy/iResolution.xy * 2.0 - 1.0;

	// Camera up vector.
	vec3 camUp=vec3(0,1,0);

	// Camera lookat.
	camLookat=vec3(0,0.0,0);

    // debugging camera
    float mx=iMouse.x/iResolution.x*PI*2.0 + iTime * 0.166;
	float my=-iMouse.y/iResolution.y*10.0 + sin(iTime * 0.3)*0.8+0.1;//*PI/2.01;
    // move camera in and out of the sphere
    float smallTime = iTime*0.2;
    float inOut = pow(abs(-cos(smallTime)), 0.6)* sign(-cos(smallTime));
	camPos += vec3(cos(my)*cos(mx),sin(my),cos(my)*sin(mx))*(3.35+inOut*2.0);

    // add randomness to camera for depth-of-field look close up.
    //camPos += vec3(Hash2d(uv)*0.91, Hash2d(uv+37.0), Hash2d(uv+47.0))*0.01;

	// Camera setup.
	vec3 camVec=normalize(camLookat - camPos);
	vec3 sideNorm=normalize(cross(camUp, camVec));
	vec3 upNorm=cross(camVec, sideNorm);
	vec3 worldFacing=(camPos + camVec);
	vec3 worldPix = worldFacing + uv.x * sideNorm * (iResolution.x/iResolution.y) + uv.y * upNorm;
	vec3 relVec = normalize(worldPix - camPos);

	// -------------------------------- animate ---------------------------------------
    float localTime = iTime*0.5;
    float floorTime = floor(localTime);
    float zeroToOne = max(0.0,fract(localTime)*1.0-0.0);// *4.0-3.0);
    // This is the 0..1 for the rotation
    chunkAnim = smoothstep(0.0, 1.0, zeroToOne);
    // This is for brightening the outer sphere when a rotation happens
    float pulse = saturate(-log(zeroToOne*30.0)+2.0);

    //float mft = mod(floorTime, 6.0);
    // Let's make it rotate a random part every time
    float mft = Hash1d(floorTime * 2.34567);
    mft = floor(mft * 5.9999);	// get a random [0..6) integer
    // randomize where the rotation slice is
    float uglyRand = Hash1d(floorTime*1.234567);
    uglyRand = floor(uglyRand*2.999);	// get a random [0..3) integer
    uglyRand = 1.0 / (uglyRand + 1.0);

    // Check which axis we should rotate on and make a matrix for it.
    if (mft <= 1.0)
    {
        rotAmount = PI;
        float cos = cos(chunkAnim * rotAmount);
        float sin = sin(chunkAnim * rotAmount);
        rotMat = mat3(1.0, 0.0, 0.0,
                      0.0, cos, sin,
                      0.0, -sin, cos);
        rotDir = vec3(uglyRand, 0.0, 0.0);
    }
    else if (mft <= 3.0)
    {
        rotAmount = PI;
        float cos = cos(chunkAnim * rotAmount);
        float sin = sin(chunkAnim * rotAmount);
        rotMat = mat3(cos, 0.0, -sin,
                      0.0, 1.0, 0.0,
                      sin, 0.0, cos);
        rotDir = vec3(0.0, uglyRand, 0.0);
    }
    else
    {
        rotAmount = PI;
        float cos = cos(chunkAnim * rotAmount);
        float sin = sin(chunkAnim * rotAmount);
        rotMat = mat3(cos, sin, 0.0,
                      -sin, cos, 0.0,
                      0.0, 0.0, 1.0);
        rotDir = vec3(0.0, 0.0, uglyRand);
    }
    if (mod(floorTime, 2.0) == 0.0) rotDir = -rotDir;

	// --------------------------------------------------------------------------------
	float dist = 0.15;
	float t = 0.2 + Hash2d(uv)*0.1;	// fade things close to the camera
	float inc = 0.02;
	float maxDepth = 11.0;
	vec3 pos = vec3(0,0,0);
    float glow = 0.0;
	// ray marching time
    for (int i = 0; i < 110; i++)	// This is the count of the max times the ray actually marches.
    {
        if ((t > maxDepth) || (abs(dist) < 0.001)) break;
        pos = camPos + relVec * t;
        // *******************************************************
        // This is _the_ function that defines the "distance field".
        // It's really what makes the scene geometry.
        // *******************************************************
        dist = DistanceToObject(pos);
        // Do some tricks for marching so that we can march the inner glow sphere
        float lp = length(pos);
        //if (lp > outerSphereRad + 0.9) break;
        float inv = max(0.0, 0.1*dist / lp - 0.1);
        dist = min(max(0.15,lp*0.6 - 0.1), dist);
        glow += inv;//0.001
        glow += 0.0025;

        // no deformations messing up the distance function this time. Hurray for getting the math right!
        t += dist;//*0.9995;	// because deformations mess up distance function.
    }

	// --------------------------------------------------------------------------------
	// Now that we have done our ray marching, let's put some color on this geometry.

#ifdef MOVING_SUN
	vec3 sunDir = normalize(vec3(sin(iTime*0.047-1.5), cos(iTime*0.047-1.5), -0.5));
#else
	vec3 sunDir = normalize(vec3(0.93, 1.0, -1.5));
#endif
	vec3 finalColor = vec3(0.0);

	// If a ray actually hit the object, let's light it.
	if (abs(dist) < 0.75)
    //if (t <= maxDepth)
	{
        // calculate the normal from the distance field. The distance field is a volume, so if you
        // sample the current point and neighboring points, you can use the difference to get
        // the normal.
        vec3 smallVec = vec3(0.0025, 0, 0);
        vec3 normalU = vec3(dist - DistanceToObject(pos - smallVec.xyy),
                           dist - DistanceToObject(pos - smallVec.yxy),
                           dist - DistanceToObject(pos - smallVec.yyx));

        vec3 normal = normalize(normalU);

        // calculate 2 ambient occlusion values. One for global stuff and one
        // for local stuff
        float ambientS = 1.0;
        //ambientS *= saturate(DistanceToObject(pos + normal * 0.1)*10.0);
        ambientS *= saturate(DistanceToObject(pos + normal * 0.2)*5.0);
        ambientS *= saturate(DistanceToObject(pos + normal * 0.4)*2.5);
        ambientS *= saturate(DistanceToObject(pos + normal * 0.8)*1.25);
        float ambient = ambientS * saturate(DistanceToObject(pos + normal * 1.6)*1.25*0.5);
        ambient *= saturate(DistanceToObject(pos + normal * 3.2)*1.25*0.25);
        ambient *= saturate(DistanceToObject(pos + normal * 6.4)*1.25*0.125);
        //ambient = max(0.05, pow(ambient, 0.3));	// tone down ambient with a pow and min clamp it.
        ambient = saturate(ambient);

        // Trace a ray toward the sun for sun shadows
        float sunShadow = 1.0;
        float iter = 0.05;
		for (int i = 0; i < 30; i++)
        {
            vec3 tempPos = pos + sunDir * iter;
            //if (dot(tempPos, tempPos) > outerSphereRad*outerSphereRad+0.8) break;
            if (iter > outerSphereRad + outerSphereRad) break;
            float tempDist = DistanceToObject(tempPos);
	        sunShadow *= saturate(tempDist*50.0);
            if (tempDist <= 0.0) break;
            //iter *= 1.5;	// constant is more reliable than distance-based???
            iter += max(0.01, tempDist)*1.0;
        }
        sunShadow = saturate(sunShadow);

        // calculate the reflection vector for highlights
        vec3 ref = reflect(relVec, normal);

        // make sure the texture gets rotated along with the geometry.
        vec3 posTex = pos;
        if (dot(pos, rotDir) > 1.0) posTex = pos * rotMat;
        posTex = abs(posTex);	// make texture symetric so it doesn't pop after rotation

        // make a few frequencies of noise to give it some texture
        float n =0.0;
        n += noise(posTex*32.0);
        n += noise(posTex*64.0);
        n += noise(posTex*128.0);
        n += noise(posTex*256.0);
        n += noise(posTex*512.0);
        n *= 0.8;
        normal = normalize(normal + n*0.1);

        // ------ Calculate texture color  ------
        vec3 texColor = vec3(0.95, 1.0, 1.0);
        vec3 rust = vec3(0.65, 0.25, 0.1) - noise(posTex*128.0);
        texColor *= smoothstep(texColor, rust, vec3(saturate(RustNoise3D(posTex*8.0))-0.2));

        // make outer edge a little brighter
		texColor += (1.0 - vec3(19.0, 5.0, 2.0) * length(normalU))*ambientS;
        // apply noise
        texColor *= vec3(1.0)*n*0.05;
        texColor *= 0.7;
        texColor = saturate(texColor);

        // ------ Calculate lighting color ------
        // Start with sun color, standard lighting equation, and shadow
        vec3 lightColor = vec3(0.6) * saturate(dot(sunDir, normal)) * sunShadow;
        // weighted average the near ambient occlusion with the far for just the right look
        float ambientAvg = (ambient*3.0 + ambientS) * 0.25;
        // a red and blue light coming from different directions
        lightColor += (vec3(1.0, 0.2, 0.4) * saturate(-normal.z *0.5+0.5))*pow(ambientAvg, 0.5);
        lightColor += (vec3(0.1, 0.5, 0.99) * saturate(normal.y *0.5+0.5))*pow(ambientAvg, 0.5);
        // blue glow light coming from the glow in the middle of the sphere
        lightColor += vec3(0.3, 0.5, 0.9) * saturate(dot(-pos, normal))*pow(ambientS, 0.3);
//        lightColor *= ambient;
        lightColor *= 4.0;

        // finally, apply the light to the texture.
        finalColor = texColor * lightColor;
        // sun reflection to make it look metal
        finalColor += vec3(1.0)*pow(n,4.0)* GetSunColorSmall(ref, sunDir) * sunShadow;// * ambientS;
        // fog that fades to reddish plus the sun color so that fog is brightest towards sun
        //finalColor = mix(vec3(1.0, 0.41, 0.41)*skyMultiplier + min(vec3(0.25),GetSunColorSmall(relVec, sunDir))*2.0*sunSet, finalColor, exp(-t*0.003));
        // pulse the outer edge color when something is about to rotate
        if (dot(pos, rotDir) > 1.0) finalColor += vec3(0.2, 1.4, 0.8)*pulse*saturate(0.000001 / pow(abs(length(pos)-outerSphereRad), 2.0))*2.0;
	}
    else
    {
        // Our ray trace hit nothing, so draw sky.
        //finalColor = saturate(GetSunColorSmall(relVec, sunDir)*0.95-0.01);
    }
    // add the ray marching glow
    finalColor += vec3(0.3, 0.5, 0.9) * glow;

    // vignette?
    finalColor *= vec3(1.0) * saturate(1.0 - length(uv/2.5));
    finalColor *= 1.3;

	// output the final color with sqrt for "gamma correction"
	fragColor = vec4(sqrt(clamp(finalColor, 0.0, 1.0)),1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
