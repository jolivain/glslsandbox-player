#ifdef GL_ES
precision mediump float;
#endif

// I'm sorry.

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

vec3 skinColor1 = vec3(0.996,0.921,0.862);
vec3 skinColor2 = vec3(0.960,0.843,0.749);
vec3 hairColor  = vec3(0.176,0.180,0.196);
vec3 hairColor2 = vec3(0.100,0.100,0.100);
vec3 mayuColor  = vec3(0.160,0.078,0.058);
vec3 mayuColor2 = vec3(0.219,0.121,0.098);
vec3 eyeColorB  = vec3(0.317,0.184,0.149);
vec3 eyeColorH  = vec3(0.807,0.607,0.501);
vec3 eyeColorS  = vec3(0.756,0.717,0.709);
vec3 ripColor   = vec3(0.925,0.737,0.650);
vec3 fukuColor  = vec3(0.968,0.701,0.415);
vec3 blackColor = vec3(0,0,0);
vec3 whiteColor = vec3(1,1,1);
vec3 whiteColor2= vec3(0.9,0.9,0.9);
vec3 RedColor   = vec3(0.9,0.2,0.2);
vec3 OrangeColor= vec3(0.901,0.568,0.215);

void Face(inout vec2 p, inout vec3 col)
{
	
	//back hair
	if ((length(vec2(1,0.4)*(p-vec2(-0.45,0.06))) < 0.4)
	    &&(abs(p.x+0.7) < 0.2 && abs(p.y+0.3) < 0.5)
	   ) col = blackColor; // hairBack1
	if ((length(vec2(1,0.5)*(p-vec2(-0.6,0.15))) < 0.5)
	    &&(length(vec2(1,0.5)*(p-vec2(-0.3,-0.2))) > 0.5)
	    &&(abs(p.x+0.9) < 0.2 && abs(p.y+0.3) < 0.5)
	   ) col = blackColor; // hairBack2

	if ((length(vec2(0.7,1)*(p-vec2(0.05,-1.2))) < 0.404)) col = eyeColorB; // kubi
	if ((length(vec2(0.7,1)*(p-vec2(0.05,-1.2))) < 0.4)) col = OrangeColor; // kubi

	if ((length(vec2(1,0.71)*(p-vec2(0.04,-1.1))) < 0.3)) col = eyeColorB; // kubi
	if ((length(vec2(1,0.71)*(p-vec2(0.03,-1.1))) < 0.3)) col = skinColor2; // kubi

	

	//base
	if ((length(vec2(0.73,1)*(p-vec2(-0.21,-0.21))) < 0.8)
	    &&(length(vec2(0.8,1)*(p-vec2(0.3,-0.29))) < 0.8)
	   ) col = eyeColorB; // face base
	if ((length(vec2(0.73,1)*(p-vec2(-0.21,-0.20))) < 0.8)
	    &&(length(vec2(0.8,1)*(p-vec2(0.3,-0.28))) < 0.8)
	   ) col = skinColor2; // face base
	
	if ((length(vec2(1,0.71)*(p-vec2(-0.01,0.26))) < 0.905)
	    &&(length(vec2(1,0.73)*(p-vec2(-0.15,0.22))) < 0.9)
	   ) col = eyeColorB; // face base
	if ((length(vec2(1,0.71)*(p-vec2(-0.01,0.26))) < 0.9)
	    &&(length(vec2(1,0.73)*(p-vec2(-0.15,0.22))) < 0.9)
	   ) col = skinColor1; // face base
	
	if (length(p-vec2(-0.2,-0.6)) < 0.1) col = mix(skinColor2, skinColor1, (length(p-vec2(-0.2,-0.6))*whiteColor) / 0.11);//nose
	
	//mouth
	if ((length(vec2(0.9,1)*(p-vec2(-0.16,-0.645))) < 0.17)
	    &&(length(vec2(0.5,1)*(p-vec2(-0.16,-0.62))) > 0.156)
	   ) col = mix(ripColor, skinColor1, (length(p-vec2(-0.16,-0.75))*whiteColor) / 0.17); //ripcolor1

	if ((length(vec2(0.5,1)*(p-vec2(-0.16,-0.922))) < 0.17)
	    &&(length(vec2(0.2,1)*(p-vec2(-0.16,-0.953))) > 0.18)
	   ) col = mix(ripColor, skinColor1, (length(p-vec2(-0.16,-0.85))*whiteColor) / 0.17); //ripcolor1
	
	if ((length(vec2(0.5,1)*(p-vec2(-0.16,-0.64))) < 0.14)
	    &&(length(vec2(0.5,1)*(p-vec2(-0.16,-0.62))) > 0.157)
	   ) col = mayuColor; //mouth
	
	if (length(p-vec2(-0.18,-0.795)) < 0.01) col = whiteColor; // hilight1
	if (length(p-vec2(-0.16,-0.795)) < 0.005) col = whiteColor; // hilight1
}

