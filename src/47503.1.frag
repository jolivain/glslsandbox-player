/*
 * Original shader from: https://www.shadertoy.com/view/lsSGDR
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
const vec3 iMouse = vec3(0.);

// --------[ Original ShaderToy begins here ]---------- //
vec2 getBezier(vec2 p0, vec2 p1, vec2 p2, float t) 
{
	return (1.0 - t) * ((1.0 - t) * p0 + t * p1) + (t * ((1.0 - t) * p1 + t * p2));
}

float sqrlen(vec2 v)
{
	return v.x * v.x + v.y * v.y;
}

float lineDist(vec2 pm, vec2 p0, vec2 p1)
{
	vec2 a = pm - p0;
	vec2 b = p1 - p0;
	float bLen = length(b);
	vec2 bNorm = normalize(b);
	float a1Len = dot(a, bNorm);
	vec2 a1 = a1Len * bNorm;
	vec2 a2 = a - a1;
	
	if (a1Len < 0.0) {
		return sqrlen(p0 - pm);
	} else if (a1Len > bLen) {
		return sqrlen(p1 - pm);
	} else {
		return sqrlen(a2);
	}
}

vec2 lineTDist(vec2 pm, vec2 p0, vec2 p1)
{
	vec2 a = pm - p0;
	vec2 b = p1 - p0;
	float bLen = length(b);
	vec2 bNorm = normalize(b);
	float a1Len = dot(a, bNorm);
	vec2 a1 = a1Len * bNorm;
	vec2 a2 = a - a1;
	
	if (a1Len < 0.0) {
		return vec2(0.0,sqrlen(p0 - pm));
	} else if (a1Len > bLen) {
		return vec2(1.0,sqrlen(p1 - pm));
	} else {
		return vec2(a1Len / bLen,sqrlen(a2));
	}
}

bool checkBezier(vec2 p, vec2 p0, vec2 p1, vec2 p2, float sqrDist)
{	
	const float subdiv = 8.0;
	
	vec2 lastBezier = p0;
	
	bool check = false;
	
	for(float t = 1.0 / subdiv; t <= 1.0; t += 1.0 / subdiv) {
		vec2 bezier = getBezier(p0,p1,p2,t);
		
		if (lineDist(p, lastBezier, bezier) < sqrDist) {
			check = true;
			//break;
		}
		
		lastBezier = bezier;
	}
	
	return check;
}

vec3 solveCubic(float a, float b, float c, float d) // unused, incomplete
{
	float disc = (18.0 * a * b * c * d
			   - 4.0 * b * b * b * d
			   + b * b * c * c
			   - 4.0 * a * c * c * c
			   - 27.0 * a * a * d * d);
	
	float d0 = (b * b - 3.0 * a * c);
	
	float d1 = (2.0 * b * b * b - 9.0 * a * b * c + 27.0 * a * a * d);
	
	float d21m4d30 = (-27.0 * a * a * disc);
	
	float bigc = pow((d1 + sqrt(d21m4d30)) / 2.0, 1.0 / 3.0);
	
	float u1 = 1.0;
	float x1 = (-1.0 / (3.0 * a)) * (b + u1 * bigc + (d0 / (u1 * bigc)));
	float u2 = 1.0;
	float x2 = (-1.0 / (3.0 * a)) * (b + u2 * bigc + (d0 / (u2 * bigc)));
	float u3 = 1.0;
	float x3 = (-1.0 / (3.0 * a)) * (b + u3 * bigc + (d0 / (u3 * bigc)));
	
	return vec3(x1,x2,x3);
}

vec2 checkTBezier(vec2 p, vec2 p0, vec2 p1, vec2 p2, float sqrDist)
{	
	const float subdiv = 8.0;
	
	vec2 lastBezier = p0;
	
	vec2 check = vec2(-1,0);
	float cur = 0.0;
	
	for(float t = 1.0 / subdiv; t <= 1.0; t += 1.0 / subdiv) {
		vec2 bezier = getBezier(p0,p1,p2,t);
		vec2 dist = lineTDist(p, lastBezier, bezier);
		
		if (dist.y < sqrDist) {
			check = vec2(cur + dist.x * (1.0 / subdiv), dist.y);
			//break;
		}
		
		lastBezier = bezier;
		cur += (1.0 / subdiv);
	}
	
	return check;
}

vec4 color(vec2 uv)
{
	vec2 bodyUV = uv *
		vec2(cos(iTime * 5.0) * 0.025 + 1.0,
			 1.0 - (cos(iTime * 5.0) * 0.025)) -
		vec2(0, (cos(iTime * 5.0) * 0.02));
	
	vec2 mouse = iMouse.xy / iResolution.xy;
	mouse = mouse * 2.0 - 1.0;
	mouse.x *= iResolution.x / iResolution.y;
	vec2 mouseDir = (vec2(0,0.2) - mouse);
	
	if (sqrlen(mouseDir) > 1.5 * 1.5)
		mouseDir = normalize(mouseDir) * 1.5;
	
	vec2 eyeUV = (bodyUV) * vec2(1.1,1);
	vec2 eyeDisp = mouseDir * 0.1;
	
	vec2 armUV = uv - vec2((cos(iTime * 5.0) * 0.02), (cos(iTime * 5.0) * 0.02));
	vec2 arm2UV = uv - vec2(-(cos(iTime * 5.0) * 0.02), (cos(iTime * 5.0) * 0.02));
	
	float armPosTime = radians(100.0) + cos(iTime * 13.0) * radians(10.0);
	vec2 armPos = vec2(-0.8,0.1) + vec2(cos(armPosTime) * 0.4, sin(armPosTime) * 0.4);
		
	vec2 arm2Pos = vec2(0.8,-0.7);
	if (mouse.x > 0.3 && mouse.x < 1.3) {
		arm2Pos = mouse;
	}
	
	if (sqrlen(eyeUV - vec2(0,0.2)) < 0.4 * 0.4) {
		if (sqrlen(eyeUV - vec2(0.06,0.3) + eyeDisp) < 0.05 * 0.05) {
			return vec4(1,1,1,1);
		} else if (sqrlen((eyeUV + eyeDisp) * vec2(1,0.8) - vec2(0,0.2)) < 0.1 * 0.1) {
			return vec4(0,0,0,1);
		} else {
			return vec4(1,1,1,1);
		}
	} else if (bodyUV.y <
			   	getBezier(vec2(-0.4,-0.2), vec2(0,-0.5), vec2(0.4,-0.2), (bodyUV.x + 0.4) / 0.8).y &&
			  bodyUV.y >
			   	getBezier(vec2(-0.4,-0.2), vec2(0,-0.6), vec2(0.4,-0.2), (bodyUV.x + 0.4) / 0.8).y) {
		return vec4(0.4,0.1,0.5,1);
	} else if (bodyUV.y <
			   	getBezier(vec2(0.2,-0.32), vec2(0.3,-0.3), vec2(0.35,-0.25), (abs(bodyUV.x) - 0.2) / 0.15).y &&
			  bodyUV.y >
			   	getBezier(vec2(0.2,-0.32), vec2(0.3,-0.5), vec2(0.35,-0.25), (abs(bodyUV.x) - 0.2) / 0.15).y) {
		return vec4(1,1,0.7,1);
	} else if (bodyUV.y <
			   	getBezier(vec2(-0.3,-0.3), vec2(0,-0.4), vec2(0.3,-0.3), (bodyUV.x + 0.3) / 0.6).y &&
			  bodyUV.y >
			   	getBezier(vec2(-0.3,-0.3), vec2(0,-0.6 + cos(iTime * 2.0) * 0.15), vec2(0.3,-0.3), (bodyUV.x + 0.3) / 0.6).y) {
		if (sqrlen(bodyUV - vec2(0,-0.5 + cos(iTime * 2.0) * 0.05)) < 0.2 * 0.2) {
			return vec4(0.9,0.1,0.05,1);
		} else {
			return vec4(0.7,0.1,0.05,1);
		}
	} else if (lineDist(bodyUV, vec2(0,-0.2), vec2(0,0.2)) < 0.6 * 0.6) {
		return vec4(0.6,0.2,1,1);
	} else if (checkBezier(armUV, vec2(-0.5,0.1), vec2(-1.0,-0.6), armPos, 0.1 * 0.1)) {
		return vec4(0.6,0.2,1,1);
	} else if (checkBezier(arm2UV, vec2(0.5,0.1), vec2(0.7,-0.1), arm2Pos, 0.1 * 0.1)) {
		return vec4(0.6,0.2,1,1);
	} else {
		return mix(vec4(0,0,0,1),vec4(0.2,0.3,0.7,1),sin(-uv.y));
	}
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
	uv = uv * 2.0 - 1.0;
	uv.x *= iResolution.x / iResolution.y;
	
	fragColor = color(uv);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
