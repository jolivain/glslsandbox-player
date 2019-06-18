/*
 * Original shader from: https://www.shadertoy.com/view/4lyyWw
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
#define S(d,r) smoothstep( r*3./R.y, 0., d)   // antialiased draw

// --- line segment with disc ends: seamless distance to segment https://www.shadertoy.com/view/4dcfW8 
float line(vec2 p, vec2 a,vec2 b) { 
    p -= a, b -= a;
	float h = clamp(dot(p, b) / dot(b, b), 0., 1.);   // proj coord on line
	return length(p - b * h);                         // dist to segment
}

// --- rotation https://www.shadertoy.com/view/XlsyWX
#define rot(a) mat2(cos( a + vec4(0,33,11,0)))
    
// --- 3D->2D
vec2 proj( vec3 P ) {
    return 2. * P.xy / (3.+P.z);
}
#define dist(P) ( 2.5+P.z )          // for darken & thickness

// --- 3D curve drawing
void mainImage( out vec4 O, vec2 U )
{
    vec2 R = iResolution.xy;
    U = ( U+U - R ) / R.y;
    
    vec3 _P, P, Pm; 
    vec2 _p, p;
    float d = 1e9, d0,   a=0.,b=0., dl=.03, da;
    
    for (float i=0.; i<1e3; i++) { // --- draw curve

        // --- 3D equation
        P = vec3(cos(b)*sin(a), cos(a), sin(b)*sin(a)); // live on sphere
        da=.2;
      //da = 6.28*dl / (.1+sin(a));  // optim: const size segments
        b += da; 
        a += .25/6.28 *da; if (a>3.14) break;
      //a = i*dl; P = vec3(cos(a),cos(2.73*a),cos(5.91*a)); // simple curve

        // --- to screen 
        P.xz *= rot(-2.*iTime);                   // rotation
        P.yz *= rot(-.8);                         // tilt
        p = proj(P);                              // screen projection

      //if (mod(i,2.)==0.) continue; // display 1 segment / 2
        if (i==0.) { _P=P; _p=p; continue; }      // skip 1st point (1st seg unfinished)
        d0 = line( U, _p, p);                     // cur segment
        d0 /= 5./dist(P);                         // thicken when near
        if (d0<d) { d=d0; Pm = P; }               // if closest to pix, memo
      //O +=  vec4( S(d0, 1.) ) *2./ dist(P);     // direct draw
        _P=P;
        _p=p;
    }
    d = S(d, 1.);                                 // 1 pixel-thick line
    O = vec4( d ) *2./ dist(Pm)
                  * mix(vec4(1,.8,.8,0),vec4(.8,1,.8,0),.5+.5*Pm.y);
               // * vec4(normalize(.5+.5*Pm),1);  // color
    
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