void RightEye(inout vec2 p, inout vec3 col)
{
	//bases
	if (length(vec2(1,0.6)*(p-vec2(-0.58,-0.12))) < 0.15) col = whiteColor; // base1-1
	if (length(vec2(1,0.59)*(p-vec2(-0.645,-0.079))) < 0.11)col = whiteColor; // base1-2
	if ((length(vec2(1,0.6)*(p-vec2(-0.603,-0.12))) < 0.159)
	    &&(length(vec2(1,0.9)*(p-vec2(-0.61,-0.18))) > 0.2)) col = eyeColorS; // eyeline kage

	
	if (length(vec2(1,0.55)*(p-vec2(-0.58,-0.115))) < 0.11) col = blackColor; // base2-1
	if (length(vec2(1,0.56)*(p-vec2(-0.59,-0.08))) < 0.115) col = blackColor; // base2-2
	if (length(vec2(1,0.55)*(p-vec2(-0.58,-0.115))) < 0.103) col = eyeColorB; // base3-1
	if (length(vec2(1,0.56)*(p-vec2(-0.59,-0.08))) < 0.103) col = eyeColorB; // base3-2

	if ((length(p-vec2(-0.62,0.0)) < 0.17)
	    &&(length(vec2(1,0.56)*(p-vec2(-0.59,-0.08))) < 0.103)
	   )col = (length(p-vec2(-0.62,0.0))*eyeColorB) / 0.17; //eye base shadow
	if ((length(p-vec2(-0.55,-0.28)) < 0.12)
	    &&(length(vec2(1,0.55)*(p-vec2(-0.58,-0.115))) < 0.103)
	   )col = mix(eyeColorH, eyeColorB, (length(p-vec2(-0.55,-0.28))*whiteColor) / 0.12); // eye base hilight
	
	
	//center	
	if (length(vec2(1,0.4)*(p-vec2(-0.59,-0.11))) < 0.042) col = mayuColor; //eye center1
	if (length(vec2(1,0.36)*(p-vec2(-0.59,-0.11))) < 0.036) col = (length(vec2(1,0.5)*(p-vec2(-0.59,-0.11)))*eyeColorB) / 0.05; // eye center2
	if (length(p-vec2(-0.59,-0.11)) < 0.017) col = blackColor; // eye center 3
	
	// hilight
	if (length(vec2(0.6,1)*(p-vec2(-0.53,0.01))) < 0.027) col = whiteColor; //hilight1
	if (length(p-vec2(-0.67,-0.22)) < 0.026) col = whiteColor; // hilight2
	if (length(p-vec2(-0.61,-0.16)) < 0.015) col = (0.002 / (length(p-vec2(-0.61,-0.16))*whiteColor)) + mayuColor; // hilight3

	// blow
	if ((length(vec2(1,0.6)*(p-vec2(-0.6,-0.15))) < 0.175)
	    &&(length(vec2(1,0.56)*(p-vec2(-0.63,-0.179))) > 0.16)
	    &&(length(vec2(1,0.59)*(p-vec2(-0.58,-0.2))) > 0.16)
	   ) col = mayuColor; //eyeblow1-1
	if ((length(vec2(1,0.55)*(p-vec2(-0.65,-0.05))) < 0.12)
	    &&(length(vec2(1,0.8)*(p-vec2(-0.615,-0.055))) > 0.13)
	    &&(length(vec2(1,0.56)*(p-vec2(-0.645,-0.09))) > 0.11)
	   ) col = mayuColor; //eyeblow1-2
	if ((length(vec2(1,0.8)*(p-vec2(-0.631,-0.045))) < 0.17)
		&& (length(vec2(0.8,1)*(p-vec2(-0.65,-0.07))) > 0.2)
	   ) col = mayuColor; //eyeblow1-2

	if ((length(vec2(1,0.97)*(p-vec2(-0.65,-0.0))) < 0.2)
	    &&(length(vec2(1,0.9)*(p-vec2(-0.65,-0.085))) > 0.25)) col = mayuColor; //mayu
}

