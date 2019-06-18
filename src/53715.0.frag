/*
 * Original shader from: https://www.shadertoy.com/view/ws2SWm
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
// This is a ripoff of something evvvvil_ made, can be seen it here: 
// https://www.shadertoy.com/view/wssXWl

// 2d Rotation matrix
mat2 rot(float a) {
	float s = sin(a);
	float c = cos(a);
	
	return mat2(c, s, -s, c);
}

// min() but for vec2
vec2 opU(vec2 a, vec2 b) { return a.x < b.x ? a : b; }

// ball and two sticks.
vec2 shape(vec3 p) {
	vec2 s = vec2(length(p) - 0.4, 1.0); // ball
	vec2 t = vec2(length(p.xz) - 0.1, 2.0); // stick 1
	vec2 u = vec2(length(p.yz) - 0.1, 3.0); // stick 2
	
	return opU(s, opU(t, u));
}

// Distance Estimate. X coord is distance, Y Coord is material id.
vec2 de(vec3 p) {
    // modulo (repeat) space on the y coordinate
    p.y = mod(p.y + 3.0, 6.0) - 3.0; // this will repeat geometry every 6 ... "units"
    
	vec4 q = vec4(p, 1);
	
    // Basic iterated function system (IFS)
	for(int i = 0; i < 5; i++) {
		q.xyz = abs(q.xyz) - vec3(1.9, 0.3, 1.6); // Mirror
        
        // Rotate
		q.xz *= rot(0.3 + float(i)*0.5);
		q.xy *= rot(0.1 + float(i)*0.3);
        
		q *= 1.4; // Scale
	}
	
	vec2 h = shape(q.xzy); // Use Mirrored, Rotated, Scaled coords on ball and stick.
	h.x /= q.w; // keep the y coord (material id) the same, use scaling factor on distance.
		
	return h;
}

// This is used in the trace funciton for the blue glow.
float lde(vec3 p) {
	return length(p.xz) - 0.1;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
	vec2 uv = (2.0*fragCoord - iResolution.xy)/iResolution.y;
	
    float time = iTime;
    
    // Camera setup.
	vec3 ro = vec3(3.0*sin(time), 0, 3.0*cos(time)); // camera position, spin in a circle.
	vec3 ww = normalize(vec3(cos(time*1.0), sin(1.0*time), 1)-ro); //forward vector = look at point - camera position.
	vec3 uu = normalize(cross(vec3(0, 1, 0), ww)); // vector pointing left.
	vec3 vv = normalize(cross(ww, uu)); // vector pointing up.
	vec3 rd = normalize(mat3(uu, vv, ww)*vec3(uv, 1.0)); // get ray direction.
	
    // trace.
	float mx = 10.0, t = 0.0, m = -1.0, g = 0.0;
	for(int i = 0; i < 100; i++) {
		vec2 d = de(ro + rd*t);
		if(d.x < 0.001 || t >= mx) break;
		t += d.x;
		m = d.y;
		
        // tick for glow (not mine).
		g += 0.1/(0.1 + pow(abs(lde(ro + rd*t)), 2.0));
	}
	
	vec3 col, bg;
	col = bg = vec3(0.1)*(2.0 - (length(uv) - 0.2)); // vinette.
	vec2 e = vec2(1, -1)*0.001; // constant used for normal.
	vec3 ld = normalize(vec3(0, 0.5, -0.5)); // light direction (shooting down and in on global z axis).
	
	if(t < mx) {
		vec3 p = ro + rd*t; // position = camera origin + ray direction X distance.
        
        // tetrahedral derivative to calculate normals (much better then central or directional).
		vec3 n = normalize(e.xxx*de(p + e.xxx).x
                           + e.xyy*de(p + e.xyy).x 
                           + e.yxy*de(p + e.yxy).x 
                           + e.yyx*de(p + e.yyx).x);
		
        // ambient occlusion.
		float aot = t/50.0;
		float ao = exp2(-pow(max(0.0, 1.0 - de(p + aot*n).x/aot), 2.0));
        
        // sub surface scattering.
		float sss = smoothstep(-1.0, 1.0, de(p + ld*0.4).x/0.4);
        
        // diffuse.
		float dif = max(0.0, dot(ld, n));
        
        // specular
		float sp = pow(max(0.0, dot(reflect(-ld, n), -rd)), 15.0);
        
        // fresnel term.
		float fr = pow(1.0 + dot(rd, n), 2.0);
		
        // albiedo (color).
		vec3 al = vec3(1);
		
		if(m == 1.0) al = vec3(0.8, 0.3, 0.1);
		else if(m == 2.0) al = vec3(0.4, 0.4, 0.8);
		else if(m == 3.0) al = vec3(0);
		
        // rudementry lighting equation.
		col = mix(vec3(sp + al*ao*(dif + sss)), bg, fr);
	}
    
	col += vec3(0.03, 0.3, 1.0)*g; // blue glow at center.
	col = mix(col, bg, 1.0 - exp(-0.05*t)); // fog.
	
	fragColor = vec4(pow(col, vec3(0.45)), 1);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
