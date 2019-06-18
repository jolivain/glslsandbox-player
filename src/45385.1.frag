/*
 * Original shader from: https://www.shadertoy.com/view/XllGDj
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
// "Tetrominos" by Kali

//#define retro
//#define scroll
#define speed 2.
#define acceleration .017
#define halfPI 1.57079632679


mat2 rot2D(float a) {return mat2(cos(a),sin(a),-sin(a),cos(a));}

// -------------------------------------------------------------------------------------
// Returns the shape and heightmap of the blocks
// The blocks are made of one, two or three combined rectangles
// The distance function gives the hmap for the borders.
vec3 blockhmap(vec2 p, vec4 pos, vec4 c, float type, float rot) {
	p=(p-pos.xy)*rot2D(rot*halfPI)+pos.xy; // apply rotation
	vec4 rpos=vec4(p,p)-pos;  // relative coordinates
	float b=0.;
	vec2 d1 = abs(rpos.xy-c.xy) - abs(c.xy);
	float h1=max(0.0,-min(max(d1.x,d1.y),0.0)); // hmap of rectangle1
	float i1=1.-sign(length(max(vec2(0.),d1+.05))); // inside shape of rectangle1
	float s1=1.-sign(length(max(vec2(0.),d1+.01))); // shape of rectangle1
	vec2 d2 = abs(rpos.zw-c.zw) - abs(c.zw);
	float h2=max(0.0,-min(max(d2.x,d2.y),0.0)); // hmap of rectangle2
	float i2=1.-sign(length(max(vec2(0.),d2+.05))); // inside shape of rectangle2
	float s2=1.-sign(length(max(vec2(0.),d2+.01))); // shape of rectangle2
	float cent=1.;
	if (type>1.5) { // we need another rectangle for the "Z" shaped pieces
		float yy=type>2.5?0.:.2;
		vec2 d3=abs(rpos.xy-vec2(.3,yy))-vec2(.1,.2);	
		float h3=max(0.0,-min(max(d3.x,d3.y),0.0)); // hmap of rectangle3
		float i3=1.-sign(length(max(vec2(0.),d3+.05))); // inside shape of rectangle3
		float s3=1.-sign(length(max(vec2(0.),d3+.01))); // shape of rectangle3
		h1=max(h1,h3); i1=max(i1,i3); s1=max(s1,s3); // combine rectangle3 with rectangle1
	}
	// for the square, we need to apply the hole
	rpos-=.2; // move to the center of square
	if (type>.5 && type<1.5 && max(abs(rpos.x),abs(rpos.y))<.07) { //if we are inside the hole
		cent=-1.; // inverse the hmap
		if (max(abs(rpos.x),abs(rpos.y))<.03) s1=s2=0.; //flat black square hole
	}
	//return heightmap, inside shape, mask shape
	return vec3(max(h1,h2)/.1*cent,max(i1,i2)-max(0.,-cent),max(s1,s2));
}

// -------------------------------------------------------------------------------------
//the block shading function, it actually compute normals and applies lighting to the borders!
vec3 draw(vec2 p, vec4 pos, vec4 c, vec3 color, float type, float rot) {
	vec2 d=vec2(.0,.0001); 
	vec3 pi=blockhmap(p+d.yx,pos,c,type,rot); // save one of the calls used to calc normal
												// for using it later
	vec3 n=normalize(cross( //get normal
	  vec3(d.y,0.,pi-blockhmap(p-d.yx,pos,c,type,rot).x),
	  vec3(0.,d.y,blockhmap(p+d.xy,pos,c,type,rot).x-blockhmap(p-d.xy,pos,c,type,rot).x)));

	//lighting
	float l=max(0.,dot(n,normalize(vec3(0.5,1.,0.))))*1.6; 
	l+=max(0.,dot(n,normalize(vec3(-1.,-0.5,0.))))*.4;
	vec3 bisel=l*pi.z*(1.-pi.y)*color; //the borders minus the center part of the shape

	//returns the center shape flat shaded, and the borders with lighting and desaturated
	return color*pi.y+mix(vec3(length(bisel)),bisel,.65)*1.5; 
}

// -------------------------------------------------------------------------------------
// block design 
vec3 block(vec2 p, vec2 pos, float wich, float rot) {
	vec4 pp=vec4(0.); vec4 c=vec4(0.); float type=1.; vec3 color=vec3(0.);

	// pp.xy: position of rectangle1 - pp.wz: position of rectangle2
	// cc.xy: sizes of rectangle1    - cc.wz: sizes of rectangle2
	// type: 1=square - 2/3='Z'shapes - 0=all the rest
	// color: is the color!

	float f = step( abs(wich-1.0), 0.1 ); // "O"
	pp=mix(pp,vec4(-.2,-.2,.0,.0),f); c=mix(c,vec4(.2,.2,.0,.0),f); 
	color=mix(color,vec3(0.,70.,200.)/256.,f); type=mix(type,1.,f); 
	f = step( abs(wich-2.0), 0.1 ); // "|"
	pp=mix(pp,vec4(.0,.0,.0,.0),f); c=mix(c,vec4(.4,.1,.0,.0),f); 
	color=mix(color,vec3(1.,0.,0.),f); type=mix(type,0.,f); 
	f = step( abs(wich-3.0), 0.1 ); // "T"
	pp=mix(pp,vec4(.0,.2,.2,.2),f); c=mix(c,vec4(.3,.1,.1,.2),f); 
	color=mix(color,vec3(50.,200.,0.)/256.,f); type=mix(type,0.,f); 
	f = step( abs(wich-4.0), 0.1 ); // "J"
	pp=mix(pp,vec4(.0,.0,.4,.0),f); c=mix(c,vec4(.3,.1,.1,.2),f); 
	color=mix(color,vec3(220.,0.,180.)/256.,f); type=mix(type,0.,f); 
	f = step( abs(wich-5.0), 0.1 ); // "L"
	pp=mix(pp,vec4(.0,.0,.0,.0),f); c=mix(c,vec4(.3,.1,.1,.2),f); 
	color=mix(color,vec3(220.,200.,0.)/256.,f);	type=mix(type,0.,f); 
	f = step( abs(wich-6.0), 0.1 ); // "Z"
	pp=mix(pp,vec4(.0,.0,.2,.2),f); c=mix(c,vec4(.2,.1,.2,.1),f); 
	color=mix(color,vec3(0.,180.,150.)/256.,f); type=mix(type,2.,f); 
	f = step( abs(wich-7.0), 0.1 ); // "S"
	pp=mix(pp,vec4(.0,.2,.2,.0),f); c=mix(c,vec4(.2,.1,.2,.1),f); 
	color=mix(color,vec3(250.,150.,0.)/256.,f); type=mix(type,3.,f);

	return draw(p, vec4(pos,pos)+pp, c, color ,type, rot); // return the color
}

// -------------------------------------------------------------------------------------
// This returns the data for each block (45 total)
// xy=coordinates - z=wich shape - w=rotation
// So it returns the place/shape/rotation for all the pieces to fill the screen
// Looks difficult and tedious but it was actually fun to solve the puzzle :)
vec4 getblock(float i) {
	vec4 pie=vec4(0.);
	pie=vec4(0.2,0.2, 1.,0.)*max(0.,1.-i);		
	pie+=vec4(0.4,0.0, 2.,0.)*max(0.,1.-abs(1.-i));		
	pie+=vec4(0.4,0.0, 3.,0.)*max(0.,1.-abs(2.-i));		
	pie+=vec4(1.2,0.0, 4.,0.)*max(0.,1.-abs(3.-i));		
	pie+=vec4(2.2,0.2, 1.,0.)*max(0.,1.-abs(4.-i));		
	pie+=vec4(2.0,0.0, 2.,1.)*max(0.,1.-abs(5.-i));		
	pie+=vec4(1.2,0.2, 6.,0.)*max(0.,1.-abs(6.-i));		
	pie+=vec4(2.4,0.0, 2.,0.)*max(0.,1.-abs(7.-i));		
	pie+=vec4(1.2,0.0, 7.,1.)*max(0.,1.-abs(8.-i));		
	pie+=vec4(0.0,0.4, 5.,0.)*max(0.,1.-abs(9.-i));		
	pie+=vec4(3.4,0.2, 1.,0.)*max(0.,1.-abs(10.-i));		
	pie+=vec4(2.4,0.0, 3.,0.)*max(0.,1.-abs(11.-i));		
	pie+=vec4(3.6,0.6, 4.,2.)*max(0.,1.-abs(12.-i));		
	pie+=vec4(2.0,0.4, 5.,0.)*max(0.,1.-abs(13.-i));		
	pie+=vec4(1.6,0.8, 1.,0.)*max(0.,1.-abs(14.-i));		
	pie+=vec4(2.2,1.2, 4.,3.)*max(0.,1.-abs(15.-i));		
	pie+=vec4(2.6,1.0, 6.,3.)*max(0.,1.-abs(16.-i));		
	pie+=vec4(2.6,1.2, 7.,3.)*max(0.,1.-abs(17.-i));		
	pie+=vec4(3.4,1.4, 2.,3.)*max(0.,1.-abs(18.-i));		
	pie+=vec4(3.2,0.8, 1.,0.)*max(0.,1.-abs(19.-i));		
	pie+=vec4(1.0,1.0, 3.,3.)*max(0.,1.-abs(20.-i));		
	pie+=vec4(0.2,0.6, 4.,0.)*max(0.,1.-abs(21.-i));		
	pie+=vec4(1.0,0.4, 2.,1.)*max(0.,1.-abs(22.-i));		
	pie+=vec4(0.2,0.8, 6.,0.)*max(0.,1.-abs(23.-i));		
	pie+=vec4(1.6,0.8, 7.,0.)*max(0.,1.-abs(24.-i));		
	pie+=vec4(3.4,1.2, 4.,2.)*max(0.,1.-abs(25.-i));		
	pie+=vec4(0.4,1.2, 2.,0.)*max(0.,1.-abs(26.-i));		
	pie+=vec4(1.6,1.0, 5.,1.)*max(0.,1.-abs(27.-i));		
	pie+=vec4(0.2,0.6, 7.,1.)*max(0.,1.-abs(28.-i));		
	pie+=vec4(2.4,1.2, 3.,2.)*max(0.,1.-abs(29.-i));		
	pie+=vec4(3.4,1.8, 1.,2.)*max(0.,1.-abs(30.-i));		
	pie+=vec4(1.8,1.2, 4.,1.)*max(0.,1.-abs(31.-i));		
	pie+=vec4(1.4,1.2, 6.,1.)*max(0.,1.-abs(32.-i));		
	pie+=vec4(3.2,1.6, 3.,3.)*max(0.,1.-abs(33.-i));		
	pie+=vec4(0.6,1.6, 4.,2.)*max(0.,1.-abs(34.-i));		
	pie+=vec4(1.0,1.4, 7.,2.)*max(0.,1.-abs(35.-i));		
	pie+=vec4(2.4,2.0, 1.,2.)*max(0.,1.-abs(36.-i));		
	pie+=vec4(1.0,2.0, 5.,2.)*max(0.,1.-abs(37.-i));		
	pie+=vec4(1.6,1.8, 3.,2.)*max(0.,1.-abs(38.-i));		
	pie+=vec4(2.6,1.2, 6.,1.)*max(0.,1.-abs(39.-i));		
	pie+=vec4(3.2,1.8, 4.,2.)*max(0.,1.-abs(40.-i));		
	pie+=vec4(1.6,1.8, 2.,0.)*max(0.,1.-abs(41.-i));		
	pie+=vec4(3.0,2.0, 4.,2.)*max(0.,1.-abs(42.-i));		
	pie+=vec4(3.6,2.0, 5.,2.)*max(0.,1.-abs(43.-i));		
	pie+=vec4(0.2,1.8, 1.,0.)*max(0.,1.-abs(44.-i));		
return pie;
}


// -------------------------------------------------------------------------------------

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
	vec3 col=vec3(0.);

	float spd=speed;
//make retro mode slower
#ifdef retro 
	spd*=.3;
#endif
	
	float ti=(iTime+5./spd)*spd*(1.+iTime*acceleration); //get time 
	float t=abs(55.-mod(ti,110.)); // make forward/backward cycles

#ifdef scroll
	uv.x=mod(uv.x-iTime*.3,1.); // horizontal scrolling
#endif

	if (mod(ti,330.)>110.) uv.x=1.-uv.x; //invert X in two sequences
	if (mod(ti,330.)>220.) uv.y=1.-uv.y; //invert Y in one sequence

	uv.x*=iResolution.x/iResolution.y;
	uv*=vec2(2.026,2.); // scale to fit screen
	
// pixelate and quantize movement for retro mode	
#ifdef retro 
	t=floor(t*5.)/5.;
	uv=floor(uv*51.)/51.;
#endif

	for (int i=0; i<45; i++) { // loop through the pieces
		// get the data for the block and animate Y coord
		vec4 pie=getblock(float(i))+vec4(0.,max(0.,t-48.+float(i)),0.,0.); 
		if (distance(uv,pie.xy)<.85) // optimization trick
			col+=block(uv,pie.xy,pie.z,pie.w); //get color
	}
	fragColor = vec4(col,1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
