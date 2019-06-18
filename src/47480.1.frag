/*
 * Original shader from: https://www.shadertoy.com/view/ldyBDD
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
// this was inspired by the following two shaders:
// https://www.shadertoy.com/view/Mdf3z7
// https://www.shadertoy.com/view/MlfczH

#define A 2. * iTime
#define MinimumDistance 0.0009
#define asgt(i) abs(sin(i * iTime))
#define acgt(i) abs(cos(i * iTime))
#define sgt(i) sin(i * iTime)
#define cgt(i) cos(i * iTime)
#define Giter 5
#define MaxSteps 10
#define Iterations 10
#define raySteps 32 // changing this to 64 might open your third eye

float DE(in vec3 z) {
    vec3 Offset = vec3(0.92858,0.92858,0.32858);
    Offset.y += 0.5*asgt(0.05);
    Offset.x -= 0.2*cgt(0.1);
    
    float Scale = 2.0 + 1.2*asgt(0.1);
    Scale += 0.2*sgt(1.);

	z  = abs(2.-mod(z,4.0));

    z.x *= (1. - 0.01*sgt(1.));
    z.y *= (1. + 0.01*cgt(1.0));
    z.z *= (1. + 0.01*sgt(1.0));

	float d = 10.0;
	for (int m = 0; m < Iterations; m++) {	
		z = abs(z);
		if (z.x<z.y){ z.xy = z.yx;}
		if (z.x< z.z){ z.xz = z.zx;}
		if (z.y<z.z){ z.yz = z.zy;}
		z = Scale*z-Offset*(2.*Scale-1.);
		if( z.z < -0.5*Offset.z*(Scale-1.0))  z.z+=Offset.z*(Scale-1.0);

        d = min(d, length(z) * pow(Scale, float(-m)-1.0));
	}

	return d-0.001;
}
    
vec3 Glow(vec3 z, float b){
    z = fract( z * .2) * 2. -1.;

    for( int i = 0; i < Giter; ++i){ 
        float d = clamp( dot(z, z), .05, .65); 
        z = abs( z ) / d - 1.31;
    }
    return z;
}

vec3 fog(float a,vec3 b,float c){ 
    return 1. / (( 1. + 2.*b/a + b * b/(a*a))*c );
}

vec3 W(vec3 fr,float b,float c,float d){
    vec3 e=(fog( .1, abs(fr), d)*1. +
            fog( .1, vec3(length( fr.yz ), length( fr.zx ), length( fr.xy )), d) * 5.0 
            * (sin( A * vec3(2.1, 1.3, 1.7) + b*10.) + 1.)); 

    return (e * 7. + e.yzx * 1.5 + e.zxy * 1.5) * max( .5 -c *(200.+500.*asgt(1.)) / d, 0. ) / d * 70.;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ){
    vec2 uv = fragCoord.xy / iResolution.xy *2. -1.;
    uv.x *= iResolution.x/iResolution.y;
    float speed = 0.5;
    vec3 base = vec3(0.1, 0.3*sgt(0.1), 0.3*cgt(0.1)) * speed;

    vec3 camPos = 0.2*iTime * base;
	vec3 target = camPos + base;
	vec3 camUp  = vec3(0.0,1.0,0.0);

	vec3 camDir   = normalize(target-camPos); 
	camUp = normalize(camUp-dot(camDir,camUp)*camDir); 
	vec3 camRight = normalize(cross(camDir,camUp));

    vec3 rayDir = normalize( (camRight * uv.x  + camUp * uv.y + camDir));
    vec3 pos, color = vec3(0.); float totalDistance = 0., distance, v;

    for(int i = 0; i < raySteps; ++i){
        pos = camPos + rayDir * totalDistance;
        distance = DE(pos);        
        v = sin( A * .1 + pos.z);
        vec3 x = Glow( pos, v);
        totalDistance += distance + .001; 
        color += ( W( x, v, distance, 1.) ) * (distance + 0.001);      
    }
    fragColor = vec4( pow( color, vec3( .45 )), .5);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