void LeftEye(inout vec2 p, inout vec3 col)
{
	//      sizeraito x y          pos x y      size
	// bases
	if (length(vec2(1,0.9)*(p-vec2(0.36,-0.12))) < 0.25) col = whiteColor; // base
	if ((length(vec2(1,0.9)*(p-vec2(0.36,-0.12))) < 0.25)
	    &&(length(vec2(0.9,1)*(p-vec2(0.36,-0.2))) > 0.25)) col = eyeColorS; // eyeline kage
	
	if (length(vec2(1,0.75)*(p-vec2(0.358,-0.11))) < 0.17) col = blackColor;
	if (length(vec2(1,0.75)*(p-vec2(0.358,-0.11))) < 0.16) col = eyeColorB; //base 2
	if ((length(p-vec2(0.34,0.0)) < 0.17)
	    &&(length(vec2(1,0.75)*(p-vec2(0.358,-0.11))) < 0.16))col = (length(p-vec2(0.34,0.0))*eyeColorB) / 0.17; //eye base shadow
	if ((length(p-vec2(0.4,-0.28)) < 0.17)
	    &&(length(vec2(1,0.75)*(p-vec2(0.358,-0.11))) < 0.16))col = mix(eyeColorH, eyeColorB, (length(p-vec2(0.4,-0.28))*whiteColor) / 0.17); // eye base hilight
	
	// center
	if (length(vec2(1,0.60)*(p-vec2(0.358,-0.11))) < 0.07) col = mayuColor; //eye center1
	if (length(vec2(1,0.55)*(p-vec2(0.358,-0.11))) < 0.06) col = (length(p-vec2(0.358,-0.11))*eyeColorB) / 0.1; // eye center2
	if (length(p-vec2(0.358,-0.11)) < 0.025) col = blackColor; // eye center 3
	
	// hilight
	if (length(vec2(0.6,1)*(p-vec2(0.46,0.029))) < 0.035) col = whiteColor; //hilight1
	if (length(p-vec2(0.25,-0.27)) < 0.03) col = whiteColor; // hilight2
	if (length(p-vec2(0.325,-0.16)) < 0.025) col = (0.003 * (sin(time * 10.0) * 0.3 + sin(time * 21.0) * 0.15 + sin(time * 33.0) * 0.075  + 1.0) / (length(p-vec2(0.325,-0.16))*whiteColor)) + mayuColor; // hilight3

	// blow
	if ((length(vec2(1,0.9)*(p-vec2(0.37,-0.115))) < 0.265)
	    &&(length(vec2(1,0.9)*(p-vec2(0.36,-0.175))) > 0.255)) col = mayuColor; //eyeblow1
	if ((length(vec2(1,1.1)*(p-vec2(0.37,-0.1))) < 0.3)
	    &&(length(vec2(1,1.4)*(p-vec2(0.41,-0.15))) > 0.38)
	    &&(length(p-vec2(0.5,-0.1)) > 0.3)
	   ) col = mayuColor; //eyeblow2
	if ((length(vec2(1,1)*(p-vec2(0.87,0.08))) < 0.3)
	    &&(length(vec2(1,0.9)*(p-vec2(0.9,0.08))) > 0.3)
	    &&(length((p-vec2(0.83,0.2))) > 0.3)
	   ) col = mayuColor; //eyeblow3
	if ((length(vec2(1,0.9)*(p-vec2(0.37,-0.115))) < 0.245)
	    &&(length(vec2(1,0.9)*(p-vec2(0.36,-0.175))) > 0.27)) col = mayuColor2; //eyeblow4
	
	if ((length(vec2(0.97,1)*(p-vec2(0.38,-0.18))) < 0.4)
	    &&(length(vec2(0.9,1)*(p-vec2(0.38,-0.2))) > 0.4)) col = mayuColor; //mayu

	if ((length(vec2(1,0.5)*(p-vec2(-0.81,0.46))) < 0.2)) col = skinColor2; // hair kage
}

