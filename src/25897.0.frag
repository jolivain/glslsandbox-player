//From Mr 104
// Gtr
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

//-------------------------------------------------------------------------
// general utilities

float dtoa(float d, float amount)
{
    return clamp(1.0 / (clamp(d, 1.0/amount, 1.0)*amount), 0.,1.);
}

// returns 0.0 or 1.0
float extractBit(float fv, float bitIndex)
{
    fv = floor(fv / pow(2., bitIndex));// shift right bitIndex and remove unwanted bits to the right
    fv /= 2.;// shift one more to put our value into decimal portion
    fv = fract(fv);// our value is now isolated. fv is now exactly 0.0 or approx.0.5
    return sign(fv);
}

// not exactly perfectly perfect, but darn close
float pointRectDist(vec2 p, vec2 rectTL, vec2 rectBR)
{
  float dx = max(max(rectTL.x - p.x, 0.), p.x - rectBR.x);
  float dy = max(max(rectTL.y - p.y, 0.), p.y - rectBR.y);
  return max(dx, dy);
}


// warps (0,0)-(1,1) coords
vec2 tvWarp(vec2 uv) {
	uv = (uv - 0.5) * 2.0;// uv is now -1 to 1
	uv *= 1.1;
	uv.x *= 1.0 + pow((abs(uv.y) / 4.0), 2.5);
	uv.y *= 1.0 + pow((abs(uv.x) / 3.5), 2.5);
	uv = (uv / 2.0) + 0.5;// back to 0-1 coords
	uv = uv * 0.92 + 0.04;
	return uv;
}

vec2 getuv(vec2 fragCoord, vec2 newTL, vec2 newSize, out float distanceToVisibleArea, out float vignetteAmt)
{
    vec2 ret = vec2(fragCoord.x / resolution.x, (resolution.y - fragCoord.y) / resolution.y);// ret is now 0-1 in both dimensions
    
    // warp
    ret = tvWarp(ret / 2.) * 2.;// scale it by 2.
    distanceToVisibleArea = pointRectDist(ret, vec2(0.0), vec2(1.));

    // vignette
    vec2 vignetteCenter = vec2(0.5, 0.7);
	vignetteAmt = 1.0 - distance(ret, vignetteCenter);
    vignetteAmt = pow(vignetteAmt, 0.4);// strength
    
    ret *= newSize;// scale up to new dimensions
    float aspect = resolution.x / resolution.y;
    ret.x *= aspect;// orig aspect ratio
    float newWidth = newSize.x * aspect;
    return ret + vec2(newTL.x - (newWidth - newSize.x) / 2.0, newTL.y);
}



//-------------------------------------------------------------------------
// font drawing code ...

