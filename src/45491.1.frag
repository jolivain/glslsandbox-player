/*
 * Original shader from: https://www.shadertoy.com/view/XtSSWK
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
const vec4 iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
// Created by Stephane Cuillerdier - Aiekick/2015
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// Tuned via XShade (http://www.funparadigm.com/xshade/)

/*
study on simple 2d curve for doing a first person camera in a roller coaster like in 3d:)
here an a reoller coaster like in study ^^

the goal is to have the cam up dir from a sin path from the use of derivative of the sin path

equation for a line f(x) = a * x + b, the derivate is f'(x)
		si the param for eq line is (a,b)

equation for a tangeant line in point (i,j) is j = f'(i) * (x-i) + f(i)
		so the param for eq line is (a,b) = (f'(i),f'(i) * i + f(i))

equation for a perpendicular line in point (i,j) is j = -1/f'(i) * (x-i) + f(i)
		so the param for eq line is (a,b) = (-1/f'(i),f'(i) * i + f(i))
*/

#define uAmplitude 5.8
#define uMouse iMouse
#define uThick .004
#define uZoom 20.
#define uScreenSize iResolution.xy
#define uTime iTime

float cosFunc(float x, float k, float c){return cos(x/k)*c;}// cos
float cosFuncDer(float x, float k, float c){return -sin(x/k)/k*c;} // cos derivation
float sinFunc(float x, float k, float c){return sin(x/k)*c;}// sin
float sinFuncDer(float x, float k, float c){return cos(x/k)/k*c;} // sin derivation
	
// composite func : compose what you want
float compFunc(float x)
{
	return sinFunc(x,10.,-uAmplitude) + cosFunc(x,5.,-uAmplitude) + 1.;
}

// derivative composite func
float compFuncDer(float x)
{
	return sinFuncDer(x,10.,-uAmplitude) + cosFuncDer(x,5.,-uAmplitude);
}

// tangeant func
float compFuncTan(float uvx, float ptx)
{
	// tangeance : y = f'(a) * (x-a) + f(a)
	return compFuncDer(ptx) * (uvx - ptx) + compFunc(ptx);
}

// perpendicular func
float compFuncTanPerp(float uvx, float ptx)
{
    // perpendicular : y = -1./f'(a) * (x-a) + f(a)
	return -1./compFuncDer(ptx) * (uvx - ptx) + compFunc(ptx);
}

// draw 2d metaball point
float drawPoint(vec2 uv, vec2 pt, float thick)
{
	return thick/dot(uv + pt * vec2(-1,1), uv + pt * vec2(-1,1));
}

void mainImage( out vec4 f, in vec2 g )
{
	vec2 uv = uZoom*(2.*gl_FragCoord.xy - uScreenSize) / uScreenSize.y;
    
    float xMouse = (sin(uTime)*.5+.5) * uScreenSize.x*.95 + uScreenSize.x * 0.025;
    
    if (uMouse.z>0.) xMouse = uMouse.x;
	float mox = uZoom*(2.*xMouse - uScreenSize.x) / uScreenSize.y;
	
	vec2 uva = uv, uvb = uv, uvc = uv;
	
	f.rgb = vec3(.5);
	
	float curves = 0.;

	float thick = uThick;
	
	uva.y += compFunc(uva.x); // base fund
	uvb.y += compFuncTan(uvb.x, mox); // tangeante
	uvc.y += compFuncTanPerp(uvb.x, mox); // perpendiculair
	
	curves += thick/dot(uva.y,uva.y);
	curves += thick/dot(uvb.y,uvb.y);
	curves += thick*2./dot(uvc.y,uvc.y);
		
    curves = 1.-exp(-2e3 / iResolution.y *curves); // patch of Fabriceneyret2 for better smoothing of curve
    
	// draw points
	float x = 2.; // x offset for point line relative ot point on curve
	
	vec2 ptOnCurve = vec2(mox, compFunc(mox));
	
	vec2 ptFront = vec2(ptOnCurve.x + x, compFuncDer(ptOnCurve.x) * (x) + compFunc(ptOnCurve.x));
	
	float pente = compFuncDer(ptOnCurve.x);
	x *= pente;
	vec2 ptUp = vec2(ptOnCurve.x + x, -1./compFuncDer(ptOnCurve.x) * (x) + compFunc(ptOnCurve.x));
	
	curves += drawPoint(uv, ptOnCurve, 0.1);
	curves += drawPoint(uv, ptUp, 0.1);
	curves += drawPoint(uv, ptFront, 0.1);
	
	f.rgb = vec3(curves);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
  gl_FragColor.a = 1.0;
}