void Hair(inout vec2 p, inout vec3 col)
{
	if ((length(vec2(1,0.5)*(p-vec2(-0.23,0.4))) < 0.25)) col = skinColor2; // hair kage
	
	if ((length(p-vec2(-0.4,0.6)) < 0.7)&&(length(p-vec2(-1.3,0.61)) < 0.7))col = hairColor; // hair1
	if ((length(p-vec2(0.09,0.5)) < 0.7)&&(length(p-vec2(-0.72,0.42)) < 0.7))col = hairColor; // hair1
	if ((length(p-vec2(0.63,0.75)) < 0.7)&&(length(p-vec2(-0.05,0.6)) < 0.7))col = hairColor; // hair2
	if ((length(vec2(0.7,1)*(p-vec2(-0.4,0.9))) < 0.4)) col = hairColor; // hair

	if ((length(vec2(1,0.5)*(p-vec2(0.7,0.01))) < 0.5)
	    &&(length(vec2(1,0.5)*(p-vec2(0.55,-0.1))) > 0.5)
	    &&(abs(p.x-0.9) < 0.3 && abs(p.y+0.92) > 0.2)
	   ) col = blackColor; // hair

	
	if ((length(vec2(1,0.5)*(p-vec2(0.54,0.38))) < 0.26)
	    &&(length(vec2(1,0.5)*(p-vec2(0.35,0.0))) > 0.26)
	   ) col = hairColor; // hair

	if ((length(vec2(1,0.5)*(p-vec2(0.58,0.01))) < 0.5)
	    &&(length(vec2(1,0.5)*(p-vec2(0.3,-0.1))) > 0.5)
	   ) col = hairColor; // hair
	
	if ((length(vec2(1,0.5)*(p-vec2(0.95,0.04))) < 0.5)
	    &&(length(vec2(1,0.5)*(p-vec2(0.63,-0.15))) > 0.5)
	   ) col = hairColor; // hair

	
	if ((length(vec2(1,0.5)*(p-vec2(-0.615,0.25))) < 0.6)
	    &&(length(vec2(1,0.5)*(p-vec2(-0.43,0.15))) > 0.6)
	   ) col = blackColor; // hairkage
	if ((length(vec2(1,0.5)*(p-vec2(-0.6,0.25))) < 0.6)
	    &&(length(vec2(1,0.5)*(p-vec2(-0.43,0.15))) > 0.6)
	   ) col = hairColor; // hair


	if ((length(vec2(1,0.5)*(p-vec2(-0.87,0.38))) < 0.26)
	    &&(length(vec2(1,0.5)*(p-vec2(-0.66,0.2))) > 0.26)
	   ) col = blackColor; // hair

	if ((length(vec2(1,0.5)*(p-vec2(-0.865,0.4))) < 0.265)
	    &&(length(vec2(1,0.5)*(p-vec2(-0.66,0.2))) > 0.25)
	   ) col = hairColor; // hair

	
	// kamikage
	if ((length(vec2(1,0.5)*(p-vec2(-0.3,0.49))) < 0.3)
	    &&(length(vec2(1,0.5)*(p-vec2(-0.47,0.6))) > 0.41)
	   )col = hairColor2; // hairkage
	
	if ((length(vec2(1,0.65)*(p-vec2(-0.92,0.525))) < 0.3)
	    &&(length(vec2(1,0.65)*(p-vec2(-1.05,0.63))) > 0.41)
	   )col = hairColor2; // hairkage
	
	if ((length(vec2(1,0.65)*(p-vec2(0.32,0.525))) < 0.3)
	    &&(length(vec2(1,0.65)*(p-vec2(0.19,0.62))) > 0.41)
	   )col = hairColor2; // hairkage
	
	if ((length(vec2(1,0.5)*(p-vec2(0.58,0.01))) < 0.5)
	    &&(length(vec2(1,0.5)*(p-vec2(0.5,0.0))) > 0.5)
	   ) col = hairColor2; // hairkage

	if ((length(vec2(1,0.5)*(p-vec2(0.95,0.04))) < 0.5)
	    &&(length(vec2(1,0.5)*(p-vec2(0.85,-0.0))) > 0.5)
	   ) col = hairColor2; // hairkage
}

