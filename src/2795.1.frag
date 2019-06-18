#ifdef GL_ES
precision mediump float;
#endif
 
// R Tape loading error, 0:1
 
// @P_Malin

//#define LOADING_LOOP

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
 
vec2 kResolution = vec2(256.0, 192.0);
 
// Border phases

const float kPhaseBlank = 0.0;
const float kPhaseSilent = 1.0;
const float kPhaseHeader = 2.0;
const float kPhaseData = 3.0;
const float kPhaseRunning = 4.0;
 
// Loading phases

const vec3 vTimeSilent1  = vec3(1.0,	5.0,                       kPhaseSilent);
const vec3 vTimeHeader1  = vec3(2.0,  vTimeSilent1.y + 2.0,      kPhaseHeader);
const vec3 vTimeData1    = vec3(3.0,  vTimeHeader1.y + 0.125,    kPhaseData);
 
const vec3 vTimeBlank2   = vec3(4.0,  vTimeData1.y + 1.0,        kPhaseBlank);
const vec3 vTimeSilent2  = vec3(5.0,  vTimeBlank2.y + 2.0,       kPhaseSilent);
const vec3 vTimeHeader2  = vec3(6.0,  vTimeSilent2.y + 2.0,      kPhaseHeader);
const vec3 vTimeData2    = vec3(7.0,  vTimeHeader2.y + 1.0,      kPhaseData);
 
const vec3 vTimeSilent3  = vec3(8.0,  vTimeData2.y + 2.0,        kPhaseSilent);
const vec3 vTimeHeader3  = vec3(9.0,  vTimeSilent3.y + 2.0,      kPhaseHeader);
const vec3 vTimeData3    = vec3(10.0, vTimeHeader3.y + 0.125,    kPhaseData);
 
const vec3 vTimeSilent4  = vec3(11.0, vTimeData3.y + 2.0,        kPhaseSilent);
const vec3 vTimeHeader4  = vec3(12.0, vTimeSilent4.y + 2.0,      kPhaseHeader);
const vec3 vTimeData4    = vec3(13.0, vTimeHeader4.y + 38.0,     kPhaseData);
 
const vec3 vTimeRunning  = vec3(14.0, vTimeData4.y + 10.0,       kPhaseRunning);
 
const vec3 vTimeTotal    = vec3(15.0, vTimeRunning.y,            kPhaseBlank);
       
vec4 GetPhase(float fTime)
{             
        vec3 vResult = vTimeRunning;
                
        vResult = mix( vResult, vTimeData4, step(fTime, vTimeData4.y ) );
        vResult = mix( vResult, vTimeHeader4, step(fTime, vTimeHeader4.y ) );
        vResult = mix( vResult, vTimeSilent4, step(fTime, vTimeSilent4.y ) );
 
        vResult = mix( vResult, vTimeData3, step(fTime, vTimeData3.y ) );
        vResult = mix( vResult, vTimeHeader3, step(fTime, vTimeHeader3.y ) );
        vResult = mix( vResult, vTimeSilent3, step(fTime, vTimeSilent3.y ) );
               
        vResult = mix( vResult, vTimeData2, step(fTime, vTimeData2.y ) );
        vResult = mix( vResult, vTimeHeader2, step(fTime, vTimeHeader2.y ) );
        vResult = mix( vResult, vTimeSilent2, step(fTime, vTimeSilent2.y ) );
        vResult = mix( vResult, vTimeBlank2, step(fTime, vTimeBlank2.y ) );
 
        vResult = mix( vResult, vTimeData1, step(fTime, vTimeData1.y ) );
        vResult = mix( vResult, vTimeHeader1, step(fTime, vTimeHeader1.y ) );
        vResult = mix( vResult, vTimeSilent1, step(fTime, vTimeSilent1.y ) );
               
        return vec4(vResult.z, vResult.x, fTime - vResult.y, vResult.y);
}
 
