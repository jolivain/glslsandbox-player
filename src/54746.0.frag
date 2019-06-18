/*
 * Original shader from: https://www.shadertoy.com/view/3ll3Dl
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
#define SCALE 0.5
#define STEPS 100.

float rand(vec2 p) {
	return fract(sin(dot(p, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noiseTex(vec2 p) {
	vec2 n = floor(p*SCALE);
	vec2 f = fract(p*SCALE);
    f = vec2(smoothstep(0.,1.,f.x),smoothstep(0.,1.,f.y));
	float c1 = rand(n), c2 = rand(n+vec2(1.,0.)), c3 = rand(n+vec2(0.,1.)), c4 = rand(n+vec2(1.,1.));
    return mix(mix(c1,c2,f.x), mix(c3,c4,f.x), f.y);
}

float sdf(vec3 p, vec3 eye) {
    if (length(p - eye) > 30.) return 1000.;
	return p.y - noiseTex(p.xz) + noiseTex(p.xz*10.*vec2(2.5,1.))/100. - noiseTex(p.xz*150.)/350.;
}

vec3 normal(vec3 p, vec3 eye) {
	vec2 e = vec2(0.001, 0.);
	return normalize(vec3(
		sdf(p+e.xyy, eye)-sdf(p-e.xyy, eye),
		sdf(p+e.yxy, eye)-sdf(p-e.yxy, eye),
		sdf(p+e.yyx, eye)-sdf(p-e.yyx, eye)
		));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{

	vec2 uv = ( 2.*fragCoord.xy - iResolution.xy ) /iResolution.y;

	vec2 eyexz = vec2(0.,iTime);
	vec3 eye = vec3(eyexz.x,3. - sdf(vec3(eyexz.x,2.,eyexz.y), eyexz.xxy), eyexz.y);
	vec3 raydir = normalize(vec3(uv.x,uv.y-.5,1.));
	vec3 p = eye;
	float hit = 0.;
				
	for (float i = 0.; i < STEPS; i++) {
		float d = sdf(p, eye);
		if (d < 0.001) {
			hit = i;
			break;
		}
		p += d * raydir;
	}
	
	vec3 lightdir = normalize(vec3(-.5,-1.,-1.));
	vec3 color = vec3(0.);
    vec3 dark = vec3(.3,.2,.1);
	if (hit > 0.) {
		color = mix(
            dark,
            vec3(.9,.7,.4),
            clamp(dot(normal(p, eye), -lightdir) - hit/STEPS, 0.,1.));
        color = mix(
            color,
            vec3(1.,0.9,0.5),
            p.y-.3
            );
      	color = mix(
            color,
            dark,
            clamp(length(p-eye)/20., 0., 1.));
    } else if (length(p-eye) > 100.) {
     	color = mix(vec3(.9,.99,.90),vec3(.5,.6,.99),uv.y);
    } else {
        color = dark;
    }
    
    //color = vec3(noiseTex(uv*10.));
	
	fragColor = vec4( color, 1.0 );
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
