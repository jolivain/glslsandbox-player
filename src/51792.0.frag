/*
 * Original shader from: https://www.shadertoy.com/view/3ds3R2
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
const vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
//Ethan Alexander Shulman 2019

#define point vec3(sin(iTime*.6)*3.,cos(iTime*.7)*2.+2.,0.)

void mainImage(out vec4 o, in vec2 u)
{
    //ray position & direction
    vec3 rp = vec3(0.,0.,-10.),
        rd = normalize(vec3((u*2.-iResolution.xy)/iResolution.x,1.)),
        l = vec3(0.);
    
    //planar reflections on x and y plane
    vec3 reflPos, nrm;
    float reflDst = (rp.y-.5)/rd.y,
        reflDst2 = (rp.x+3.*sign(rd.x))/rd.x;
    if (reflDst < 0.) reflDst = 1e8;
    if (reflDst2 < 0.) reflDst2 = 1e8;
    
    if (reflDst < reflDst2) {
        nrm = vec3(0,-1,0);
    }
    if (reflDst2 < reflDst) {
     	reflDst = reflDst2;
        nrm = vec3(sign(-rd.x),0.,0.);
    }
    reflPos = rp+rd*reflDst;
  
    if (reflDst < 1e8) {
        //realistic reflection vs phong
        vec3 reflDir = reflect(rd,nrm),
                lightDiff = point-reflPos,
                lightDir = normalize(lightDiff);
        if (iMouse.w > 0. && iMouse.x < u.x) {
            l += pow(max(0.,dot(lightDir,reflDir)),16.);//phong
        } else {
			//goal is cheap realistic reflection that properly handles roughness and scattering, this is just a test
            l += pow(max(0.,1.-length(lightDir-reflDir*(1.-abs(nrm)))),4.);
        }
    }
    
    l += max(0.,dot(normalize(point-rp),rd)-.999)*3e3;//point light
    o = vec4(l,1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