float GetRasterPosition()
{
        return (gl_FragCoord.x + gl_FragCoord.y * resolution.x) / (resolution.x * resolution.y);
}
 
float IsBorder(vec2 vScreenUV)
{
        if(vScreenUV.x < 0.0)
                        return 1.0;
        if(vScreenUV.x >= 1.0)
                        return 1.0;
        if(vScreenUV.y < 0.0)
                        return 1.0;
        if(vScreenUV.y >= 1.0)
                        return 1.0;
       
        return 0.0;
}
 
 
vec3 GetBorderColour(float fPhase)
{
	float raster = GetRasterPosition();
	
	vec3 vCol = vec3(0.0);
	
	if(fPhase == kPhaseBlank)
	{                       
		vCol = vec3(1.0);           
	}
	else  
	if(fPhase == kPhaseSilent)
	{
		float fBlend = step(fract(time * 0.5), 0.5);
		vCol = mix( vec3(0.0, 1.0, 1.0), vec3(1.0, 0.0, 0.0), fBlend);           
	}
	else
	if(fPhase == kPhaseHeader)
	{
		float fBarSize = 12.0;
		float fScrollSpeed = 10.0;
		float fBlend = step(fract(raster * fBarSize + time * fScrollSpeed), 0.5);
		vCol = mix( vec3(0.0, 1.0, 1.0), vec3(1.0, 0.0, 0.0), fBlend);           
	}
	else
	if(fPhase == kPhaseData)
	{
		float fBarSize = 25.0;
		float fScrollSpeed = 1.0;
		float fBlend = step(fract(raster * fBarSize + time * fScrollSpeed + sin(time * 20.0 + raster * 16.0)), 0.5);
		vCol = mix(vec3(1.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0), fBlend);                     
	}
	
	return vCol;
}
 
 
float GetLoadingScreenIntensity( vec2 vPos )
{
	vec2 vUV = vPos / kResolution;
	float r = 0.25;
	vec2 vDist = (vUV - 0.5) / r;
	float len = length(vDist);
	vec3 vNormal = vec3(vDist.x, sqrt(1.0 - len * len), vDist.y);
	vec3 vLight = normalize( vec3(1.0, 1.0, -1.0) );
	if(len < 1.0)
	{
		return max(0.0, dot(vNormal, vLight));
	}
	
	return 0.7 - vUV.y * 0.6;
}
 
float CrossHatch(float fIntensity, vec2 vPos)
{
	vec2 vGridPos = mod(vPos, 4.0);
	
	float fThreshold = fract(vGridPos.x * 0.25 + vGridPos.y * 0.5) * 0.75 + fract(vGridPos.y * 0.25 + vGridPos.x * 0.5) * 0.25;
	
	return step(fIntensity, fThreshold);
}
 
float GetLoadingScreenPixel( vec2 vPos )
{
        return CrossHatch(GetLoadingScreenIntensity(vPos), vPos);
}
 
vec2 GetScreenPixelCoord( vec2 vScreenUV )
{
        vec2 vPixelPos = floor(vScreenUV * kResolution);
        vPixelPos.y = 192.0 - vPixelPos.y;
       
        return vPixelPos;
}
 
float PixelAddress( vec2 vPixelPos )
{               
        float fBand = floor(vPixelPos.y / 64.0);
       
        float fBandPos = mod(vPixelPos.y, 64.0);
 
        float fCharRow = mod(fBandPos, 8.0);
        float fCharPos = floor(fBandPos / 8.0);
 
        float fBytePos = floor(vPixelPos.x / 8.0);
 
        float fLineTime = fBand * 64.0 + fCharRow * 8.0 + fCharPos;
        return (fBytePos + fLineTime * (256.0 / 8.0));
}
 
float AttributeAddress(vec2 vCharPos)
{             
	float kAttributeStart = 256.0 * 192.0 / 8.0;
	return kAttributeStart + vCharPos.x + vCharPos.y * 32.0;
}
 
