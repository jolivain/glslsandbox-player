/*
 * Original shader from: https://www.shadertoy.com/view/ll2SWW
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
uniform vec4 date;

// shadertoy emulation
#define iTime time
#define iResolution resolution
#define iDate vec4(0.)

// Emulate a black texture
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //

#define EFFECT_LENGTH 5.0
#define PI 3.1415926535
#define LED_SIZE 2.0
#define CELL_SIZE 3.0
#define SIZE (LED_SIZE*CELL_SIZE)

mat2 rot( in float a ) {
    float c = cos(a);
    float s = sin(a);
	return mat2(c,s,-s,c);	
}

float crossDist(vec2 p) {
    vec2 absp = abs(p);
    float mi = min(absp.x, absp.y);
    float ma = absp.x+absp.y-mi;
    float crossv = max(0.4 - mi, 0.0);
    float square = max(0.9 - ma, 0.0);
    return min(square, crossv);
}

// some screen effects

// uv is between -1 and 1 on y, aspect ratio is preserved on x
// frac is between 0 and 1, 0 when the effect starts, 0 when it ends
// feel free to add yor own in the comments!

float effectStar( in vec2 uv ) {
    float theta = atan(uv.y+1.2, uv.x);
    float temp = sin(theta*12.0+iTime*7.45)*0.5+0.5;
    return temp;
}

float effectSpiral( in vec2 uv ) {
    vec2 polar = vec2(atan(uv.y, uv.x)/PI*5.0, log(length(uv)+1.0)*4.0);
    polar.x -= iTime*0.6;
    polar.y += polar.x*0.5 - iTime * 1.2;
    vec2 f = fract(polar);
    return max(f.x, f.y);
}

float effectWave( in vec2 uv, in float frac ) {
    float base = sin(uv.y-frac*2.0*PI+1.5*PI)*0.5+0.5;
    base += sin(uv.x*10.0 - uv.y*4.0-iTime*1.2)*0.025;
    return base;
}

float effectBorder( in vec2 p  ) {
    float crossd = crossDist(p);
    return sin(crossd*60.0+iTime*10.0)*0.5+0.5;
}

float effectPacman( in vec2 uv, in float frac ) {
    float value = 0.0;
    uv *= 4.0;
    vec2 pacmanCenter = vec2(4.7-frac*12.0, 0.0);
    vec2 delta = uv-pacmanCenter;
    float theta = abs(atan(delta.y, -delta.x));
    float mouth = step(max(0.0, sin(iTime*10.0)*0.4+0.35), theta);
    value += max(0.0, 20.0-distance(uv, pacmanCenter)*20.0)*mouth;
    if (uv.x > pacmanCenter.x+0.5) return value;
    vec2 center = vec2(floor(uv.x)+0.5, 0.0);
    value += max(0.0, 5.0-distance(uv, center)*20.0);
    return value;
}

// eyeball effect

float irisColor( in vec3 norm, in float frac, float theta ) {
    float color = 1.0;
    if (norm.z > 0.99+smoothstep(0.0, 0.7, frac)*0.009) {
        color = 0.0;
    } else if (norm.z > 0.9) {
        color = 0.7*(1.0-smoothstep(0.0, 0.1, distance(0.98, norm.z)))*(sin(theta*6.0)*0.3+0.7);
    }
    return color;
}

float effectIris( in vec2 uv, in float frac ) {
    uv *= 1.5;
    float r = length(uv);
	if (r > 1.0) {
		return 0.0;
	} else {
		vec3 l = normalize(vec3(1, 1, 2));
		vec3 p = vec3(uv, sqrt(1.0 - r*r));
        float angle = cos(iTime*0.02914)*15.115;
        mat2 rotxy = rot(angle);
        mat2 rotxz = rot(sin(iTime*0.447)*0.117);
 		l.xy *= rotxy;
        p.xy *= rotxy;
        l.xz *= rotxz;
        p.xz *= rotxz;
        float d = dot(l, p);
        float theta = atan(p.x, p.y)-angle;
		return (d*0.5+d*d*0.3+0.3)*irisColor(p, frac, theta);
	}
}

// clock

// Thanks P_Malin, see https://www.shadertoy.com/view/4sf3RN

const float kCharBlank = 12.0;
const float kCharMinus = 11.0;
const float kCharDecimalPoint = 10.0;
float InRect(const in vec2 vUV, const in vec4 vRect) {
	vec2 vTestMin = step(vRect.xy, vUV.xy);
	vec2 vTestMax = step(vUV.xy, vRect.zw);	
	vec2 vTest = vTestMin * vTestMax;
	return vTest.x * vTest.y;
}
float SampleDigit(const in float fDigit, const in vec2 vUV) {
	const float x0 = 0.0 / 4.0;
	const float x1 = 1.0 / 4.0;
	const float x2 = 2.0 / 4.0;
	const float x3 = 3.0 / 4.0;
	const float x4 = 4.0 / 4.0;
	const float y0 = 0.0 / 5.0;
	const float y1 = 1.0 / 5.0;
	const float y2 = 2.0 / 5.0;
	const float y3 = 3.0 / 5.0;
	const float y4 = 4.0 / 5.0;
	const float y5 = 5.0 / 5.0;
	vec4 vRect0 = vec4(0.0);
	vec4 vRect1 = vec4(0.0);
	vec4 vRect2 = vec4(0.0);
	if(fDigit < 0.5) {
		vRect0 = vec4(x0, y0, x3, y5); vRect1 = vec4(x1, y1, x2, y4);
	} else if(fDigit < 1.5) {
		vRect0 = vec4(x1, y0, x2, y5); vRect1 = vec4(x0, y0, x0, y0);
	} else if(fDigit < 2.5) {
		vRect0 = vec4(x0, y0, x3, y5); vRect1 = vec4(x0, y3, x2, y4); vRect2 = vec4(x1, y1, x3, y2);
	} else if(fDigit < 3.5) {
		vRect0 = vec4(x0, y0, x3, y5); vRect1 = vec4(x0, y3, x2, y4); vRect2 = vec4(x0, y1, x2, y2);
	} else if(fDigit < 4.5) {
		vRect0 = vec4(x0, y1, x2, y5); vRect1 = vec4(x1, y2, x2, y5); vRect2 = vec4(x2, y0, x3, y3);
	} else if(fDigit < 5.5) {
		vRect0 = vec4(x0, y0, x3, y5); vRect1 = vec4(x1, y3, x3, y4); vRect2 = vec4(x0, y1, x2, y2);
	} else if(fDigit < 6.5) {
		vRect0 = vec4(x0, y0, x3, y5); vRect1 = vec4(x1, y3, x3, y4); vRect2 = vec4(x1, y1, x2, y2);
	} else if(fDigit < 7.5) {
		vRect0 = vec4(x0, y0, x3, y5); vRect1 = vec4(x0, y0, x2, y4);
	} else if(fDigit < 8.5) {
		vRect0 = vec4(x0, y0, x3, y5); vRect1 = vec4(x1, y1, x2, y2); vRect2 = vec4(x1, y3, x2, y4);
	} else if(fDigit < 9.5) {
		vRect0 = vec4(x0, y0, x3, y5); vRect1 = vec4(x1, y3, x2, y4); vRect2 = vec4(x0, y1, x2, y2);
	} else if(fDigit < 10.5) {
		vRect0 = vec4(x1, y0, x2, y1);
	} else if(fDigit < 11.5) {
		vRect0 = vec4(x0, y2, x3, y3);
	}	
	
	float fResult = InRect(vUV, vRect0) + InRect(vUV, vRect1) + InRect(vUV, vRect2);
	return mod(fResult, 2.0);
}
float effectClock( in vec2 p ) {
    float value = 0.0;
    float temp = length(p);
    value += smoothstep(0.75, 0.80, temp) * (1.0-smoothstep(0.80, 0.85, temp));
    vec2 push = p;
    p *= rot(-floor(mod(iDate.w, 60.0)) / 60.0 * 2.0 * PI);
   	float sbar = 0.0;
    if (p.x < 0.02 && p.x > -0.02 && p.y > -0.05 && p.y < 0.7) sbar = 1.0;
    value += sbar;
    p = push;
    p.y += 0.2;
    p.x -= 0.03;
    float minutes = mod(iDate.w / 60.0, 60.0);
    float hour = mod(iDate.w / (60.0*60.0), 24.0);
    if (hour > 13.0) hour -= 12.0;
    p.y *= 0.7;
    p.x += 0.7;
    float print = 0.0;
    if ( hour >= 10.0 )
    	print += SampleDigit(floor(hour/10.0), p*3.3);
    p.x -= 0.3;
    print += SampleDigit(floor(mod(hour, 10.0)), p*3.3);
    push = p;
    p.y = -p.y + 0.22;
    p.x = -p.x + 0.44;
    print += SampleDigit(4.0, p*4.5);
    value = print * 0.5 + value * (0.5+0.5*(1.0-print));
    p = push;
    p.x -= 0.5;
    print = SampleDigit(floor(minutes/10.0), p*3.3);
    p.x -= 0.3;
    print += SampleDigit(floor(mod(minutes, 10.0)), p*3.3);
    value = print * 0.5 + value * (0.5+0.5-0.5*print);
    return value;
}

// rotating capsule

float sdCapsule( in vec3 p, in vec3 a, in vec3 b ) {
	vec3 pa = p - a, ba = b - a;
	float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
	return length( pa - ba*h ) - 1.0;
}
float de( in vec3 p ) {
    const vec3 a = vec3(1.5,0.0,0.0);
    const vec3 b = vec3(-1.5,0.0,0.0);
    return sdCapsule(p, a, b);
}
vec3 normal( in vec3 p ) {
	vec3 e = vec3(0.0, 0.001, 0.0);
	return normalize(vec3(
		de(p+e.yxx)-de(p-e.yxx),
		de(p+e.xyx)-de(p-e.xyx),
		de(p+e.xxy)-de(p-e.xxy)));	
}
float colorCap( in vec3 p ) {
    if (p.x > 0.2) return 0.435;
    else if (p.x < -0.2) return 0.65;
    else return 0.9;
}
float effectCapsule( in vec2 uv ) {
    vec3 dir = normalize(vec3(uv * 0.7, 1.0));
    vec3 forward = vec3(0, 0, 1);
    mat2 rotxy = rot(iTime*0.235+0.5);
    mat2 rotzx = rot(iTime*0.412-0.7);
    dir.xy *= rotxy;
    forward.xy *= rotxy;
    dir.zx *= rotzx;
    forward.zx *= rotzx;
    vec3 light = normalize(-forward);
    vec3 from = -forward*5.0;
   	float totdist = 0.0;
    float mindist = 99999.9;
	bool set = false;
    float color = 0.25;
	for (int steps = 0 ; steps < 30 ; steps++) {
		vec3 p = from + totdist * dir;
		float dist = de(p);
        mindist = min(mindist, dist);
		totdist += dist;
		if (dist < 0.04) {
            color = (dot(normal(p), light)*0.5+0.5)*colorCap(p);
            set = true;
            break;
		}
	}
    if ( !set && mindist < 0.25 ) return 0.0;
   	return color;
}


// now put all of this together

// choose the screen to show
float getScreenFX( int fx, vec2 uv, float frac ) {
    fx = int(fract(float(fx)*1.61456)*9.0);
    int temp = fx / 8;
    fx -= temp * 8;
    float value = 0.0;
         if (fx == 0) value = effectStar( uv );
    else if (fx == 1) value = effectSpiral( uv );
    else if (fx == 2) value = effectBorder( uv );
    else if (fx == 3) value = effectClock( uv );
    else if (fx == 4) value = effectWave( uv, frac );
    else if (fx == 5) value = effectCapsule( uv );
    else if (fx == 6) value = effectIris( uv, frac );
    else              value = effectPacman( uv, frac );
   	return value;
}

// blend at transitions
float getScreenOutput( in vec2 uv ) {
    int fx = int(iTime/EFFECT_LENGTH);
    float frac = mod(iTime, EFFECT_LENGTH) / EFFECT_LENGTH;
    float valueA = getScreenFX(fx, uv, 0.0);
    float valueB = getScreenFX(fx-1, uv, frac);
    return mix(valueB, valueA, smoothstep(0.7, 1.0, frac)); 
}

// take the screen output and get the led brightness
float toLED( vec2 frag ) {
    // 1 value for each cells
    vec2 cell = floor((frag+2.0)/SIZE)*SIZE*2.0-iResolution.xy;
    cell /= iResolution.y;
    // do dithering
    float brightness = getScreenOutput(cell);
    if (brightness < 1.0/5.0) return 0.0;
    vec2 pixel = floor(mod(frag.xy/LED_SIZE, CELL_SIZE));
    int x = int(pixel.x);
    int y = int(pixel.y);
    // keep a black border
    if (x == 0 || y == 0) return 0.0;
    if (brightness > 4.0/5.0) return 1.0;
    bool result = false;
    // do the dithering by hand here
    if ((x == 1 && y == 2 && brightness > 3.0/5.0) ||
    	(x == 1 && y == 1 && brightness > 2.0/5.0) ||
    	(x == 2 && y == 2 && brightness > 1.0/5.0)) return 1.0;
    return 0.0;
}

// colored background
float getBackgroundColor( in vec2 uv ) {
    vec2 viguv = uv*2.0-1.0;
    float vignette = max(0.0, dot(viguv, viguv)*0.2-0.1)*1.7;
    uv.x *= iResolution.x/iResolution.y*0.72;
    uv.y = -uv.y;
    uv *= 0.6;
    uv *= 1.0 + sin(iTime*0.0345)*0.1+0.1;
    uv.x += sin(iTime*0.0542)*0.1+0.1;
    uv.y -= sin(iTime*0.0151)*0.15+0.15;
    vec2 color = texture(iChannel0, uv).rg;
    return (color.r+color.g+color.g)/3.0-vignette;
}

// dithered background
vec3 getBackground( in vec2 fragCoord ) {
    vec2 uv = fragCoord.xy / iResolution.xy;
    float brightness = getBackgroundColor(uv);
    vec2 pixel = mod(floor(fragCoord/LED_SIZE), 8.0)/8.0;
    float value = 0.0;
    if (brightness > texture(iChannel1, pixel).r) value = 1.0;
   	return vec3(0.05, value*0.1+0.05, 0.05);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
	vec2 uv = fragCoord.xy / iResolution.xy*2.0-1.0;
    uv.x *= iResolution.x/iResolution.y;
    uv *= 1.0;
    
    fragColor.a = 1.0;
    
    float crossd = crossDist(uv);
    if (crossd > 0.0) {
        float value = 0.0;
        if (crossd < 0.02) value = 1.0;
        else if (crossd < 0.05) value = 0.0;
        else value = toLED(fragCoord);
        fragColor.rgb = vec3(0.05, value+0.05, 0.05);
    } else {
        fragColor.rgb = getBackground(fragCoord);
        
    }
    
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
