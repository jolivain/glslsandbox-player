// ------------- Counter. (c) Fabrice NEYRET June 2013 -----------------------//
// adapted for glslsandbox by Gigatron
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;



#define STYLE 2     // 1/2
#define EFFECT 2    // 0/1/2
#define E (1./6.)   // segment thickness
#define DELAY 5.    // effect periodicity
#define RIGHT_HALF (gl_FragCoord.x > resolution.x * .0)
float rad = 6.;     // segment shape ratio

#define PI 3.1415927
 

// --- Displays digit b at pos with size=scale ------------------------------
//     return code =  1:pixel on , 0: pixel off , -1: pixel out of digit bbox
int aff(int b, inout vec2 pos)
{
	vec2 scale = vec2(.25*resolution.y,.375*resolution.y);
	vec2 uv = (gl_FragCoord.xy-pos)/scale;       // normalized coordinates in digit bbox
	pos.x -= 1.0*scale.x;                        // 1.2*scale.x
	if((abs(uv.x)<.5)&&(abs(uv.y)<.5))          // pixel is in bbox
	{
		const float dy = 2.*(1.-E);
		float ds = 1./sqrt(1.+dy*dy)*3./1.414/(1.-2.*E);
		vec2 st = ds*vec2(uv.x-dy*uv.y,-uv.x-dy*uv.y); // in diamond frame coords
		if((abs(st.x)>1.5)||(abs(st.y)>1.5)) return 0; // pixel is not in 3x3 diamond grid
		st += 1.5;
		int seg = int(st.x)+3*int(st.y);           // diamond cell number
		if ((seg==2)||(seg==6)) return 0;          // pixel is in a non-segment cells
		uv = 2.*(st-floor(st))-1.;                 // pixel in diamond cell coords
		float t=PI/4.; 
#if EFFECT>0
		float dt = DELAY*floor(time/DELAY); // effect every DELAY seconds
  #if EFFECT==1                       // rotation effect
		if (time-dt<PI/2.) {
			t=4.*(time-dt); 
			t = PI/4.+.5*(t-sin(t));
		}
  #elif EFFECT==2                     // zoom effect
		if (time-dt<PI) {
			float tt = 2.*(time-dt); 
			tt = sin(tt)*(1.-cos(tt))/1.3; // -1..1
			rad /= 1.-.9*tt;
		}		
  #endif
#endif
		float C = cos(t), S=sin(t);
		uv = vec2(C*uv.x-S*uv.y,S*uv.x+C*uv.y); // pixel in screen-parallel cell coords
	    bool c;                                 // true if pixel is in a set segment of digit b.
#if 1
		if     (b==0) c = (seg!=4);             // is pix in a segment of digit b ?
		else if(b==1) c = (seg==1)||(seg==5);
		else if(b==2) c = (seg!=3)&&(seg!=5);
		else if(b==3) c = (seg!=3)&&(seg!=7);
		else if(b==4) c = (seg!=0)&&(seg!=7)&&(seg!=8);
		else if(b==5) c = (seg!=1)&&(seg!=7);
		else if(b==6) c = (seg!=1);
		else if(b==7) c = (seg==0)||(seg==1)||(seg==5);
		else if(b==8) c =   true;
		else if(b==9) c = (seg!=7);
#else
		c = (seg==b);                        // drawn cell b
#endif
	    // return 1 if pixel should be drawn.
#if STYLE==1
	    if (c)	if (length(uv)<1.) return 1; // pixel in positive shape for segment on
		else    if (length(uv)>.9) return 1; // pixel in positive shape for segment off			
#elif STYLE==2
		if (4*(seg/4)==seg) uv.y *=rad;       // segment = vertical or horizontal ellips
		else                uv.x *=rad;
	    if (c)	if (length(uv)<1.3) return 1; // pixel in a set segment	shape
#endif
        return 0; // pixel is in digit bbox but out of a set segment
	}
	return -1;    // pixel is out of digit bbox
}

void main()
{
	 
    int c;
	vec2 pos   = vec2(.95*resolution.x, .50*resolution.y);// x=0.85 , y=0.50 
	int t = int(9999999.+time*1000.);   // decompose 1000*timer in digits 
	for (int i=0; i<9; i++) {             // i=Num Digit
		int n = t-10*(t/10); t=t/10; // n = digit from right to left
		c = aff(n, pos);             // 1 if pixel is in the digit bbox AND in a set segment 
		if (c>=0) break;             // the digit under pixel as been found
	}
	
	vec2 uv = gl_FragCoord.xy / resolution.xy;
	float background = uv.y;
	float pix_s = .022;
	vec2 pix = mod( uv, pix_s );
	if( RIGHT_HALF )
	uv -= pix;
	pix -= pix_s * .5;
	uv = uv * .5 + .5;
	if (c>0) 
		gl_FragColor = vec4(0.5+0.5*sin(time),uv,1.0);     // draw set pixels
	//else if (c==0)
	//	fragColor = vec4(0.*uv,0.5-0.5*sin(iGlobalTime),1.0);  // draw digit background
	//else
	//gl_FragColor = vec4(uv,0.5-0.5*sin(time),1.0);     // draw background
	
	gl_FragColor = vec4(smoothstep(2.,-4.,background) );
	if( RIGHT_HALF ) gl_FragColor *= smoothstep( pix_s*float(c), 0.,length(pix) ); // OK !
	if (c>0) 
	gl_FragColor += vec4(0.*uv,0.5-0.9*sin(time),1.0);
}