const int g_glyphCount = 38;
void getGlyphAtIndex(int gi, out vec4 scan0123, out vec4 scan4567)
{
    if(gi==0){scan0123=vec4(0x18,0x3C,0x66,0x7E);scan4567=vec4(0x66,0x66,0x66,0x00);return;}
    if(gi==1){scan0123=vec4(0x7C,0x66,0x66,0x7C);scan4567=vec4(0x66,0x66,0x7C,0x00);return;}
    if(gi==2){scan0123=vec4(0x3C,0x66,0x60,0x60);scan4567=vec4(0x60,0x66,0x3C,0x00);return;}
    if(gi==3){scan0123=vec4(0x78,0x6C,0x66,0x66);scan4567=vec4(0x66,0x6C,0x78,0x00);return;}
    if(gi==4){scan0123=vec4(0x7E,0x60,0x60,0x78);scan4567=vec4(0x60,0x60,0x7E,0x00);return;}
    if(gi==5){scan0123=vec4(0x7E,0x60,0x60,0x78);scan4567=vec4(0x60,0x60,0x60,0x00);return;}
    if(gi==6){scan0123=vec4(0x3C,0x66,0x60,0x6E);scan4567=vec4(0x66,0x66,0x3C,0x00);return;}
    if(gi==7){scan0123=vec4(0x66,0x66,0x66,0x7E);scan4567=vec4(0x66,0x66,0x66,0x00);return;}
    if(gi==8){scan0123=vec4(0x3C,0x18,0x18,0x18);scan4567=vec4(0x18,0x18,0x3C,0x00);return;}
    if(gi==9){scan0123=vec4(0x1E,0x0C,0x0C,0x0C);scan4567=vec4(0x0C,0x6C,0x38,0x00);return;}
    if(gi==10){scan0123=vec4(0x66,0x6C,0x78,0x70);scan4567=vec4(0x78,0x6C,0x66,0x00);return;}
    if(gi==11){scan0123=vec4(0x60,0x60,0x60,0x60);scan4567=vec4(0x60,0x60,0x7E,0x00);return;}
    if(gi==12){scan0123=vec4(0x63,0x77,0x7F,0x6B);scan4567=vec4(0x63,0x63,0x63,0x00);return;}
    if(gi==13){scan0123=vec4(0x66,0x76,0x7E,0x6E);scan4567=vec4(0x66,0x66,0x66,0x00);return;}
    if(gi==14){scan0123=vec4(0x3C,0x66,0x66,0x66);scan4567=vec4(0x66,0x66,0x3C,0x00);return;}
    if(gi==15){scan0123=vec4(0x7C,0x66,0x66,0x66);scan4567=vec4(0x7C,0x60,0x60,0x00);return;}
    if(gi==16){scan0123=vec4(0x3C,0x66,0x66,0x66);scan4567=vec4(0x66,0x3C,0x0E,0x00);return;}
    if(gi==17){scan0123=vec4(0x7C,0x66,0x66,0x7C);scan4567=vec4(0x78,0x6C,0x66,0x00);return;}
    if(gi==18){scan0123=vec4(0x3C,0x66,0x60,0x3C);scan4567=vec4(0x06,0x66,0x3C,0x00);return;}
    if(gi==19){scan0123=vec4(0x7E,0x18,0x18,0x18);scan4567=vec4(0x18,0x18,0x18,0x00);return;}
    if(gi==20){scan0123=vec4(0x66,0x66,0x66,0x66);scan4567=vec4(0x66,0x66,0x3C,0x00);return;}
    if(gi==21){scan0123=vec4(0x66,0x66,0x66,0x66);scan4567=vec4(0x66,0x3C,0x18,0x00);return;}
    if(gi==22){scan0123=vec4(0x63,0x63,0x63,0x6B);scan4567=vec4(0x7F,0x77,0x63,0x00);return;}
    if(gi==23){scan0123=vec4(0x66,0x66,0x3C,0x18);scan4567=vec4(0x3C,0x66,0x66,0x00);return;}
    if(gi==24){scan0123=vec4(0x66,0x66,0x66,0x3C);scan4567=vec4(0x18,0x18,0x18,0x00);return;}
    if(gi==25){scan0123=vec4(0x7E,0x06,0x0C,0x18);scan4567=vec4(0x30,0x60,0x7E,0x00);return;}
    if(gi==26){scan0123=vec4(0x3C,0x66,0x6E,0x76);scan4567=vec4(0x66,0x66,0x3C,0x00);return;}
    if(gi==27){scan0123=vec4(0x18,0x18,0x38,0x18);scan4567=vec4(0x18,0x18,0x7E,0x00);return;}
    if(gi==28){scan0123=vec4(0x3C,0x66,0x06,0x0C);scan4567=vec4(0x30,0x60,0x7E,0x00);return;}
    if(gi==29){scan0123=vec4(0x3C,0x66,0x06,0x1C);scan4567=vec4(0x06,0x66,0x3C,0x00);return;}
    if(gi==30){scan0123=vec4(0x06,0x0E,0x1E,0x66);scan4567=vec4(0x7F,0x06,0x06,0x00);return;}
    if(gi==31){scan0123=vec4(0x7E,0x60,0x7C,0x06);scan4567=vec4(0x06,0x66,0x3C,0x00);return;}
    if(gi==32){scan0123=vec4(0x3C,0x66,0x60,0x7C);scan4567=vec4(0x66,0x66,0x3C,0x00);return;}
    if(gi==33){scan0123=vec4(0x7E,0x66,0x0C,0x18);scan4567=vec4(0x18,0x18,0x18,0x00);return;}
    if(gi==34){scan0123=vec4(0x3C,0x66,0x66,0x3C);scan4567=vec4(0x66,0x66,0x3C,0x00);return;}
    if(gi==35){scan0123=vec4(0x3C,0x66,0x66,0x3E);scan4567=vec4(0x06,0x66,0x3C,0x00);return;}
    if(gi==36){scan0123=vec4(0x00,0x00,0x00,0x00);scan4567=vec4(0x00,0x18,0x18,0x00);return;}
    if(gi==37){scan0123=vec4(0x00,0x66,0x3C,0xFF);scan4567=vec4(0x3C,0x66,0x00,0x00);return;}    
    scan0123 = vec4(0.);scan4567 = vec4(0.);
}

