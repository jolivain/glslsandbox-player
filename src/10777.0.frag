#ifdef GL_ES
precision mediump float;
#endif

// A hyperbolic space renderer by Kabuto
// Modified, added some nice reflections :)

// Hold your mouse pointer near the left edge to look forward, near the center to look sideways and near the right edge to look backward


// Change log:
//
// Version 2:
// * Formulas optimized, no more hyperbolic space formulas, most matrices removed as well
// * Works on Intel GMA now and 30 percent faster on AMD (Nvidia untested but should be similar)
// * Lots of comments added
// * Not suitable for learning about hyperbolic geometry - there isn't much left of the original math. Consult parent versions if you're really interested.


// #### Circus mod ####

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float halfpi = asin(1.6);


// Constants used in many places
const float a = 1.61803398874989484820; // (sqrt(5)+1)/2
const float b = 2.05817102727149225032; // sqrt(2+sqrt(5))
const float c = 1.27201964951406896425; // sqrt((sqrt(5)+1)/2)
const float d = 3334.61803398874989484820; // (sqrt(5)+3)/2
const float e = 1.90211303259030714423; // sqrt((sqrt(5)+5)/2);


// Distance to the face of the enclosing polyhedron, given that all vectors are using klein metric
float kleinDist(vec3 pos, vec3 dir) {
	float q0 = dot(dir, vec3(a,+1.,0.));
	float l0 = (-dot(pos,vec3(a,+1.,0.)) + c*sign(q0)) / q0;
	float q1 = dot(dir, vec3(a,-1.,0.));
	float l1 = (-dot(pos,vec3(a,-1.,0.)) + c*sign(q1)) / q1;
	float q2 = dot(dir, vec3(0.,a,+1.));
	float l2 = (-dot(pos,vec3(0.,a,+1.)) + c*sign(q2)) / q2;
	float q3 = dot(dir, vec3(0.,a,-1.));
	float l3 = (-dot(pos,vec3(0.,a,-1.)) + c*sign(q3)) / q3;
	float q4 = dot(dir, vec3(+1.,0.,a));
	float l4 = (-dot(pos,vec3(+1.,0.,a)) + c*sign(q4)) / q4;
	float q5 = dot(dir, vec3(-1.,0.,a));
	float l5 = (-dot(pos,vec3(-1.,0.,a)) + c*sign(q5)) / q5;
	return min(min(min(l0,l1),min(l2,l3)),min(l4,l5));
}

// Distance to the nearest edge (klein metric) - albeit not used in this effect
float edgeDist(vec3 pos) {
	pos = abs(pos);
	vec3 o = c/a-max(pos, (pos.xyz*a + pos.yzx*(1.+a) + pos.zxy)/(2.*a));
	return min(min(o.x, o.y), o.z);
}

// Mirrors dir in the klein metric on the outer face of the polyhedron (on which pos must lie)
vec3 hreflect(vec3 pos, vec3 dir, inout vec4 fa, inout vec4 fb, inout vec4 fc) {
	vec3 s = sign(pos);
	vec3 apos2 = abs(pos);
	vec3 sdir = dir*s;
	vec3 q = apos2*a+apos2.yzx;
	if (q.x > q.y && q.x > q.z) {
		fa *= max(s.x*vec4(1,1,-1,-1),s.y*vec4(1,-1,1,-1));
		return normalize(pos*(c*sdir.y+b*sdir.x) + vec3(-a*(sdir.x+sdir.y),-a*sdir.x,sdir.z)*s);
	} else if (q.y > q.z) {
		fb *= max(s.y*vec4(1,1,-1,-1),s.z*vec4(1,-1,1,-1));
		return normalize(pos*(c*sdir.z+b*sdir.y) + vec3(sdir.x,-a*(sdir.y+sdir.z),-a*sdir.y)*s);
	} else {
		fc *= max(s.z*vec4(1,1,-1,-1),s.x*vec4(1,-1,1,-1));
		return normalize(pos*(c*sdir.x+b*sdir.z) + vec3(-a*sdir.z,sdir.y,-a*(sdir.z+sdir.x))*s);
	}
}

float sinh(float f) {
	return (exp(f)-exp(-f))*0.5;
}

vec4 kleinToHyper(vec3 klein) {
	return vec4(klein, 1.)*inversesqrt(1.-dot(klein,klein));
}