float GetCharByte(const in float value)
{
        float result = 0.0;
        result = mix(result, 0.0, step(value, 919.0) );
        result = mix(result, 32.0, step(value, 918.5) );
        result = mix(result, 28.0, step(value, 914.5) );
        result = mix(result, 0.0, step(value, 913.5) );
        result = mix(result, 56.0, step(value, 894.5) );
        result = mix(result, 68.0, step(value, 893.5) );
        result = mix(result, 56.0, step(value, 890.5) );
        result = mix(result, 0.0, step(value, 889.5) );
        result = mix(result, 84.0, step(value, 878.5) );
        result = mix(result, 104.0, step(value, 874.5) );
        result = mix(result, 0.0, step(value, 873.5) );
        result = mix(result, 56.0, step(value, 851.5) );
        result = mix(result, 4.0, step(value, 830.5) );
        result = mix(result, 60.0, step(value, 829.5) );
        result = mix(result, 68.0, step(value, 828.5) );
        result = mix(result, 60.0, step(value, 826.5) );
        result = mix(result, 0.0, step(value, 825.5) );
        result = mix(result, 60.0, step(value, 782.5) );
        result = mix(result, 68.0, step(value, 781.5) );
        result = mix(result, 60.0, step(value, 780.5) );
        result = mix(result, 4.0, step(value, 779.5) );
        result = mix(result, 56.0, step(value, 778.5) );
        result = mix(result, 0.0, step(value, 777.5) );
        result = mix(result, 60.0, step(value, 670.5) );
        result = mix(result, 66.0, step(value, 669.5) );
        result = mix(result, 2.0, step(value, 668.5) );
        result = mix(result, 60.0, step(value, 667.5) );
        result = mix(result, 64.0, step(value, 666.5) );
        result = mix(result, 60.0, step(value, 665.5) );
        result = mix(result, 0.0, step(value, 664.5) );
        result = mix(result, 64.0, step(value, 646.5) );
        result = mix(result, 124.0, step(value, 644.5) );
        result = mix(result, 66.0, step(value, 643.5) );
        result = mix(result, 124.0, step(value, 641.5) );
        result = mix(result, 0.0, step(value, 640.5) );
        result = mix(result, 60.0, step(value, 638.5) );
        result = mix(result, 66.0, step(value, 637.5) );
        result = mix(result, 60.0, step(value, 633.5) );
        result = mix(result, 0.0, step(value, 632.5) );
        result = mix(result, 66.0, step(value, 630.5) );
        result = mix(result, 70.0, step(value, 629.5) );
        result = mix(result, 74.0, step(value, 628.5) );
        result = mix(result, 82.0, step(value, 627.5) );
        result = mix(result, 98.0, step(value, 626.5) );
        result = mix(result, 66.0, step(value, 625.5) );
        result = mix(result, 0.0, step(value, 624.5) );
        result = mix(result, 126.0, step(value, 614.5) );
        result = mix(result, 64.0, step(value, 613.5) );
        result = mix(result, 0.0, step(value, 608.5) );
        result = mix(result, 62.0, step(value, 590.5) );
        result = mix(result, 8.0, step(value, 589.5) );
        result = mix(result, 62.0, step(value, 585.5) );
        result = mix(result, 0.0, step(value, 584.5) );
        result = mix(result, 60.0, step(value, 574.5) );
        result = mix(result, 66.0, step(value, 573.5) );
        result = mix(result, 78.0, step(value, 572.5) );
        result = mix(result, 64.0, step(value, 571.5) );
        result = mix(result, 66.0, step(value, 570.5) );
        result = mix(result, 60.0, step(value, 569.5) );
        result = mix(result, 0.0, step(value, 568.5) );
        result = mix(result, 120.0, step(value, 550.5) );
        result = mix(result, 68.0, step(value, 549.5) );
        result = mix(result, 66.0, step(value, 548.5) );
        result = mix(result, 68.0, step(value, 546.5) );
        result = mix(result, 120.0, step(value, 545.5) );
        result = mix(result, 0.0, step(value, 544.5) );
        result = mix(result, 66.0, step(value, 526.5) );
        result = mix(result, 126.0, step(value, 524.5) );
        result = mix(result, 66.0, step(value, 523.5) );
        result = mix(result, 60.0, step(value, 521.5) );
        result = mix(result, 0.0, step(value, 520.5) );
        result = mix(result, 16.0, step(value, 470.5) );
        result = mix(result, 0.0, step(value, 469.5) );
        result = mix(result, 16.0, step(value, 467.5) );
        result = mix(result, 0.0, step(value, 466.5) );
        return result;   
}
 
