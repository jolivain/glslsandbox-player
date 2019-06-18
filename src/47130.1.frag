/*
 * Original shader from: https://www.shadertoy.com/view/lddfRl
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

// --------[ Original ShaderToy begins here ]---------- //
// Various knobs to twiddle
#define MIN_DIST 0.001
#define STEP_MULTIPLIER 1.0
#define NORMAL_OFFSET 0.001
#define MAX_STEPS 128
#define LEVELS 5
#define SPEED 10.0
#define OVERSAMPLE

// Timing
float zoomtimer() {
    return(sin(iTime * 0.2) * SPEED);
}

// Palette helper
vec3 color(float inVal) {
	vec3 a = vec3(0.5, 0.5, 0.5);
	vec3 b = vec3(0.5, 0.5, 0.5);
	vec3 c = vec3(1.0, 1.0, 0.5);
	vec3 d = vec3(0.8, 0.9, 0.3);
	return(a + b * cos(6.28318 * (c * inVal + d)));
}

// World
vec4 distfunc(vec3 pos) {
  	vec4 box = vec4(0.0);
    box.a = max(max(abs(pos.y) - 0.5, abs(pos.z) - 0.5), abs(pos.x) - 0.5);
    return(box);
}

// For fuzzing up stuff
vec3 hash33(vec3 p){ 
    float n = sin(dot(p, vec3(7, 157, 113)));    
    return fract(vec3(2097152, 262144, 32768)*n); 
}

// View setup
void camera(vec2 coords, out vec3 eye, out vec3 ray, float level) {
    // Zoom-in
    float zoomtime = zoomtimer();
    float zoom = mod(zoomtime, 1.0) - level;
    float zoomlevel = floor(zoomtime) + level;
    
    // Calculate an eye position
    eye = normalize(vec3(
        sin(zoomlevel), 
        sin(iTime + zoomlevel),
        cos(zoomlevel * 2.0))) * 1.75;
    
    float tolevel = zoomlevel;
    vec3 eyeto = normalize(vec3(
        sin(tolevel), 
        sin(iTime + zoomlevel),
        cos(tolevel * 2.0))) * 1.75;
    
    if(abs(eyeto.x) > abs(eyeto.z)) {
    	eyeto = vec3(sign(eyeto.x),  0.0, 0.0);
    }
    else{
        eyeto = vec3(0.0, 0.0, sign(eyeto.z));
    }
    
    // Camera as eye + imaginary screen at a distance
    eye = mix(eye, eyeto, zoom);   
    vec3 lookat = vec3(0.0, 0.0, 0.0);
    vec3 lookdir = normalize(lookat - eye);
    vec3 left = normalize(cross(lookdir, vec3(0.0, 1.0, 0.0)));
    vec3 up = normalize(cross(left, lookdir));
    vec3 lookcenter = eye + lookdir;
	vec3 pixelpos = lookcenter + coords.x * left + coords.y * up;
    ray = normalize(pixelpos - eye);
}

// Raymarch one hit
vec4 march(vec2 coords, out float iters, float level) {
    // Set up view
    vec3 eye, ray;
    camera(coords, eye, ray, level);   
    
    // March
    vec3 pos = eye;
    float dist = 0.0;
    float curdist = 1.0;
    iters = float(MAX_STEPS);
    for(int i = 0; i < MAX_STEPS; i++) {
        curdist = distfunc(pos).a;
        dist += curdist * STEP_MULTIPLIER;
        pos = eye + ray * dist;
        if(curdist < MIN_DIST) {
        	iters = float(i);
            break;
        }
    }
    
    // Check hit
    if(int(iters) == MAX_STEPS) {
    	 return(vec4(pos, -1.0));  
    }
    
    return(vec4(pos, dist));
}

// Colour a hit
vec3 shade(vec2 coords, vec3 pos, float dist, float iters, vec3 matColor, float level) {
    // Set up view, again
    vec3 eye, ray;
    camera(coords, eye, ray, level);
    vec3 lightpos = eye;
    
    // Finite-difference normals
   	vec2 d = vec2(NORMAL_OFFSET, 0.0);
    vec3 normal = normalize(vec3(
        distfunc(pos + d.xyy).a - distfunc(pos - d.xyy).a,
        distfunc(pos + d.yxy).a - distfunc(pos - d.yxy).a,
        distfunc(pos + d.yyx).a - distfunc(pos - d.yyx).a
    ));
    
    // Shading
    vec3 shadowray = normalize(lightpos - pos);    
    float light = max(0.0, dot(normal, shadowray)) + 0.1;
    vec3 itershade = vec3(iters / float(MAX_STEPS));
    vec3 colorval = light * matColor + itershade * 0.3;
    
	return(colorval);
}

// Colour a non-hit
vec3 background(vec2 coords, float level) {
    float zoom = 0.0;
    float zoomtime = zoomtimer();
    zoom = mod(zoomtime, 1.0) - level;
	
    // Try to deal with anisotropy / aliasing
    // Might need more tuning
    vec3 backColorFinal = vec3(0.0);
    float fuzzReq = level -  mod(zoomtime, 1.0);
    float fuzzPow = pow(fuzzReq * 0.24, 3.0);
    float fuzzIters = floor(pow(zoom * 2.0, 2.0) + 1.0);
    
    // Level 0 gets extra zoomy
    if(level == 0.0) {
        coords /= (1.0 + zoom);
        fuzzPow = 0.001;
    }
    
#ifdef OVERSAMPLE
    for(float s = 0.0; s < 100.0; s += 1.0) {
        if(s >= fuzzIters) { break; } // Probably better in some implementations
        vec2 scoords = coords + hash33(vec3(coords.x, coords.y, s)).xy * fuzzPow;
        float shade = sin((scoords.x - scoords.y * 0.7 + iTime * 0.03) * 30.0) * 0.5;
        shade += sin((0.7 * scoords.x + scoords.y + iTime * 0.1) * 100.0) * 0.1;
        vec3 backColor = color(0.2);
        if(shade > 0.0) {
            backColor = color(0.8);
        }
        if(abs(shade) < 0.1) {
            backColor = color(0.9);
        }
        backColorFinal += backColor;
    }
    backColorFinal /= fuzzIters;
#else
    vec2 scoords = coords;
    float shade = sin((scoords.x - scoords.y * 0.7 + iTime * 0.03) * 30.0) * 0.5;
    shade += sin((0.7 * scoords.x + scoords.y + iTime * 0.1) * 100.0) * 0.1;
    vec3 backColor = color(0.2);
    if(shade > 0.0) {
        backColor = color(0.8);
    }
    if(abs(shade) < 0.1) {
        backColor = color(0.9);
    }
    backColorFinal = backColor;
#endif
    return(backColorFinal);
}

// Texture a cube
vec2 hitCoords(vec3 hitPos) {
    vec2 coords;
	if(abs(abs(hitPos.x) - 0.5) < MIN_DIST) {
        coords = hitPos.zy * 2.0;
        coords.x *= -sign(hitPos.x);
    }
    if(abs(abs(hitPos.y) - 0.5) < MIN_DIST) {
        coords = hitPos.xz * 2.0;
    }
    if(abs(abs(hitPos.z) - 0.5) < MIN_DIST) {
        coords = hitPos.xy * 2.0;
    }   
    return(coords);
}

// Image
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 coords[LEVELS + 1];
    float iters[LEVELS];
	vec4 hit[LEVELS];
   	coords[0] = (2.0 * fragCoord.xy  - iResolution.xy) / max(iResolution.x, iResolution.y);
    
    // Trace all hits
    for(int i = 0; i < LEVELS; i++) {
        if(i == 0 || hit[i - 1].w > 0.0) {
    		hit[i] = march(coords[i], iters[i], float(i));
            coords[i+1] = hitCoords(hit[i].xyz);
        }
        else {
        	hit[i].w = -1.0;   
        }
    }
    
    // Shade
    vec3 stackColor = color(0.2);
    for(int i = LEVELS - 1; i >= 0; i--) {
        if(hit[i].w > 0.0) {
            stackColor = shade(coords[i], hit[i].xyz, hit[i].w, iters[i], stackColor, float(i));
        }
        else {
            stackColor = background(coords[i], float(i));   
        }
    }
    fragColor = vec4(stackColor, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