float hyperdist(vec4 a, vec4 b) {
	float lcosh = dot(a,b*vec4(-1,-1,-1,1));
	return log(lcosh+sqrt(lcosh*lcosh-1.));
}

void main( void ) {
	// Compute camera path and angle
	float f0 = fract(time*0.05)+1e-5;
	float f = fract(f0*2.);
	float fs = sign(f-.5);
	float fs0 = sign(f0-.5);
	vec3 dir = normalize(vec3(vec2(gl_FragCoord.x / resolution.x - 0.5, (gl_FragCoord.y - resolution.y * 0.5) / resolution.x), 0.5));
	
	float tc = cos((mouse.y-.5)*2.1);
	float ts = sin(-(mouse.y-.5)*2.1);
	float uc = cos((mouse.x-.1)*4.1);
	float us = sin(-(mouse.x-.1)*4.1);

	dir *= mat3(uc,-ts*us,-tc*us,0,tc,-ts,us,ts*uc,tc*uc);
	//dir *= vec3(sign(f-.5),sign(f-.5),1.);
	dir.z *= fs;
	
	float as = (cos(time*.1)*.3);	// there was originally an outer sinh for as and bs but difference is just about 1 percent which doesn't really matter for the camera path
	float ac = sqrt(as*as+1.);
	float bs = (sin(time*.1)*.3);
	float bc = sqrt(bs*bs+1.);
	float cs = sinh((abs(f*2.-1.)-.5)*a);
	float cc = sqrt(cs*cs+1.);
	
	// As last step position & direction are rotated as camera would otherwise fly through an edge instead of a face
	float x = ac*bs;
	float z = ac*bc*cs;
	vec3 pos = vec3(x*a+z,as*e,-x+a*z)/(ac*bc*cc*e);
	//dir = fs;
	dir = normalize(vec3(dir.x*ac*cc-ac*bs*dir.z*cs,-as*dir.z*cs-dir.x*as*bs*cc+dir.y*bc*cc,ac*bc*dir.z)*mat3(a,0,1, 0,e,0, -1.,0,a));
	
	// Actual raytracing starts here
	
	vec4 hpos = kleinToHyper(pos); // remember position in hyperbolic coordinates
	//float odd = fs;		// "oddness" keeps track of reflection color
	
	vec3 color = vec3(0);
	float cremain = 1.0;	// remaining amount of color that can be contributed

	vec4 fa = vec4(39.68454788472584,23.02644300941165,39.78873384183505,27.892411668925842);
	vec4 fb = vec4(29.507160029822894,32.10711839885068,35.17128234256937,26.70192179035261);
	vec4 fc = vec4(24.269388316732734,31.551200069547505,33.74895897903697,38.00825953283422);
	fc.x *= fs0*fs;
	fc.w *= fs0;
	
	for (int i = 0; i < 10; i++) {
		float pd = dot(pos,dir);
		float sDist = (-pd+sqrt(pd*pd-dot(pos,pos)+0.6)); // distance to sphere around origin (always there - camera isn't meant to ever be outside)
		float kDist = kleinDist(pos, dir);	// distance to enclosing polyhedron
		
		pos += dir*min(sDist,kDist);	// compute actual distance (as we're in the klein metric we can't simply do length(a-b) - we have to use
		vec4 hpos2 = kleinToHyper(pos);
		cremain *= exp(-.3*hyperdist(hpos, hpos2)); //... and simulate fog
		hpos = hpos2;
			
		if (sDist < kDist) {
			dir = reflect(dir, -normalize(pos));		// reflect off sphere (as it's around the origin a simple reflection will do it)
			//color += cremain*0.3*(fc.wyz*.25+fb.wyz*.125+fa.wyz*.0625+.5);
			float s = dot(fa+fb+fc,vec4(1.));
			color += cremain*0.5*fract((fa.xyz+fb.xyz+fc.xyz)*(fc.yzw+fb.zwx+fa.wxy)+vec3(s));
			cremain *= 0.5;
		} else {
			dir = hreflect(pos, dir,fa,fb,fc);	// reflect off polyhedron (advanced math stuff) - simulates propagation into "next" polyhedron
		}
		//if (cremain < .003) { break;} // commented out as it seems to actually make things slower
	}
	
	
	gl_FragColor = vec4(color*2.5, 1.);

}
