/*
 * Original shader from: https://www.shadertoy.com/view/XlGXRR
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

// in the Amiga superdemos, this would be a sprite
void sphere(inout vec4 O, vec2 U, vec2 P, float r, vec3 C) { // O, U, pos, radius, color
	
 // vec2 R = iResolution.xy, M = (2.*iMouse.xy-R)/R.y;
 // P = P + (P-M)*smoothstep(.9,.0,length(P-M)); // mouse repeal spheres 
 // U = U + (U-M)*smoothstep(.9,.0,length(U-M)); // mouse repeal pixels
    r = length(U-P)/r; if (r>1.) return;

    U = normalize(U-P)*r;
    float A = (1.-O.a) * smoothstep(1.,.9,r);    // compositing and anti-aliasing
    vec3 N = vec3( U, sqrt(1.-dot(U,U)));
    O.rgb += A * clamp(  C*(.2 + max(0., (-N.x+N.y+N.z)/1.732))    // ambiant, diffuse
                       + pow(max(0., dot( N, normalize(vec3(-1,1,2.73)))), 50.)  // specular
                       ,0.,1.);                  // L=(-1,1,1), E=(0,0,1), z toward eye 
    O.a += A;
}

void mainImage( out vec4 O, vec2 U )
{
    vec2 R = iResolution.xy;
         U = (U+U-R)/R.y;
    float t = iTime;
    O -= O;
    for (float a=0.; a<100.; a+=.1)
//      sphere(O, U, .7*vec2(cos(a),sin(1.1*a)),.1, vec3(1,0,0));
//      sphere(O, U, .7*vec2(cos(a+t),sin(1.1*a)),.1, vec3(1,0,0));
//      sphere(O, U, .7*vec2(1.5*cos(a+t)+.3*sin(.9*a),sin(1.1*a)+.3*cos(.8*a)),.1, vec3(1,vec2(a/100.)));
        sphere(O, U, .7*vec2(1.5*cos(a+t)+.3*sin(.9*a),sin(1.13*a)+.3*cos(.81*a+t)),.1, .5+.5*sin(6.28*a/100.+vec3(0,-2.1,2.1)));
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
