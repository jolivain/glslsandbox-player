/*
 * Original shader from: https://www.shadertoy.com/view/lt3yRS
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
// A lot of this setup is borrowed from Shane - https://www.shadertoy.com/user/Shane
// Many of the learnings come curtesy of Big Wings - https://www.shadertoy.com/user/BigWings
// And of course the literally thousands of other people who have been developing these concepts over the years.
// But this is an effort to more detailed understanding of the underlying principles.

// movement variables
vec3 movement = vec3(.0);

// Gloable variables for the raymarching algorithm.
const int maxIterations = 256;

// The world!
float world_sdf(in vec3 p) {
    float world = 10.;

    p.x += cos(p.z * .3) * 3.;
    p.y += sin(p.z * .3) * 3.;

    vec3 _p = mod(p, 1.2) - .5;
    vec3 _2p = p;
    _2p.x += sin(_2p.z);
    _2p.y += cos(_2p.z);
    _2p = mod(_2p, 3.0) - 1.5;

    world = min(length(_p)-.1, length(_2p.xy) - .01); // spheres and bendy cylinders

    p = mod(p, 2.) - 1.;
    world = min(world, length(p.xz) - .03); // larger, less bendy cylinders.

    return world;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / min(iResolution.y, iResolution.x);

    // movement
    movement = vec3(iTime, 0., iTime * -4.);

    vec3 lookAt = vec3(0., sin(iTime * .5) * 2., cos(iTime * .5) * 2.);
    vec3 camera_position = vec3(0.5, -.5, -1.0);

    lookAt += movement;
    camera_position += movement;

    vec3 forward = normalize(lookAt-camera_position);
    vec3 right = normalize(vec3(forward.z, 0., -forward.x ));
    vec3 up = normalize(cross(forward,right));

    // FOV - Field of view.
    float FOV = 3.;

    vec3 ro = camera_position; 
    vec3 rd = normalize(forward + FOV*uv.x*right + FOV*uv.y*up);

    float dist = 100.;
    float field = 0.;
    for ( int i = 0; i < maxIterations; i++ ) {
      dist = world_sdf( ro + rd * field );
      field += dist * .03;
    }

    vec3 colour = vec3(field*field*.18, sin(field*.38), sin(field)*.15 * length(uv) + sin(iTime) * .5);
    colour *= colour;

    fragColor = vec4(clamp(colour, 0.0, 1.0), 1.0);
    
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