// stringIndex lets you use the same pos for a string of chars, just incrementing stringIndex.
// this is pretty fast, but is binary. a prettier version might return a distance function but will suffer perf problems because of the complex geometry.
vec4 drawCharacter(vec4 inpColor, vec4 glyphColor, vec2 uv, vec2 pos, vec2 charSize, float stringIndex, int glyphIndex)
{
    vec2 element = floor(((uv - pos) / (charSize / 8.)));// convert uv to pixel indices
    element.x -= stringIndex * 8.0;
    element.x = floor(7.0 - element.x);// flip X. maybe my encoding method is wrong?
    // bounds check; most of the time uv will not land on the character so important to optimize this.
    if(element.y < 0. || element.y > 7.) return inpColor;
    if(element.x < 0. || element.x > 7.) return inpColor;

    vec4 scan0123;
    vec4 scan4567;
    getGlyphAtIndex(glyphIndex, scan0123, scan4567);
    
    int scanLineI = int(element.y);
    float scanLine;
    
    if(scanLineI == 0) scanLine = scan0123[0];
    else if(scanLineI == 1) scanLine = scan0123[1];
    else if(scanLineI == 2) scanLine = scan0123[2];
    else if(scanLineI == 3) scanLine = scan0123[3];
    else if(scanLineI == 4) scanLine = scan4567[0];
    else if(scanLineI == 5) scanLine = scan4567[1];
    else if(scanLineI == 6) scanLine = scan4567[2];
    else if(scanLineI == 7) scanLine = scan4567[3];

    float a = extractBit(scanLine, element.x);
    return vec4(mix(inpColor.rgb, glyphColor.rgb, a * glyphColor.a), inpColor.a);
}




//-------------------------------------------------------------------------
vec4 hardRect(vec4 inpColor, vec4 rectColor, vec2 uv, vec2 tl, vec2 br)
{
    if(uv.x < tl.x)
        return inpColor;
    if(uv.x > br.x)
        return inpColor;
    if(uv.y < tl.y)
        return inpColor;
    if(uv.y > br.y)
        return inpColor;
    return rectColor;
}


float nsin(float x)
{
    return (sin(x) + 1.0) / 2.;
}


void main()
{
    float distanceToVisibleArea;
    float vignetteAmt;
    vec2 uv = getuv(gl_FragCoord.xy, vec2(1.08,-0.1), vec2(2.6), distanceToVisibleArea, vignetteAmt);

    vec4 darkBlue = vec4(0.21,0.16,0.47,1.0);
    vec4 lightBlue = vec4(0.42,0.37,0.71,1.0);

    // main background
    gl_FragColor = darkBlue;
    
    // border
    vec2 charAreaTL = vec2(0.6, 0.3);
    if(uv.x < charAreaTL.x)
        gl_FragColor = lightBlue;
    if(uv.y < charAreaTL.y)
        gl_FragColor = lightBlue;

    // ready.
    vec4 charColor = lightBlue;
    vec2 charSize = vec2(0.2);
    charSize.x *= 0.936;// c64 aspect ratio
    vec2 stringPos = charAreaTL + vec2(0, 1.0 * charSize.y);// line 1
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 4., 37);// *
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 5., 37);// *
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 6., 37);// *
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 7., 37);// *

    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 9., 2);// C
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 10., 14);// O
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 11., 12);// M
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 12., 12);// M
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 13., 14);// O
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 14., 3);// D
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 15., 14);// O
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 16., 17);// R
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 17., 4);// E

    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 19., 32);// 6
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 20., 30);// 4
    
    stringPos = charAreaTL + vec2(0, 3.0 * charSize.y);// line 3
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 1., 32);// 6
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 2., 30);// 4
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 3., 10);// K
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 5., 17);// R
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 6., 0);// A
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 7., 12);// M

    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 9., 18);// S
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 10., 24);// Y
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 11., 18);// S
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 12., 19);// T
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 13., 4);// E
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 14., 12);// M
    
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 17., 29);// 3
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 18., 34);// 8
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 19., 35);// 9
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 20., 27);// 1
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 21., 27);// 1
    
    stringPos = charAreaTL + vec2(0, 5.0 * charSize.y);// line 5
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 0., 17);// R
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 1., 4);// E
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 2., 0);// A
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 3., 3);// D
    gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 4., 24);// Y
	gl_FragColor = drawCharacter(gl_FragColor, charColor, uv, stringPos, charSize, 5., 36);// .
    
    if(mod(time, 1.) < 0.5)
    {
        vec2 tl = vec2(stringPos.x, stringPos.y + charSize.y);
        gl_FragColor = hardRect(gl_FragColor, charColor, uv, tl, tl + charSize);
    }

    
	// black out warped area
	gl_FragColor = vec4(mix(vec3(0.), gl_FragColor.rgb, dtoa(distanceToVisibleArea, 200.)), 1.0);
		
	gl_FragColor.rgb *= vignetteAmt;

	//Draws the horizontal scan lines across the screen
	float scanLineFX = nsin(uv.y * 500.);
    scanLineFX = clamp(pow(scanLineFX, 4.0), 0.3, 1.0);
	gl_FragColor.rgb *= 1.0 + scanLineFX;
    gl_FragColor.rgb = clamp(gl_FragColor.rgb, 0.0, 1.0);

    //gl_FragColor = gridOverlay(gl_FragColor, uv);
}