float GetBit( float fByte, float fBit )
{
        return mod(floor(fByte / pow(2.0, 7.0-fBit)), 2.0) ;
}
 
float GetCharPixel( float fChar, vec2 vPos )
{
        float fCharAddress = fChar * 8.0 + vPos.y;
       
        float fCharBin = GetCharByte(fCharAddress);
       
        return GetBit(fCharBin, vPos.x);
}
 
float GetProgramStringChar(float fPos)
{
        float fChar = 32.0;    
        fChar = mix(fChar, 76.0, step(fPos, 12.5) );
        fChar = mix(fChar, 83.0, step(fPos, 11.5) );
        fChar = mix(fChar, 76.0, step(fPos, 10.5) );
        fChar = mix(fChar, 71.0, step(fPos, 9.5) );
        fChar = mix(fChar, 32.0, step(fPos, 8.5) );
        fChar = mix(fChar, 58.0, step(fPos, 7.5) );
        fChar = mix(fChar, 109.0, step(fPos, 6.5) );
        fChar = mix(fChar, 97.0, step(fPos, 5.5) );
        fChar = mix(fChar, 114.0, step(fPos, 4.5) );
        fChar = mix(fChar, 103.0, step(fPos, 3.5) );
        fChar = mix(fChar, 111.0, step(fPos, 2.5) );
        fChar = mix(fChar, 114.0, step(fPos, 1.5) );
        fChar = mix(fChar, 80.0, step(fPos, 0.5) );
        return fChar;
}
 
float GetLoadingStringChar(float fPos)
{
        float fChar = 32.0;    
        fChar = mix(fChar, 76.0, step(fPos, 11.0) );
        fChar = mix(fChar, 83.0, step(fPos, 10.5) );
        fChar = mix(fChar, 76.0, step(fPos, 9.5) );
        fChar = mix(fChar, 71.0, step(fPos, 8.5) );
        fChar = mix(fChar, 32.0, step(fPos, 7.5) );
        fChar = mix(fChar, 71.0, step(fPos, 6.5) );
        fChar = mix(fChar, 78.0, step(fPos, 5.5) );
        fChar = mix(fChar, 73.0, step(fPos, 4.5) );
        fChar = mix(fChar, 68.0, step(fPos, 3.5) );
        fChar = mix(fChar, 65.0, step(fPos, 2.5) );
        fChar = mix(fChar, 79.0, step(fPos, 1.5) );
        fChar = mix(fChar, 76.0, step(fPos, 0.5) );
        return fChar;
}
 
float GetProgramText(vec2 vPixelPos)
{     
        vec2 vCharCoord = floor(vPixelPos / 8.0);
       
        float fChar = GetProgramStringChar(vCharCoord.x);
       
        if(vCharCoord.y != 0.0)
                fChar = 32.0;
       
        return GetCharPixel(fChar, mod(vPixelPos, 8.0));
}
 
