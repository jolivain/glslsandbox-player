#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float hash( float n )
{
    return fract(sin(n)*43758.5453123);
}

bool notEmpty(ivec3 p)
{
	return false;
}

// return location of first non-empty block
// marching accomplished with fb39ca4's non-branching dda: https://www.shadertoy.com/view/4dX3zl
vec3 intersect(vec3 ro, vec3 rd, out ivec3 ip, out ivec3 n)
{
	ivec3 mapPos = ivec3(floor(ro + 0.));
	vec3 deltaDist = abs(vec3(length(rd)) / rd);
	ivec3 rayStep = ivec3(sign(rd));
	vec3 sideDist = (sign(rd) * (vec3(mapPos) - ro) + (sign(rd) * 0.5) + 0.5) * deltaDist; 
	
	bvec3 mask;
	for (int i = 0; i < 15; i++) {
		if (notEmpty(mapPos)) continue;
		
		bvec3 b1 = lessThan(sideDist.xyz, sideDist.yzx);
		bvec3 b2 = lessThanEqual(sideDist.xyz, sideDist.zxy);
		mask.x = b1.x && b2.x;
		mask.y = b1.y && b2.y;
		mask.z = b1.z && b2.z;
		
		//All components of mask are false except for the corresponding largest component
		//of sideDist, which is the axis along which the ray should be incremented.			
		sideDist += vec3(mask) * deltaDist;
		mapPos += ivec3(mask) * rayStep;
	}
	ip = mapPos;
	n = ivec3(mask)*ivec3(sign(-rd));
	
	// intersect the cube (copied from iq :] )
	vec3 mini = (vec3(mapPos)-ro + 0.5 - 0.5*sign(rd))/rd;
	float t = max ( mini.x, max ( mini.y, mini.z ) );
	
	return ro+rd*t;
}

void cameraTransform( inout vec3 ro, inout vec3 rd )
{
	// turn camera left/right slightly
	float theta = sin(time)/4.0;
	
	float c = cos(cos(theta)/10.0);
	float s = sin(sin(theta)/10.0);
    mat3 rot = mat3(
		  c,  0.0,   s,
		0.0,  1.0, 0.0,
		 -s,  0.0,   c
	);
	ro *= rot;
	rd *= rot;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = (fragCoord.xy-resolution.xy/2.0) / resolution.yy;
	uv.y = -uv.y;
	
	// perspective projection
	vec3 ro = vec3(0.01,0.01,0.01);
	vec3 rd = normalize(vec3(uv,1.0));
	cameraTransform(ro, rd);
	
	ivec3 ip;
	ivec3 n;
	vec3 pos = intersect(ro,rd, ip,n);
	vec3 col = vec3(hash(float(ip+10*ip.y+100*ip)));
	
	vec3 cubeP = mod(pos-0.001,1.0);
	vec3 edgeD = 0.5-abs(cubeP-0.5);
	edgeD += abs(vec3(n));
	float closest = min(edgeD.x,min(edgeD.y,edgeD.z));
	float glow = smoothstep(0.1,0.0,closest);
	col.rg += glow;

	fragColor = vec4(col,1.0);
}

void main()
{
	vec4 color;
	mainImage(gl_FragColor, gl_FragCoord.xy);
}
