/*
 * Original shader from: https://www.shadertoy.com/view/4sdGR8
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
vec3 chequer(vec2 uv) {
    uv = fract(uv);
    return uv.x > 0.5 != uv.y > 0.5 ? vec3(0.6, 0.6, 1.0) : vec3(1.0, 1.0, 0.6);
}

#define PI 3.14159265359
#define TriplePI (3.0 * PI)
#define DoublePI (2.0 * PI)
#define HalfPI (PI / 2.0)

/* 
   These functions take a "camera" variable specifying:
     X/Y: Where on the screen we are rendering.
     Z: How far forwards we are.
   And return:
     X/Y: UVs you can use for texture mapping.
     Z: How far the pixel is.
*/

/* A wall directly in front of you. */
vec3 planeZ(float z, vec3 camera) {
    z -= camera.z;
    return vec3(camera.xy * z, z);
}

/* Parallel walls to the left/right of you. */
vec3 planeX(float x, vec3 camera) {
    float divisor = x / camera.x;
    return vec3(camera.y * divisor, abs(divisor) + camera.z, abs(divisor));
}
        
/* Parallel floor and ceiling. */
vec3 planeY(float y, vec3 camera) {
    float divisor = y / -camera.y;
    return vec3(camera.x * divisor, abs(divisor) + camera.z, abs(divisor));
}

/* 
	Parallel walls to the left/right of you. 
	Lines up with tunnels.
*/
vec3 planeXForTunnel(float x, vec3 camera) {
    float divisor = x / camera.x;
    return vec3(camera.y * divisor + (camera.x > 0.0 ? 0.0 : (camera.y > 0.0 ? 2.0 : -2.0)), abs(divisor) + camera.z, abs(divisor));
}
        
/* 
	Parallel floor and ceiling. 
	Lines up with tunnels.
*/
vec3 planeYForTunnel(float y, vec3 camera) {
    float divisor = y / -camera.y;
    return vec3(camera.x * divisor + (camera.y > 0.0 ? 1.0 : -1.0), abs(divisor) + camera.z, abs(divisor));
}

/* A round tunnel. */
vec3 tunnel(float radius, vec3 camera) {
    float dist = radius / length(camera.xy);
    return vec3(atan(camera.y, camera.x) * radius / HalfPI, dist + camera.z, dist);
}

/* Similar to planeZ, but matches up with tunnel. */
vec3 tunnelEnd(float z, float radius, vec3 camera) {
    float angle = atan(camera.x, camera.y);
    float dist = length(camera.xy);
    return vec3(angle * radius / HalfPI, dist * (z - camera.z), z - camera.z);
}

/* -------------------------------------------------------- */

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 aspectNdc = (fragCoord.xy - (iResolution.xy / 2.0)) / (min(iResolution.x, iResolution.y) / 2.0);

    vec4 mouse = vec4(0.0);
    mouse *= 2.0;
    aspectNdc -= mouse.xy;
    aspectNdc /= 1.0 + dot(mouse.xy, aspectNdc);

    
    vec3 camera = vec3(aspectNdc, iTime);
    
	vec3 ringInside = tunnel(1.0, camera);
    
    vec3 ringFront = tunnelEnd(floor(ringInside.y) + 1.0, 1.0, camera);
    
    vec3 wall = planeX(2.0, camera);
    
    vec3 pillarSide = planeX(3.0, camera);
    vec3 pillarFront = planeZ(floor(pillarSide.y) + 0.75, camera);
    
    vec3 sea = planeY(1.0, camera);

    vec3 compute;
    
    if(fract(ringInside.y) < 0.25) {
        compute = ringInside;
    } else {
        if(ringFront.y < 1.2) {
            compute = ringFront;
        } else {
            if(abs(sea.x) > 2.0) {
                if(fract(pillarSide.y) > 0.75) {
                    if(abs(pillarSide.x) < 1.0) {
                        compute = pillarSide;
                    } else {
                        compute = sea;
                    }
                } else {
                    if(abs(pillarFront.y) < 1.0) {
                        if(abs(pillarFront.x) < 3.5) {
                            compute = pillarFront;
                        } else {
                            compute = sea;
                        }
                    } else {
                        compute = sea;
                    }
                }
            } else {
                compute = wall;
            }
        }
    }
   
    
	fragColor = vec4(mix(vec3(0.8, 0.9, 1.0), mix(vec3(0.6, 0.7, 1.0), chequer(compute.xy) / (1.0 + compute.z * 0.5), 1.0 / (1.0 + compute.z * 0.2)), 1.0 / (1.0 + compute.z * 0.05)), 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
