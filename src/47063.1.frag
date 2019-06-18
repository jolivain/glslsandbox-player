/*
 * Original shader from: https://www.shadertoy.com/view/ld3BDS
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
// BY Bart Knuiman


#define PI 3.14159


float hash(float f)
{
    return fract( sin(f * 77321.81283) );
}

float sub( float d, float d2 )
{
    return max(-d2, d);
}

float add( float d2, float d )
{
    return min(d2, d);
}

float sect( float d, float d2 )
{
    return max(d,d2);
}

vec2 rotate( float ang, vec2 v )
{
    float s = sin(ang);
    float c = cos(ang);
    return vec2( c*v.x-s*v.y, s*v.x+c*v.y );
}

float circle( vec2 where, vec2 uv, float radius )
{
    vec2 dv = uv-where;
    return sqrt(dot(dv,dv))-radius;
}

float ellips( vec2 where, vec2 uv, vec2 ab, float radius )
{
    vec2 dv = (uv-where) / ab;
    return length(dv)-radius;
}

float square( vec2 where, vec2 uv, vec2 hsize )
{
    vec2 dv = abs(uv - where) - hsize;
    return min(0., max(dv.x, dv.y)) + length(max(dv,0.));
}

float rsquare( vec2 where, vec2 uv, vec2 hsize, float edge )
{
    float d =square(where,uv,hsize);
    return d-edge;
}


float blownQuad( vec2 uv, vec2 size, float roundness, float edge )
{
    float d=0.;
    d=ellips( vec2(0.), uv, vec2(roundness,1.), size.y );
    d=sect(d,ellips(vec2(0.),uv,vec2(1.,roundness),size.x));
    return d;
}

float hline( vec2 uv, float len )
{
    vec2 cp = uv;
    cp.y=0.;
    cp.x = max(min(uv.x,len*.5), -len*.5);
    return distance(cp,uv);
}

float vline( vec2 uv, float len )
{
    return hline(rotate(PI*.5, uv),len);
}

float line( vec2 uv, vec2 a, vec2 b )
{
    vec2 d=a-b;
    vec2 m=(a+b)*.5;
    return hline( rotate(-atan(d.y,d.x), uv-m), length(d) );
}


float trapezoid( vec2 uv, vec3 s, float edge ) // top,bottom,height
{
    vec2 cp0 = vec2(-s.x,s.z)*.5;
    vec2 cp1 = cp0+vec2(s.x,0.);
    vec2 cp2 = vec2(-s.y,-s.z)*.5;
    vec2 cp3 = cp2+vec2(s.y,0.);
    float d = line( uv, cp0, cp1 );
    d = add( d, line( uv, cp1, cp3 ) );
    d = add( d, line( uv, cp3, cp2 ) );
    d = add( d, line( uv, cp2, cp0 ) );
    return d-edge;
}


float head( vec2 uv )
{
    float d=0.;
    d = ellips( vec2(0., 0.), uv, vec2(1.2, 1.), .2 ); // head
    d = add( d, ellips( vec2(-.08, .25), rotate(-.2,uv), vec2(1.,2.4), .1) ); // ear1
    d = add( d, ellips( vec2(.08, .25), rotate(.1,uv), vec2(1.,2.3), .1) ); // ear2
    return d;
}

float face( vec2 uv )
{
    float d=0.;
    d = square(vec2(.0, 0.), rotate(3.5, uv-vec2(.0,-.1)), vec2(.02, 0.002)) ; // mouth1
    d = add( d, square(vec2(.0, 0.), rotate(-3.5, uv-vec2(.0,-.1)), vec2(.02, 0.002)) ); // mouth2
    d = add( d, ellips( vec2(-.1, .0), rotate(.1,uv), vec2(1.,1.2), .006) ); // eye1
    d = add( d, ellips( vec2(.1, -.01), rotate(-.1,uv), vec2(1.,1.2), .006) ); // eye2
    return d;
}


float arms( vec2 uv )
{
    float d = trapezoid( rotate( 1.4, uv+vec2(-.2,.22) ), vec3(.12,.15,.07), .034);
    d = add( d, trapezoid( rotate( -1.6, uv+vec2(.27,.19) ), vec3(.13,.15,.08), .034) );
    return d;
}

float handsFeet( vec2 uv )
{
    float d=0.;
    d = rsquare( vec2(.0), rotate( -.18, uv+vec2(-.28,.205) ), vec2(.028, .042), 0.033 );
    d = add(d, rsquare( vec2(.0), rotate( -0.03, uv+vec2(.35,.19) ), vec2(.028, .042), 0.033 ));
    d = add(d, rsquare( vec2(.0), rotate( -0.0, uv+vec2(-.07+.04,.49) ), vec2(.048, .022), 0.033 ));
    d = add(d, rsquare( vec2(.0), rotate( -0.0, uv+vec2(.1+.04,.49) ), vec2(.048, .022), 0.033 ));
    return d;
}

float body( vec2 uv )
{
    float d = 0.;
    vec2 uvarm = uv;
    uv = rotate( .05, uv+vec2(0.039,.28) );
    d = blownQuad( uv, vec2(.27,.21), 2., .0 );
 	return add( d, arms(uvarm) );
}

float balloon( vec2 uv )
{
    float d=0.;
    float x=sin(iTime*2.)*.02;
    float y=sin(iTime+hash(PI))*.004;
    d=ellips(vec2(.0),rotate(.1,uv-vec2(.44+x,.28+y)),vec2(1.,1.1),.17);
    d=add(d, line(uv, vec2(.33,-0.2), vec2(.4+x,.1+y) ));
    return d;
}

float nsmoothstep(float e0, float e1, float x, float f)
{
    f=1./f;
    x = smoothstep(e0*f,e1*f,x);
    return x;
}


vec3 strokestep( float e, float m, float x, vec3 left, vec3 mid, vec3 right )
{
    return
    mix( mix( left, mid, smoothstep( -e-m, -m, x ) ), right, 
        smoothstep( m, e+m, x ) );
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    uv -= .5;
    uv.x *= iResolution.x/iResolution.y;
    
    // shapes
    vec2 ruv=rotate(sin(iTime)*.03,uv);
    float hd = head( ruv );
	float fd = face( ruv );
    float bd = body( uv );
    float ds = handsFeet( uv );
    float ld = balloon( uv );

    // materials
    vec3 bgb   = vec3(.5, .5, 1.) * pow( (1.3-length(uv)), .2 );
    vec3 black = vec3(.3);
    vec3 white = vec3(1.);
    vec3 orang = vec3(1., .45, 0.2);
    vec3 yello = vec3(1.0,0.85,0.0);
    
    // anti-aliasing
    const float AA  = 0.003;
    const float M   = 0.004;
    
    vec3 col=vec3(0.);
    float a=0.;
    
    // balloon > bg
    col = strokestep( AA, M, ld, yello, black, bgb );
    
    // hands > balloon
    col = strokestep( AA, M, ds, white, black, col );
    
    // body > hands
    col = strokestep( AA, M, bd, orang, black, col );

    // head > body
    col = strokestep( AA, M, hd, white, black, col );

    // face > head
    a = nsmoothstep( 0., AA, fd, 1. );
	col = mix( black, col, a );
    

    // Output to screen
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
