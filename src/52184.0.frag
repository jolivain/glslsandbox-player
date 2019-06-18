/*
 * Original shader from: https://www.shadertoy.com/view/4ss3DM
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

// --------[ Original ShaderToy begins here ]---------- //
/// The amount of 'sparks' to use (spark count between about 73-206 is known to crash Win7/Chrome)
#define SPARKS 40    // Low-end
//#define SPARKS 100   // Low-mid
//#define SPARKS 210   // Mid-high (recommended)
//#define SPARKS 500   // High
//#define SPARKS 1000  // Really High
//#define SPARKS 2000  // Insane

/// Switch between defines to choose different sets of settings
#define ORIGINAL_SPARKS
//#define WATER_SPOUT
//#define FIRE_STREAM
//#define STAR_BOMB
//#define WATER_LINE

#define BRIGHTNESS 1.0   /// 0.0 == auto-brightness

#ifdef ORIGINAL_SPARKS
	#define SPEED_FACTOR 1.5
	#define LENGTH_FACTOR 0.6
	#define GROUP_FACTOR 1.0
	#define SPREAD_FACTOR 0.3
	#define MIN_ANGLE 0.1
	#define RAND_FACTOR 1.0
#endif

#ifdef WATER_SPOUT
	#define SPEED_FACTOR 1.5
	#define LENGTH_FACTOR 1.5
	#define GROUP_FACTOR 0.5
	#define SPREAD_FACTOR 0.1
	#define MIN_ANGLE 0.1
	#define RAND_FACTOR 1.0
	#define BLUE
#endif

#ifdef FIRE_STREAM
	#define SPEED_FACTOR 1.5
	#define LENGTH_FACTOR 1.5
	#define GROUP_FACTOR 1.0
	#define SPREAD_FACTOR 0.1
	#define MIN_ANGLE 0.1
	#define RAND_FACTOR 0.0
#endif

#ifdef STAR_BOMB
	#define SPEED_FACTOR 0.5
	#define LENGTH_FACTOR 0.2
	#define GROUP_FACTOR 1.0
	#define SPREAD_FACTOR 0.2
	#define MIN_ANGLE 0.3
	#define RAND_FACTOR 0.0
	#define DOT_SPREAD
#endif

#ifdef WATER_LINE
	#define SPEED_FACTOR 1.5
	#define LENGTH_FACTOR 1.5
	#define GROUP_FACTOR 0.7
	#define SPREAD_FACTOR 0.1
	#define MIN_ANGLE 0.1
	#define RAND_FACTOR 1.0
	#define LINEAR_SPREAD
	#define BLUE
#endif

const float brightness = (float(BRIGHTNESS) == 0.0) ? 200.0 / (float(SPARKS) + 40.0) : float(BRIGHTNESS);

vec3 sampleAngle(float u1) {
	float r = sqrt(u1);
	return vec3(-r * -0.809017, -sqrt(1.0 - u1), r * 0.587785);
}

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
}

float spread(vec2 co) {
#ifdef LINEAR_SPREAD
	return fract(co.x * 0.618033988749895);
#else
	#ifdef DOT_SPREAD
		return fract(co.x * 1.0);
	#else
    	return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
	#endif
#endif
}

float planeIntersection(vec3 rpos, vec3 rdir, vec3 n) {
	return -dot(n, rpos) / dot(rdir, n);
}

float cylinder(vec3 pos, vec3 dir, float len) {
	float x = dot(pos, dir);
	return max(max(length(pos - dir * x) - 0.2, x), -x-len);
}

vec4 color(float age) {
	float f = 1.0 - age * 0.05;
	#ifdef BLUE
	return vec4(0.2*f*f, 0.5*f*f+0.05, 0.5*f+0.4, min(f*2.0, 1.0));
	#else
	return vec4(0.5*f+0.4, 0.5*f*f+0.05, 0.2*f*f, min(f*2.0, 1.0));
	#endif
}

vec3 trace(vec3 rpos, vec3 rdir, vec2 fragCoord) {
	float sparkT = planeIntersection(rpos, rdir, vec3(0.587785, 0.0, -0.809017));
	float floorT = -rpos.y / rdir.y;
	
	vec4 col = vec4(0.0, 0.0, 0.0, rdir.y < 0.0 ? 1.0 : 0.0);
	vec3 sparkCol = vec3(0.0, 0.0, 0.0);
	
	vec3 floorPos = rpos + rdir * floorT;
	vec3 sparkPos = rpos + rdir * sparkT;
	
	float time = iTime * SPEED_FACTOR;
	for (int i = 0; i < SPARKS; i++)
	{
		// Calculate spark position and velocity
		float a = spread(vec2(i, 1.0))*SPREAD_FACTOR+MIN_ANGLE;
		float b = spread(vec2(i, 3.0))*RAND_FACTOR;
		float startTime = spread(vec2(i, 5.0)) * GROUP_FACTOR;
		vec3 dir = sampleAngle(a) * 10.0;
		
		vec3 start = dir * (1.35 + b * 0.3);
		vec3 force = -start * 0.02 + vec3(0.0, 1.2, 0.0);
		float c = fract(time + startTime) * 20.0;
		vec3 offset = start * c + force * c * c * 0.5;
		
		vec3 v = start + force * c;
		float vel = length(v) * LENGTH_FACTOR;
		vec3 vdir = normalize(-v);
		vec4 sc = color(c);
				
		// Shade floor
		if (rdir.y < 0.0) {
			vec3 spos = floorPos + offset;
			float h = cylinder(spos, vdir, vel);
						
			float invRad = 10.0;
			float dist = h * 0.05;
			float atten = 1.0 / (1.0 + 2.0 * invRad * dist + invRad * invRad * dist * dist);
			if (floorT <= sparkT && sparkT > 0.0) {
				dist += 0.8;
				atten += 1.0 / (1.0 + 100.0*dist*dist*dist);
			}
			col += vec4(sc.xyz * sc.w * atten, 0.0) * brightness;
		}
	
		// Shade sparks
		if (floorT > sparkT && sparkT > 0.0 || floorT < 0.0) {
			vec3 spos = sparkPos + offset;			
			float h = cylinder(spos, vdir, vel);
				
			if (h < 0.0) {
				sparkCol += vec3(sc.xyz * sc.w);
			} else {
				float dist = h * 0.05 + 0.8;
				float atten = 1.0 / (1.0 + 100.0 * dist * dist * dist);
				sparkCol += sc.xyz * sc.w * (atten + clamp(1.0 - h * sparkT * 0.05, 0.0, 1.0));
			}
		}
	}
	
	// Shade sky
	float fade = sqrt(length((fragCoord.xy / iResolution.xy) - vec2(0.7, 0.5)));
	vec3 sky = vec3(0.01, 0.01, 0.05) * (1.0 - fade);
	vec3 final = mix(sky, col.xyz, col.w) + sparkCol * brightness;
	return final + vec3(rand(vec2(fragCoord.x * fragCoord.y, iTime))) * 0.002;
}

// Ray-generation
vec3 camera(vec2 px) {
	vec2 rd = (px / iResolution.yy - vec2(iResolution.x/iResolution.y*0.5-0.5, 0.0)) * 2.0 - 1.0;
	vec3 rdir = normalize(vec3(rd.x*0.5, rd.y*0.5, 1.0));
	return trace(vec3(-40.0, 20.0, -150), rdir, px);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
	fragColor = vec4(pow(camera(fragCoord.xy), vec3(0.4545)), 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
