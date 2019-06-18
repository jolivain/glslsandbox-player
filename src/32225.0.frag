// Simple color picker... now with touch control
// public domain


#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform sampler2D bb;




#define goTYPE p = ( gl_FragCoord.xy /resolution.xy ) * vec2(64,32);vec3 c = vec3(0);vec2 cpos = vec2(2.*sin(time*1.1001234567890),1.+0.25*abs(sin(time*2.)));vec3 txColor = vec3(1);
#define goPRINT gl_FragColor += vec4(c, 1.0);
#define slashN cpos = vec2(1,cpos.y-6.);
#define inBLK txColor = vec3(0);
#define inWHT txColor = vec3(1);
#define inRED txColor = vec3(1,0,0);
#define inYEL txColor = vec3(1,1,0);
#define inGRN txColor = vec3(0,1,0);
#define inCYA txColor = vec3(0,1,1);
#define inBLU txColor = vec3(0,0,1);
#define inPUR txColor = vec3(1,0,1);
#define inPCH txColor = vec3(1,0.7,0.6);
#define inPNK txColor = vec3(1,0.7,1);
#define A c += txColor*Sprite3x5(31725.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define B c += txColor*Sprite3x5(31663.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define C c += txColor*Sprite3x5(31015.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define D c += txColor*Sprite3x5(27502.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define E c += txColor*Sprite3x5(31143.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define F c += txColor*Sprite3x5(31140.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define G c += txColor*Sprite3x5(31087.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define H c += txColor*Sprite3x5(23533.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define I c += txColor*Sprite3x5(29847.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define J c += txColor*Sprite3x5(4719.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define K c += txColor*Sprite3x5(23469.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define L c += txColor*Sprite3x5(18727.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define M c += txColor*Sprite3x5(24429.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define N c += txColor*Sprite3x5(7148.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define O c += txColor*Sprite3x5(31599.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define P c += txColor*Sprite3x5(31716.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define Q c += txColor*Sprite3x5(31609.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define R c += txColor*Sprite3x5(27565.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define S c += txColor*Sprite3x5(31183.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define T c += txColor*Sprite3x5(29842.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define U c += txColor*Sprite3x5(23407.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define V c += txColor*Sprite3x5(23402.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define W c += txColor*Sprite3x5(23421.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define X c += txColor*Sprite3x5(23213.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define Y c += txColor*Sprite3x5(23186.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define Z c += txColor*Sprite3x5(29351.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define n0 c += txColor*Sprite3x5(31599.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define n1 c += txColor*Sprite3x5(11410.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define n2 c += txColor*Sprite3x5(29671.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define n3 c += txColor*Sprite3x5(29391.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define n4 c += txColor*Sprite3x5(23497.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define n5 c += txColor*Sprite3x5(31183.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define n6 c += txColor*Sprite3x5(31215.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define n7 c += txColor*Sprite3x5(29257.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define n8 c += txColor*Sprite3x5(31727.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define n9 c += txColor*Sprite3x5(31695.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define DOT c += txColor*Sprite3x5(2.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define COLON c += txColor*Sprite3x5(1040.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define PLUS c += txColor*Sprite3x5(1488.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define DASH c += txColor*Sprite3x5(448.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define LPAREN c += txColor*Sprite3x5(10530.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define RPAREN c += txColor*Sprite3x5(8778.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define _ cpos.x += 4.;if(cpos.x > 61.) slashN
#define BLOCK c += txColor*Sprite3x5(32767.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define QMARK c += txColor*Sprite3x5(25218.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define EXCLAM c += txColor*Sprite3x5(9346.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define EQUAL c += txColor*Sprite3x5(3640.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define HEART c += txColor*Sprite3x5(3024.,floor(p-cpos));cpos.x += 4.;if(cpos.x > 61.) slashN
#define getBit(num,bit) float(mod(floor(floor(num)/pow(2.,floor(bit))),2.) == 1.0)
#define Sprite3x5(sprite,p) getBit(sprite,(2.0 - p.x) + 3.0 * p.y) * float(all(lessThan(p,vec2(3,5))) && all(greaterThanEqual(p,vec2(0,0))))
#define iHEX if(i < 0.5){if(i < 0.25){if(i < 0.125){if(i < 0.0625){n0}else{n1}}else{if(i < 0.1875){n2}else{n3}}}else{if(i < 0.375){if(i < 0.3125){n4}else{n5}}else{if(i < 0.4375){n6}else{n7}}}}else{if(i < 0.75){if(i < 0.625){if(i < 0.5625){n8}else{n9}}else{if(i < 0.6875){A}else{B}}}else{if(i < 0.875){if(i < 0.8125){C}else{D}}else{if(i < 0.9375){E}else{F}}}}
varying vec2 surfacePosition;
vec3 hsv2rgb(vec3 c)
{
	c.x=fract(c.x+time*.017+length(surfacePosition)*.25);
    vec4 q = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + q.xyz) * 6.0 - q.www);
    return pow(c.z * mix(q.xxx, clamp(p - q.xxx, 0.0, 1.0), c.y), vec3(1.25));
}