void Mona(inout vec2 p, inout vec3 col)
{
	if ((length(p-vec2(0.9,1.08)) < 0.88)&&(length(p-vec2(0.76,0.9)) < 0.75))col = whiteColor; // monanabase
	if ((length(p-vec2(0.9,1.08)) < 0.88)&&(length(p-vec2(1.1,1.2)) > 1.0))col = whiteColor2;

	if ((length(vec2(1,0.7)*(p-vec2(0.853,0.83))) < 0.083))col = RedColor;
	
	if ((length(p-vec2(-0.4,0.0)) < 1.0)
	  &&(length(p-vec2(-0.3,-0.2)) > 1.2)
	   )col = RedColor;
	
    	float s = sin(sin(-4.0) * 0.75);
    	vec2 q = p * mat2(0, -s, s, 0);	
	if(abs(p.x-0.5+q.x) < 0.03 && abs(p.y-0.81) < 0.17)col = blackColor;

    	s = sin(sin(-2.7) * 0.75);
    	q = p * mat2(0, -s, s, 0);	
	if(abs(p.x-1.05+q.x) < 0.03 && abs(p.y-0.84) < 0.2)col = blackColor;
	
    	s = sin(sin(1.0) * 0.75);
	float c = cos(sin(1.0 * 2.0));
    	q = p * mat2(c, -s, s, c);	
	if(abs(p.x-0.82+q.x) < 0.2 && abs(p.y-1.99 + q.y) < 0.05)col = blackColor;
	
    	s = sin(sin(-2.4) * 0.75);
    	q = p * mat2(0, -s, s, 0);	
	if(abs(p.x-1.67+q.x) < 0.03 && abs(p.y-1.02) < 0.1)col = blackColor;
}

vec3 snowflake(vec3 coords, vec2 pxPos) { 
	float focalPlane = 0.5 + 2.5 * 0.7; 
	float iris = 0.01;
	
	float pxDiam = abs(coords.z - focalPlane) * iris; 
	vec2 flakePos = vec2(coords.xy) / coords.z; 
	float flakeDiam = 0.003 / coords.z; 
	
	float dist = length(pxPos - flakePos); 
	float bri = (pxDiam + flakeDiam - dist) / (pxDiam * 2.0); 
	if (pxDiam > flakeDiam) { 
		bri /= (pxDiam / flakeDiam); 
	} 

	return vec3(0.7, 0.9, 1.0) * min(1.0, max(0.0, bri)); 
}


vec2 EffectBass(inout vec2 p, inout vec3 c, int i)
{
    	c.z = fract(sin(float(i) * 25.643) * 735.5373); 
    	c.z *= 0.2 + fract(sin(float(i) * 74.753) * 526.5463); 
    	c.z = 0.5 + (1.0 - c.z) * 2.4; 
    	float gSize = 0.5 / c.z; 
    	vec2 drift = vec2(0); 
    	drift.x = fract(sin(float(i) * 52.3464) * 353.43354) * 4.0; 
    	drift.x = drift.x + time * 0.06 + 4.0 * sin(time * 0.03 + c.z * 7.0); 
    	drift.y = fract(sin(float(i) * 63.2356) * 644.53463) * 4.0; 
    	drift.y = drift.y + time * -0.2; 
    	drift /= c.z; 
     
    	vec2 grid = vec2(mod((p.x+drift.x)/c.z, gSize), mod((p.y-drift.y)/c.z, gSize)); 
    	c.x = gSize*0.5; 
    	c.y = gSize*0.5;
	return grid;
}

void MonaCoinChang(vec2 p, inout vec3 col)
{	
	float s = sin(sin(0.25))*0.9;
   	float c = cos(sin(0.25))*0.9;
    	p = p * mat2(c, -s, s, c);
	p = vec2(p.x-0.1, p.y-0.05);
	
	Face(p, col);
	LeftEye(p, col);
	RightEye(p, col);
	Hair(p, col);
	Mona(p, col);	
}

vec3 filter_(vec3 color) {
  return color * 0.5 * (2.0 - gl_FragCoord.x / resolution.x + gl_FragCoord.y / resolution.y);
}

void main( void ) {
	vec2 p = (2.0 * gl_FragCoord.xy - resolution.xy) / min(resolution.x, resolution.y);

	vec3 col = vec3(0.75, 0.7, 0.7 ); 
		
	float zoom = fract(time * 0.3);
	vec2 offset = vec2(0.5, -0.2);
	float scale = 3.7;
	vec2 pan = offset * zoom;

	float fullA = 0.5;
	mat2 fullRot = mat2(cos(fullA), sin(fullA), -sin(fullA), cos(fullA));
	float a = -fullA * zoom;
	mat2 rot = mat2(cos(a), sin(a), -sin(a), cos(a));

	vec2 pos = (p - offset) * exp(-zoom * scale) * rot + offset;

	vec3 col1 = vec3(0.0);
	MonaCoinChang(pos, col1);

	vec3 col2 = vec3(0.0);
	MonaCoinChang((pos - offset) * exp(scale) * fullRot + offset, col2);
	col = mix(col1, col2, zoom);	

	gl_FragColor = vec4(filter_(col),  1.0); 
}
