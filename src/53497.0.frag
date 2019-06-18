/*
 * Original shader from: https://www.shadertoy.com/view/ltlGRl
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
#define PI 3.14159265359

vec3 colorBlack = vec3(0.0, 0.0, 0.0);
vec3 colorWhite = vec3(1.0, 1.0, 1.0);
vec3 colorPurple = vec3(0.80, 0.100, 0.6); // yellow

float disk(vec2 r, vec2 center, float radius) {
	return 1.0 - smoothstep( radius-0.007, radius+0.007, length(r-center));
}

highp float rand(vec2 co)
{
    highp float a = 12.9898;
    highp float b = 78.233;
    highp float c = 43758.5453;
    highp float dt= dot(co.xy ,vec2(a,b));
    highp float sn= mod(dt,3.14);
    return fract(sin(sn) * c);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	float t = iTime*2.;
	vec2 r = (2.0*fragCoord.xy - iResolution.xy) / iResolution.y;
	r *= 1.0 + 0.05*sin(r.x*5.+iTime) + 0.05*sin(r.y*3.+iTime);
	r *= 1.0 + 0.2*length(r);
	float side = 0.5;
	vec2 r2 = mod(r, side);
	vec2 r3 = r2-side/2.;
    vec2 r4 = r3/2.0;
	float i = floor(r.x/side)+2.;
	float j = floor(r.y/side)+4.;
	float ii = r.x/side+2.;
	float jj = r.y/side+4.;
	
	// grey background
    vec3 pix = vec3(.9);
	
	float rad, disks, sinCalc;
		
    sinCalc = sin(t+ii*jj);
	rad = 0.14 + 0.5*sinCalc;
	float zebradisks = disk(r3, vec2(0.,0.), rad/1.3);	

	float speed = 2.0;
	float tt = iTime*speed+0.1*i+0.08*j;
	float stopEveryAngle = PI/2.0;
	float stopRatio = 0.7;
	float t1 = (floor(tt) + smoothstep(0.0, 1.0-stopRatio, fract(tt)) )*stopEveryAngle;
		
    float cosTemp = cos(t1+i);
    float sinTemp = sin(t1+j);
	float x = (-0.07*(sinTemp))*0.5;
	float y = (0.055*(cosTemp))*0.5;
    
    // eye white background
	rad = 0.22 + 0.03*sin(t*(1.0+0.01*i));
	float blancdisks = disk(r3, vec2(0.,0.), rad-0.02);
	pix = mix(pix, vec3(0.85+pow(r2.y,1.5)), blancdisks);
    
    // eye black border
    vec2 r5 = vec2(r3.x, r3.y*1.25);
    float disksA = disk(r5*1.3, vec2(0.00,0.01), rad-0.005);
	float disksB = disk(r5, vec2(0.,0.), rad-0.005);
    float diskNoir = max((1.0-(disksB-disksA)), blancdisks) ;
	pix -= vec3(1.0-diskNoir);
    
    float freq=40.0;
    float k= rand(vec2(i,j)) * freq;    
    r3 = vec2(r3.x, r3.y * (floor(mod(t+k, freq) / freq + 0.01*20.0/freq) + 1.0) );
    
    // eye white background
	rad = (0.13 + 0.02*sinCalc)/1.3;
	float testdisks = disk(r3, vec2(x,y), rad+0.007);
	//pix = mix(pix, vec3(1.0), testdisks);
    
    // eye color
	disks = disk(r3, vec2(x,y), rad);
	pix = mix(pix, colorPurple-0.5*r2.y+(0.2-r2.y), disks);    
	rad = 0.05+ 0.005*sinCalc;
    
    // eye white border around black center
    disks = disk(r3, vec2(x,y), rad+0.014);
	pix = mix(pix, colorWhite, disks);
    
	// eye black center
    disks = disk(r3, vec2(x,y), rad);
	pix = mix(pix, colorBlack, disks);
	
    // eye white reflects on black center
    disks = disk(r3, vec2(x+0.025,y+0.042), rad/2.3);
	pix = mix(pix, colorWhite, disks);
    disks = disk(r3, vec2(x+0.04,y), (rad/5.5)+sinTemp*0.001);
	pix = mix(pix, colorWhite, disks);

    // zebra background
    pix = mix(pix, vec3(0.95), zebradisks*(1.0-max(disksB,blancdisks)));
    
	fragColor = vec4(pix,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
