/*
 * Original shader from: https://www.shadertoy.com/view/4sX3R4
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
// twitter: @eddbiddulph

vec3 cam_origin = vec3(0.0);
mat3 cam_rotation = mat3(0.0);
vec2 frag_coord = vec2(0.0);

vec3 rotateX(float a, vec3 v)
{
	return vec3(v.x, cos(a) * v.y + sin(a) * v.z, cos(a) * v.z - sin(a) * v.y);
}

vec3 rotateY(float a, vec3 v)
{
	return vec3(cos(a) * v.x + sin(a) * v.z, v.y, cos(a) * v.z - sin(a) * v.x);
}

float torusDistance(vec3 p, float inner_radius, float outer_radius)
{
	vec3 ring_p = vec3(normalize(p.xy) * outer_radius, 0.0);
	return distance(p, ring_p) - inner_radius;
}

vec2 orbIntensity(vec3 p)
{
	// return a value to create some nice shapes out of particles
	vec3 ofs = vec3(0.0, 0.0, 0.0);
	float d0 = torusDistance(p - ofs, 0.5, 5.0);
	float d1 = torusDistance(rotateY(3.1415926 * 0.5, p) - ofs, 1.3, 8.0);
	float d2 = torusDistance(rotateX(0.2, rotateY(3.1415926, p)) - ofs, 1.5, 20.0);
	float amb = smoothstep(0.8, 1.0, cos(p.x * 10.0) * sin(p.y * 5.0) * cos(p.z * 7.0)) * 0.02;
	float wave = step(abs(p.y + 10.0 +  cos(p.z * 0.1) * sin(p.x * 0.1 + iTime) * 4.0), 1.0) * 0.3;
	return vec2(max(max(1.0 - step(4.0, length(p)), step(d0, 0.0)), step(d1, 0.0)) + amb + step(d2, 0.0) * 0.1 + wave,
				step(0.3, wave));
}

vec3 project(vec3 p)
{
	// transpose the rotation matrix. unfortunately tranpose() is not available.
	mat3 cam_rotation_t = mat3(vec3(cam_rotation[0].x, cam_rotation[1].x, cam_rotation[2].x),
							   vec3(cam_rotation[0].y, cam_rotation[1].y, cam_rotation[2].y),
							   vec3(cam_rotation[0].z, cam_rotation[1].z, cam_rotation[2].z));
	
	// transform into viewspace
	p = cam_rotation_t * (p - cam_origin);
	
	// project
	return vec3(p.xy / p.z, p.z);
}

vec3 orb(float rad, vec3 coord)
{
	// return the orb sprite
	return 4.0 * (1.0 - smoothstep(0.0, rad, length((coord.xy - frag_coord)))) *
			vec3(1.0, 0.6, 0.3) * clamp(coord.z, 0.0, 1.0);
}

vec3 traverseUniformGrid(vec3 ro, vec3 rd)
{
	vec3 increment = vec3(1.0) / rd;
	vec3 intersection = ((floor(ro) + floor(rd * 0.5 + vec3(0.5))) - ro) * increment;

	increment = abs(increment);
	ro += rd * 1e-3;
	
	vec3 orb_accum = vec3(0.0);
	
	// traverse the uniform grid
	for(int i = 0; i < 50; i += 1)
	{
		vec3 rp = floor(ro + rd * min(intersection.x, min(intersection.y, intersection.z)));
		
		vec2 orb_intensity = orbIntensity(rp);

		// get the screenspace position of the cell's centerpoint										   
		vec3 coord = project(rp + vec3(0.5));
		
		float rmask = smoothstep(0.0, 0.1, distance(frag_coord, coord.xy));
		
		// calculate the initial radius
		float rad = 0.5 / coord.z * (1.0 - smoothstep(0.0, 50.0, length(rp)));
		
		// adjust the radius
		rad *= 0.5 + 0.5 * sin(rp.x + iTime * 5.0) * cos(rp.y + iTime * 10.0) * cos(rp.z);
		
		orb_accum += orb(rad, coord) * orb_intensity.x * mix(1.0, rmask, orb_intensity.y);
		
		// step to the next ray-cell intersection
		intersection += increment * step(intersection.xyz, intersection.yxy) *
									step(intersection.xyz, intersection.zzx);
	}
	
	return orb_accum;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	// get the normalised device coordinates
	vec2 uv = fragCoord.xy / iResolution.xy;
	frag_coord = uv * 2.0 - vec2(1.0);
	frag_coord.x *= iResolution.x / iResolution.y;

	// zoom in
	frag_coord *= 1.5;

	cam_origin = rotateX(iTime * 0.3,
						 rotateY(iTime * 0.5, vec3(0.0, 0.0, -10.0 + 5.0 * cos(iTime * 0.1))));
	
	// calculate the rotation matrix
	vec3 cam_w = normalize(vec3(cos(iTime) * 10.0, 0.0, 0.0) - cam_origin);
	vec3 cam_u = normalize(cross(cam_w, vec3(0.0, 1.0, 0.0)));
	vec3 cam_v = normalize(cross(cam_u, cam_w));
	
	cam_rotation = mat3(cam_u, cam_v, cam_w);
	
	vec3 ro = cam_origin,rd = cam_rotation * vec3(frag_coord, 1.0);
	
	// render the particles
	fragColor.rgb = traverseUniformGrid(ro, rd);
	fragColor.rgb = sqrt(fragColor.rgb * 0.8);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
