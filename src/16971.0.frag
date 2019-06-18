// GLSL rubik's cube by Kabuto

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

// Traces a single big cube (= here: layer of 3x3 small cubes)
void cubetrace(vec3 pos, vec3 dir, vec3 scale, vec3 ofs, inout vec4 hit) {
	pos *= scale;
	pos += ofs;
	dir *= scale;
	vec3 h1 = (-pos-sign(dir))/dir;
	vec3 h2 = (-pos+sign(dir))/dir;
	float h1f = max(max(h1.x,h1.y),h1.z);
	float h2f = min(min(h2.x,h2.y),h2.z);
	if (h1f < h2f && h1f < hit.w) {
		hit = vec4((pos+dir*h1f-ofs)/scale,h1f);
	}
}

// What layer to rotate in what frame
// x: rotation axis (0 to 2), y: rotation layer (0 to 2), z: rotation direction (-1 or 1)
// Math has to be that way (rounding redundantly) due to numerical precision issues
vec3 rotframe(float time) {
	time = floor(time)+.5;
	return floor(vec3(mod(time,3.),mod(floor(time/3.+.1)+.5,3.),floor(mod(time,2.))*2.-1.));
}


const int FRAMES = 32;

void main( void ) {
	vec3 pos = vec3(0.,-.21,-7.);
	vec2 uv = (gl_FragCoord.xy - resolution*.5)/resolution.y*.5;
	vec3 dir = normalize(vec3(uv,1.));

	float tf = mod(time,float(FRAMES))+1e-5;
	vec3 r = rotframe(tf);
	
	float t2 = time*.3;
	mat3 globalrot = mat3(cos(t2),0,-sin(t2),0,1,0,sin(t2),0,cos(t2));
	
	float t = -fract(tf)*3.141592653589*.5*r.z;
	mat3 rot = r.x < .5 ?
		mat3(1,0,0,0,cos(t),sin(t),0,-sin(t),cos(t))
	: r.x < 1.5 ?
		mat3(cos(t),0,-sin(t),0,1,0,sin(t),0,cos(t)) :
		mat3(cos(t),sin(t),0,-sin(t),cos(t),0,0,0,1);

	mat3 rot2 = mat3(1,0,0,0,1,0,0,0,1);

	float a = -.4;
	mat3 prot = mat3(1,0,0,0,cos(a),sin(a),0,-sin(a),cos(a))*globalrot;
	pos *= prot;
	dir *= prot;

	vec4 vhit = vec4(0,0,0,1e9);
	vec3 s = r.x < .5 ? vec3(1,0,0) : r.x < 1.5 ? vec3(0,1,0) : vec3(0,0,1);
	cubetrace(pos*(r.y==0.?rot:rot2),dir*(r.y==0.?rot:rot2),vec3(1,1,1)+s*2.,s*2.,vhit);
	cubetrace(pos*(r.y==1.?rot:rot2),dir*(r.y==1.?rot:rot2),vec3(1,1,1)+s*2.,vec3(0, 0,0),vhit);
	cubetrace(pos*(r.y==2.?rot:rot2),dir*(r.y==2.?rot:rot2),vec3(1,1,1)+s*2.,-s*2.,vhit);
	
		
		
	vec3 hit = vhit.xyz;
	
	for (int i = FRAMES-1; i >= 0; i--) {
		if (float(i)+1. < tf) {
			vec3 r = rotframe(float(i));
			hit = r.x < .5 ? hit : r.x < 1.5 ? hit.yzx : hit.zxy;
			if (abs(floor(hit.x*1.49+1.5)- r.y) < .5) hit.yz *= mat2(0,-r.z,r.z,0);
			hit = r.x < .5 ? hit : r.x < 1.5 ? hit.zxy : hit.yzx;
		}
	}
	
	
	vec3 ahit = abs(hit.xyz);
	vec3 side = sign(hit.xyz)*step(vec3(.99),ahit);
	float m = max(max(ahit.x,ahit.y),ahit.z);
	
	hit.xyz *= 3.;
	hit.xyz = abs(fract(hit.xyz*.5+.5)-.5)*2.;
	float b = max(max(hit.x,hit.y),hit.z);
	float d = min(min(hit.x,hit.y),hit.z);
	float c = hit.x+hit.y+hit.z-b-d;
	c = max(c-.7,0.);
	d = max(d-.7,0.);
	
	
	
	vec3 facecolour = max(side,vec3(0)) + (1.+min(side,vec3(0)))*dot(-min(side,vec3(0)),vec3(1));
	vec3 colour = vec3(step(sqrt(c*c+d*d),.17)*step(.99,m))*facecolour+step(m,.1);
	colour += 1.-min(1.,float(FRAMES)-tf);
	
	gl_FragColor = vec4( colour, 1.0 );

}