float GetLoadingText(vec2 vPixelPos)
{     
        vec2 vCharCoord = floor(vPixelPos / 8.0);
       
        float fChar = GetLoadingStringChar(vCharCoord.x);
       
        float inString = 1.0;
        if(vCharCoord.x < 0.0)
                fChar = 32.0;
       
        if(vCharCoord.y != 0.0)
                fChar = 32.0;
       
        return GetCharPixel(fChar, mod(vPixelPos, 8.0));
}
 
float GetScreenPixel(vec2 vScreenPixel)
{
	// plasma thing
	float f = sin(vScreenPixel.x *0.0432 + sin(vScreenPixel.y * 0.0423)+ time * 3.0);
	f = f + sin(vScreenPixel.y * 0.0454513 + sin(vScreenPixel.x * 0.07213) + time * 5.0);
	f = f + sin(vScreenPixel.x * 0.043353 + sin(vScreenPixel.y * 0.043413) + time * 8.0);
	f = f + sin(vScreenPixel.y * 0.0443513 + sin(vScreenPixel.x * 0.036313) + time * 10.0);
	f = f * 0.125 + 0.5;
	
	return CrossHatch(f, vScreenPixel);
}

void main( void )
{           
	float fSequenceTime = time;
	
	#ifdef LOADING_LOOP
	fSequenceTime = mod(fSequenceTime, vTimeTotal.y);
	#endif
	
	vec3 col = vec3(1.0);
	
	vec4 vPhase = GetPhase(fSequenceTime);
	
	vec2 vUV = ( gl_FragCoord.xy / resolution.xy );
	vec2 vScreenUV = (vUV - 0.1) / 0.8;
	if(IsBorder(vScreenUV) > 0.0)
	{
		col = GetBorderColour(vPhase.x);
	}
	else
	{
		vec2 vScreenCoord = GetScreenPixelCoord(vScreenUV);
		vec2 vAttribCoord = floor(vScreenCoord / 8.0);

		float fPixelValue = 0.0;
		vec3 vInk = vec3(0.0);
		vec3 vPaper = vec3(1.0);
		
		if(vPhase.x != kPhaseRunning)
		{
			// loading
			float fLoadScreenTime = fSequenceTime - vTimeHeader4.y;
										       
			float fAddressLoaded = fLoadScreenTime * 192.0;
			if(PixelAddress(vScreenCoord) > fAddressLoaded)
			{
				if(vPhase.y < 4.0)
				{
					col = vec3(1.0);
				}
				else
				if(vPhase.y < 8.0)
				{
					vec2 vTextPos = vec2(0.0, 8.0);
					fPixelValue = GetProgramText(vScreenCoord - vTextPos);
				}
				else
				{
					vec2 vTextPos = vec2(10.0 * 8.0, 19.0 * 8.0);
					fPixelValue = GetLoadingText(vScreenCoord - vTextPos);
				}				
			}
			else
			{
				// loading screen
				fPixelValue = GetLoadingScreenPixel(vScreenCoord);
														
			}
		
			if(AttributeAddress(vAttribCoord) < fAddressLoaded)
			{
				vInk = vec3(0.0, 0.0, 1.0);
				vPaper = vec3(1.0, 1.0, 0.0);
			}		
		}
		else
		{
			// running
			fPixelValue = GetScreenPixel(vScreenCoord);
			
			vec2 vTextPos = vec2(-8.0 * 8.0, 8.0);
			float fAttribValue = GetLoadingText(vAttribCoord - vTextPos );
			vPaper = mix(vec3(0.0, 1.0, 1.0), vec3(1.0, 0.0, 0.0), fAttribValue);
			vInk = vec3(0.0, 0.0, 1.0);
		}     
	
		//fPixelValue = GetScreenPixel(vScreenCoord); // force final effect			
		//fPixelValue = GetLoadingScreenPixel( vScreenCoord); // force loading screen
	
		col = mix(vPaper, vInk, fPixelValue);
		
	}

	float kBrightness = 0.8;
	gl_FragColor = vec4( col * kBrightness, 1.0 );  
}