float sdRect(vec2 p, vec2 t, vec2 b)
{
	vec2 d = abs(p-t)-b;
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}


float sdCircle(vec2 p, vec2 t, float r)
{
    return length(p-t)-r;
}

const float PI = 3.14159265358979323846264;

vec4 mem_load(){
	/*
	Read saved input. 
	*/
	return texture2D(bb, vec2(0.));
}
void mem_save(){
	/*
	Check for input changes, then store input memory. 
	*/
	if(length(gl_FragCoord.xy) < 1.){
		gl_FragColor = mem_load();
		
		vec2 m = (mouse-0.5)* vec2(1.0, resolution.y/resolution.x);
		if(length(m) < 0.15){
			gl_FragColor.yz = 0.5+m*6.;
		}else{
			gl_FragColor.x = fract(0.25-atan(m.x, m.y)/(2.*PI));
		}
	}
}


void main()
{
	
	vec4 mem = mem_load();
	
    vec2 huePos = vec2(cos(2.*PI*mem.x), sin(2.*PI*mem.x))*0.35;
    vec2 shadePos = 0.17*2.*(mem.yz-0.5);
    
    vec2 p = (gl_FragCoord.xy/resolution*2.0-1.0) * vec2(1.0, resolution.y/resolution.x);
    float sd = sdRect(p, vec2(0.0), vec2(0.17));
    float osd = max(sdCircle(p, vec2(0.0), 0.4), -sdCircle(p, vec2(0.0), 0.3));
    
    float a = min(1.0, length(p) / 0.25);
    vec2 d = normalize(p);
    float b = (atan(d.y, d.x) + (PI)) / (2.0*PI);
    
    // Hue
    float w = (atan(huePos.y, huePos.x) + (PI)) / (2.0*PI);
    float hsd = max(sdCircle(p, huePos, 0.058), -sdCircle(p, huePos, 0.04));
    
    // Shade
    float ssd_inner = sdCircle(p, shadePos, 0.045);
    float ssd = min(sdCircle(p, shadePos, 0.058), ssd_inner);
    vec3 selectedColor = hsv2rgb(vec3(w, 0.5+0.5*clamp(vec2(shadePos)/(0.17), vec2(-1.0), vec2(1.0))));
    
    vec3 color = vec3(0.0);
    if (osd < 0.0)
    {
        color = hsv2rgb(vec3(b, 1.0, 1.0));
    }
    else if (sd < 0.0)
    {
        color.rgb = hsv2rgb(vec3(w, 0.5+0.5*clamp(vec2(p)/(0.17), vec2(-1.0), vec2(1.0))));
    } else if (length(p) < 1.0){
	color.rgb = selectedColor;
    }
    
    sd = min(ssd, min(hsd, min(sd, osd)));
    //color = smoothstep(0.0, -2.0/resolution.y, sd)*color;
    color.rgb = mix(vec3(1.0), color, smoothstep(-2.0/resolution.y, 0.0, hsd));
    color.rgb = mix(vec3(1.0), color, smoothstep(-2.0/resolution.y, 0.0, ssd));
    color.rgb = mix(selectedColor, color, smoothstep(-2.0/resolution.y, 0.0, ssd_inner));
    float mask = smoothstep(2.0/resolution.y, 0.0, -sd);
    gl_FragColor = vec4(color, 1.0);
	
	if(length(p) > 0.420){
		gl_FragColor = vec4(selectedColor,1.)*pow(1.-.75*length(p)*length(p), 0.5);
	}
	
	goTYPE _ _ _
		float i = 0.;
		i = selectedColor.x; iHEX
		i = fract(i*7.999); iHEX
		
		i = selectedColor.y; iHEX
		i = fract(i*7.999); iHEX
		
		i = selectedColor.z; iHEX
		i = fract(i*7.999); iHEX
		
	goPRINT
	mem_save();
	
	// adding a simple drop shadow (and bumping)
	float dc = dot(vec3(1), texture2D(bb, (gl_FragCoord.xy+vec2(-2, 2))/resolution).rgb);
	if(dc >= 3.){
		gl_FragColor *= gl_FragColor;
	}
}

