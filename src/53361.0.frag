/*
 * Original shader from: https://www.shadertoy.com/view/XsGGW3
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
const vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
float lineWidth = 0.0;

float line(vec2 p, vec2 a, vec2 b)
{
	vec2 pa = p - a;
	vec2 ba = b - a;
	float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

//Numbers
float _11(vec2 uv) {
    return min(min(
             line(uv,vec2(-0.2,0.45),vec2(0.,0.6)),
             length(vec2(uv.x,max(0.,abs(uv.y-.1)-.5)))),
             length(vec2(max(0.,abs(uv.x)-.2),uv.y+.4)));
             
}
float _22(vec2 uv) {
    float x = min(line(uv,vec2(0.185,0.17),vec2(-.25,-.4)),
                  length(vec2(max(0.,abs(uv.x)-.25),uv.y+.4)));
    uv.y-=.35;
    uv.x += 0.025;
    return min(x,abs(atan(uv.x,uv.y)-0.63)<1.64?abs(length(uv)-.275):
               length(uv+vec2(.23,-.15)));
}
float _33(vec2 uv) {
    uv.y-=.1;
    uv.y = abs(uv.y);
    uv.y-=.25;
    return atan(uv.x,uv.y)>-1.?abs(length(uv)-.25):
           min(length(uv+vec2(.211,-.134)),length(uv+vec2(.0,.25)));
}
float _44(vec2 uv) {
    float x = min(length(vec2(uv.x-.15,max(0.,abs(uv.y-.1)-.5))),
                  line(uv,vec2(0.15,0.6),vec2(-.25,-.1)));
    return min(x,length(vec2(max(0.,abs(uv.x)-.25),uv.y+.1)));
}
float _55(vec2 uv) {
    float b = min(length(vec2(max(0.,abs(uv.x)-.25),uv.y-.6)),
                  length(vec2(uv.x+.25,max(0.,abs(uv.y-.36)-.236))));
    uv.y += 0.1;
    uv.x += 0.05;
    float c = abs(length(vec2(uv.x,max(0.,abs(uv.y)-.0)))-.3);
    return min(b,abs(atan(uv.x,uv.y)+1.57)<.86 && uv.x<0.?
               length(uv+vec2(.2,.224))
               :c);
}
float _66(vec2 uv) {
    uv.y-=.075;
    uv = -uv;
    float b = abs(length(vec2(uv.x,max(0.,abs(uv.y)-.275)))-.25);
    uv.y-=.175;
    float c = abs(length(vec2(uv.x,max(0.,abs(uv.y)-.05)))-.25);
    return min(c,cos(atan(uv.x,uv.y+.45)+0.65)<0.||(uv.x>0.&& uv.y<0.)?b:
               length(uv+vec2(0.2,0.6)));
}
float _77(vec2 uv) {
    return min(length(vec2(max(0.,abs(uv.x)-.25),uv.y-.6)),
               line(uv,vec2(-0.25,-0.39),vec2(0.25,0.6)));
}
float _88(vec2 uv) {
    float l = length(vec2(max(0.,abs(uv.x)-.08),uv.y-.1+uv.x*.07));
    uv.y-=.1;
    uv.y = abs(uv.y);
    uv.y-=.245;
    return min(abs(length(uv)-.255),l);
}
float _99(vec2 uv) {
    uv.y-=.125;
    float b = abs(length(vec2(uv.x,max(0.,abs(uv.y)-.275)))-.25);
    uv.y-=.175;
    float c = abs(length(vec2(uv.x,max(0.,abs(uv.y)-.05)))-.25);
    return min(c,cos(atan(uv.x,uv.y+.45)+0.65)<0.||(uv.x>0.&& uv.y<0.)?b:
               length(uv+vec2(0.2,0.6)));
}
float _00(vec2 uv) {
    uv.y-=.1;
    return abs(length(vec2(uv.x,max(0.,abs(uv.y)-.25)))-.25);
}

float segment(vec2 uv)
{
    uv = abs(uv);
    
    //Round edges
    uv.y = max(uv.y-0.225, 0.);
	float f = length(uv)+.43;
    
    //Bevel edges
	//float f = max(0.45+uv.x,0.225+uv.y+uv.x);
    return f;
}

float sevenSegment(vec2 uv,int num)
{
    if (iMouse.w>0.) {
        uv.y+=.1;
        uv.y/=.95;
        if (num==0) return _00(uv)+.43;
        if (num==1) return _11(uv)+.43;
        if (num==2) return _22(uv)+.43;
        if (num==3) return _33(uv)+.43;
        if (num==4) return _44(uv)+.43;
        if (num==5) return _55(uv)+.43;
        if (num==6) return _66(uv)+.43;
        if (num==7) return _77(uv)+.43;
        if (num==8) return _88(uv)+.43;
        if (num==9) return _99(uv)+.43;
    }
        
	float seg= 5.0;
	seg = (num!=-1 && num!=1 && num!=4                    ?min(segment(uv.yx+vec2(-0.450, 0.000)),seg):seg);
	seg = (num!=-1 && num!=1 && num!=2 && num!=3 && num!=7?min(segment(uv.xy+vec2( 0.225,-0.225)),seg):seg);
	seg = (num!=-1 && num!=5 && num!=6                    ?min(segment(uv.xy+vec2(-0.225,-0.225)),seg):seg);
	seg = (num!=-1 && num!=0 && num!=1 && num!=7          ?min(segment(uv.yx+vec2( 0.000, 0.000)),seg):seg);
	seg = (num==0 || num==2 || num==6 || num==8           ?min(segment(uv.xy+vec2( 0.225, 0.225)),seg):seg);
	seg = (num!=-1 && num!=2                              ?min(segment(uv.xy+vec2(-0.225, 0.225)),seg):seg);
	seg = (num!=-1 && num!=1 && num!=4 && num!=7          ?min(segment(uv.yx+vec2( 0.450, 0.000)),seg):seg);
	
	return seg;
}

float sevenSegmentFloat(vec2 uv, float num, float digit) {
    float start = 1.0-.9/pow(9.,digit);
    float m = smoothstep(start,1.0,fract(num));
    if (m<0.01)
        return sevenSegment(uv,int(num));
    else {
        //uv *= 1.0+0.08*sin(m*3.14);
        float s1 = sevenSegment(uv,int(num));
    	float s2 = sevenSegment(uv,int(mod(num+1.0,10.)));
        //s1 -= m*.1;
        //s2 -= (1.0-m)*.1;
        m = sin(pow(m,1.5)*2.035)/sin(2.035);
    	return 1.0/mix(1.0/s1, 1.0/s2, m);
    }
}

float curveFract(float x) {
    float f = fract(x);
    f = 1.0-cos(f*3.1416);
    return floor(x)+f*.4999;
}

float log10 = log(10.0);
float showNum(vec2 uv,float nr, bool zeroTrim)
{
    bool neg = nr<0.0;
    if (neg) nr *= -1.;
    
    float digitCount = max(1.0,log(nr)/log10+.000001+1.0);
	float seg= 5.0;
    
    // Center number
    float dc = curveFract(digitCount)-0.5;
                // Attempt to center one +0.5*smoothstep(0.0,2.0,nr / pow(10.,floor(digitCount)-1.0));
    uv *= (4.+dc)*.25;
    uv.x -= dc * .375 + uv.y * 0.07;
    
    digitCount = floor(digitCount);
	if (uv.x>-5.25 && uv.x<0.0 && abs(uv.y)<0.75)
	{
        float digit = floor(-uv.x / .75);
		nr /= pow(10.,digit);
        nr = mod(nr,10.0);
        if (neg && digit==digitCount)
            nr = -2.;
        else
		    if (floor(nr)<=0. && zeroTrim && digit>=digitCount && digit!=0.0)
			    nr = -1.0;
		seg = sevenSegmentFloat(uv+vec2( 0.375 + digit*.75,0.0),nr,digit);
    }
	return seg;
}

vec3 getFrameColor(vec2 uv, float gt) {
    float nr = showNum(uv,gt*(10.-9.8*iMouse.x/iResolution.x),true);
    //float nr = showNum(uv,gt,true);
    
	vec3 clr = vec3(0.0);
    clr.g = 0.8-0.8*smoothstep(lineWidth*.5,lineWidth*1.5, abs(nr-0.49)); // Yellow outline
    clr.r = 0.8-0.8*smoothstep(0.49,0.49+lineWidth, nr); // The numbers
    clr.b += 0.4-0.4*smoothstep(0.45,0.52,1.0-nr); // Background with shadow
    clr.rg += 0.25-0.25*pow(smoothstep(0.00,0.1, abs(nr-0.49)),0.25); // Yellow glow
    clr += 0.12-0.12*smoothstep(0.40,0.45, nr); // Stretchmarks
    return clamp(clr,0.0,1.0);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    lineWidth = 6.0/iResolution.x;
    vec2 uv = (fragCoord-0.5*iResolution.xy) / iResolution.y;
    
    //float gt = 200.+iMouse.x*0.1;//iTime;
    float gt = iTime;
    vec3 clr = vec3(0.0);
    
    for (float i = 0.0; i < 16.0; i += 1.0)
        clr += pow(getFrameColor(uv, gt+i/500.),vec3(2.))*(i+1.0);
    fragColor = vec4(pow(clr/136.,vec3(1.0/2.)),1.0);

/*    
    for (float i = 0.0; i < 16.0; i += 1.0)
        clr += getFrameColor(uv, gt+i/500.)*(i+1.0);
    fragColor = vec4(clr/136.,1.0);
*/    
    //fragColor = vec4(getFrameColor(uv, gt),1.0);
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
