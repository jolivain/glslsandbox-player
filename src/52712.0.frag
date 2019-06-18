/*
 * Original shader from: https://www.shadertoy.com/view/XtcfRH
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);

// --------[ Original ShaderToy begins here ]---------- //
/*

	Polar Grid Motion
	-----------------

	Utilizing a repeat polar grid to plot objects moving along a transcendental rose 
    curve path.

	I wanted to post something nice and simple that the average GPU could handle. This 
    was inspired in part by Vovosunt's "Dots and Spirals," but was based on Fabrice's 
    original "rosace 3" example. They say small things amuse small minds, and at the 
    time, that particular example kept me busy for ages. :)

	The particle movement is pretty standard. Each object moves in a circular path with a 
    varying radius and Z position based on transcendental functions according to angular 
    position. For anyone not quite familiar with it, I've provided some links below.

	The only mildly tricky bit was the rendering process. That involved keeping track of
	potentially overlapping objects, then sorting prior to rendering. There are three
	polar partitioned grids overlapping one another, but arranged radially and depthwise
	to look like they form a continuous closed curve. Potential overlapping objects
	consist of three overlapping polar cells (one for each loop) and each of their adjacent 
    polar neighbors (the two on either side). That's nine altogether, which is not very 
    taxing on the average GPU. Therefore, I wouldn't expect any frame rate problems.

	I've tried to keep things relatively simple, but there's still a bit of esoteric 
	dressing up code in there. For anyone who'd like to make something similar, you'd be 
    better off starting from scratch, then using this, Vovosunt's or Fabrices example as 
    a guide.
	
	Anyway, I'd call this a pseudo 3D example. At some stage, I'll try to come up with a
	raymarched variation. By the way, there's a "TRANSPARENT" and "RANDOM_VARIATION" 
	define below, for anyone bored enough to try them. :)


    Examples:

	// Really nice.
	Dots and Spirals - Vovosunt
	https://www.shadertoy.com/view/MltyzN
    
    // The original that I based this off of.
    rosace 3 ( 215 chars) - FabriceNeyret2 
	https://www.shadertoy.com/view/ls3XWM

    // A much simpler demonstration of the key motion concept.
	Linear motion - ABizard 
	https://www.shadertoy.com/view/4lKyzd

	Links:

    Rose (mathematics)
    https://en.wikipedia.org/wiki/Rose_(mathematics)

	ROSE
    https://www.mathcurve.com/courbes2d.gb/rosace/rosace.shtml

*/



// A custom transparent overlay effect. The thing I like about pixel shaders is that
// Photoshop layer effects are almost rudimentary.
//#define TRANSPARENT


// Making use of the individual particle ID to produce a random variation.
//#define RANDOM_VARIATION



// Cheap and nasty 2D smooth noise function with inbuilt hash function -- based on IQ's 
// original. Very trimmed down. In fact, I probably went a little overboard. I think it 
// might also degrade with large time values, but that's not an issue here.
float n2D(vec2 p) {

	vec2 i = floor(p); p -= i; p *= p*(3. - p*2.);  
    
	return dot(mat2(fract(sin(vec4(0, 1, 113, 114) + dot(i, vec2(1, 113)))*43758.5453))*
                vec2(1. - p.y, p.y), vec2(1. - p.x, p.x) );

}

// FBM -- 4 accumulated noise layers of modulated amplitudes and frequencies.
float fbm(vec2 p){ return n2D(p)*.533 + n2D(p*2.)*.267 + n2D(p*4.)*.133 + n2D(p*8.)*.067; }


vec3 getLight(vec3 p, vec3 n, vec3 lp){
    
    vec3 ld = lp - p;
    float lDist = length(ld);
    ld /= lDist;
    float diff = max(dot(ld, n), 0.);
    float atten = 1.5/(1. + lDist*lDist);
    vec3 light = vec3(1)*(diff + .5)*atten;
    
    return light;
}


void mainImage( out vec4 O, in vec2 U ){

	vec2 R = iResolution.xy;
    
    // Setting a minimum resolution, since fullscreen looks too bloated... Of course,
    // that would ruin a mobile phone fullscreen settings... Too many systems, so it's
    // impossible to win without seriously ruining your code. I miss the days when we were 
    // all on 17 inch screens... but not the grainy PPI. Definitely don't miss that. :)
    float yRes = min(R.y, 800.);
    
    // Screen coordinates. This started with a discussion on Fabrice's rosace example
    // (See the link above). Hence, the confusing minimal variable names. :)
    U = (2.*U - R)/yRes;
    
   
    //U *= 1. + dot(U, U)*.025; // Makeshift fisheye, if that's your thing.
    
     
    // Three lines of 21, so 63 objects in all. There's nothing special about 21. It's
    // just the number I settled on. Higher numbers work, but object size needs to be
    // reduced, since overlap becomes a problem.
    const float num = 21.;
    
    
    // The scene light. Placed just above the scene.
    vec3 lp = vec3(0, 0, 1); // Moving light: vec3(.3*cos(t), .2*sin(t), 1).
    // The object normals. Trivial, in this case, since all are facing the same way.
    vec3 n = vec3(0, 0, -1);
    
    

    
    
    
    // SCENE BACKGROUND.
    //
    // Just some noise, lines, and square geometry. Hopefully, self explanatory.
    
    // Initialize the background do a brownish gradient.
    vec3 bg = vec3(.5, .45, .4);
    
    #ifdef TRANSPARENT
    	bg /= 2.;
    #endif
    
    // Apply some light to the background.
    vec3 light = getLight( vec3(U, 2.6), n,lp);
    bg *= light;
     
    // Apply some subtle marbly noise.
    float ns = fbm(U*5. + 17.3);
    ns = mix(ns, sin(ns*32. - cos(ns*34.)), .125);
    bg *= max(ns, 0.)*.4 + .8;
    
    // Apply a grainy randomized diagonal pattern. It's subtle, but I prefer it.
    // Without it, the background seems a little too clean.
    float pat = clamp(sin((U.x - U.y)*min(R.y, 800.)/1.5)*1. + .5, 0., 1.);
    float rnd = fract(sin(dot(U, vec2(11.27, 112.43)))*43758.5453);
    if(rnd>.5) pat *= .6; 
    else pat *= 1.4;
    bg *= pat*.3 + .75;  
    

    
    // Initiate the scene color to the background.
    vec3 col = bg;
    
    // Render some border objects to frame things a little bit.
    //
    // Border sights: The background corners looked a little empty, so I threw 
    // these in to balance things out... Not sure if it worked, but it's done now. :)
    vec2 b = vec2(iResolution.x/iResolution.y, 1) - .1;
    vec2 q = abs(U);
    float bord = max(q.x - b.x, q.y - b.y);
    bord = max(bord, -(bord + .11));
    bord = max(bord, -min(q.x - b.x + .22, q.y - b.y + .22));
    //bord = max(bord, -(bord + .02));

    
    // Render the border sight... edge things, or whatever they are.
    float falloff = 1./min(R.y, 800.);
    col = mix(col, vec3(0), (1. - smoothstep(0., falloff*12., bord ))*.35);
    col = mix(col, vec3(0), (1. - smoothstep(0., falloff, bord))*.7);
    col = mix(col, bg*2.2, (1. - smoothstep(0., falloff, bord + .01)));
    col = mix(col, vec3(0), (1. - smoothstep(0., falloff, bord + .035)));
    col = mix(col, bg*1.2, (1. - smoothstep(0., falloff, bord + .044)));   
    
    
    
    // OBJECT MOVEMENT.
    //
    // Moving the cell objects around the rose curve path whilst storing their 
    // positions for rendering.
    
    // Nine storage vectors: XYZ hold the 3D positions of the center object and each
    // of its 8 polar neighbors. The W position holds the object ID.
    //
    // When taking polar coordinates into account, there are a potential 9 objects that 
    // could possibly overlap. Therefore, Z distances on all 9 need to be sorted to get 
    // the rendering order correct. If you spaced out the objects more, then you could
    // probably get away with 3.
    vec4 c[9];
    
    vec4 p; // Utility storage for the object position and ID.
  
    // A bit of global rotation -- Rotating the collection of objects as a whole.
    float t = iTime/4.;
    // Alternatively, you could take "t" out of the loop below, and globally rotate
    // "U" itself.
    //float t = iTime/4., cs = cos(t), sn = sin(t);
    //U *= mat2(cs, sn, -sn, cs);
    
    // Storing "atan" to save a couple of extra calls. Not overly necessary, but my
    // oldschool brain still thinks of it as an expensive function. :)
    float a0 = atan(U.y, U.x) - t;
    
    // Due to overlap, polar neighbors need to be considered. If the cell objects are 
    // smaller, then it's not a problem, but I wanted a bit of object density.
    //
    for(int i=0; i<3; i++){ // Adjacent polar angle cells.
         
        float a = a0; // Polar angle.
    		
        for(int j=0; j<3; j++) {  // Three intertwining overlapping revolutions.
          
            // Current cell angle.
            //
            // Note the "i - 1" figure. That's because we're considering overlapping
            // cells to the left and right of "ia," and not two to the right... It took
            // me a while to realize that oversight. :)
            //
            // Cell index.
        	float ia = mod(floor(a*num/6.283) + float(i - 1), num*3.);
            // Set the object ID to the cell index.
            p.w = ia; 
            // Covert cell index to a polar angle.
            ia = (ia/num + .5/num)*6.283;
          
            // Move X and Y along a rose curve path... or a rosace path, as Fabrice calls 
            // it, which I'll assume is the French rosette discription. Without going into 
            // detail, it's a circular path with a varying sinusoidal radius that gives it
            // that interesting overlapping look.
            //
            // By the way, figures of 2./3., 4./3, 7./3. will also produce patterns. For 
            // other patterns, an adjustment of the "j" loop here and below and the "c" 
            // array size would be necessary... I'm sure you'll figure it out. :)
            float off = ia*5./3. + iTime;
        	// The X and Y positions. Basically, a circle of varying radius.
            p.xy = (.55 - .25*sin(off))*vec2(cos(ia + t), sin(ia + t));
            
            // By varying the Z component with a complementing offset, the objects move
            // along an interwoven closed path. Obviously, if you set Z to a constant, all 
            // objects would be coplanar and things wouldn't work.
        	p.z = 2. + cos(off - 3.14159/5.)*.35;
            //p.z = (2. + cos(a*5./3. + iTime - 3.14159/5.)*.35);
   
            
            // Store the current cell postion and ID for usage in the rendering loop.
            c[i*3 + j] = p;

            // Increase the polar angle. Altogether, there'll be three whole revolutions.
            a += 6.283; 
        
        	
    	}
        
    }
    
    // OVERLAPPING NEIGHBORING OBJECT SORTING.
        
    // Super lazy distance ordering: Since there are only 45 ((9 + 1)*9/2) iterations --
    // or something along those lines -- performing a quick swap, the GPU shouldn't really 
    // notice. Also, I've heard that for small datasets, keeping the algorithm simple
    // (branchless, etc) is more important than iteration count, but I don't know for sure.
    //
    // By the way, I think there's a quick vector swap somewhere, so I should probably 
    // track that down.
    //
    // On a side note, you could probably get away with a Z-buffer test and do away with the 
    // ordering, but it might disturb the smooth rendering.
    //
	for(int i=0; i<9; i++){
        for(int j=1; j<9; j++){
            // With just a float, a branchless swap is possible, but I'm not sure it can be 
            // done in this case. If anyone knows of a way, feel free to let me know. 
            if((j > i) && (c[i].z<c[j].z)){ 
                vec4 temp = c[i]; c[i] = c[j]; c[j] = temp;
            }
        }
	}

    
    // OBJECT RENDERING.

    for(int i=0; i<3; i++){ // Adjacent polar angle cells.

        for (int j=0; j<3; j++) {  // Three intertwining overlapping revolutions.
            
            // Obtaining the position and ID for the current cell.
            p = c[i*3 + j];
            
            // Using the Z coordi
            float sz = .175/p.z;
            float d = length(U - p.xy) - sz;
            
            // Main object color 
            #ifdef RANDOM_VARIATION   
                // Object ID based random value.
            	float rnd = fract(sin(p.w + 37.)*43758.5453);
                // Annulus. Equivalent to: max(d, -(d + sz*.75)).
            	if(rnd>.5) d = (abs(d + sz*.375) - sz*.375); 
            
            	// Random color variations.
            	#ifdef TRANSPARENT
                vec3 pCol = mod(p.w, 3.)==0.?  vec3(1.5, .9, .3) : vec3(1.5, .24, .52);
                #else
            	//vec3 pCol = rnd>.25? vec3(1, .75, .25) : vec3(.6, .9, .25);
            	vec3 pCol = mod(p.w, 3.)==0.? vec3(.35) : vec3(1, .22, .45);
                #endif
            #else
            	vec3 pCol = vec3(1, .75, .25);
            #endif

            
            // Lighting the object. Very simple.
            light = getLight(p.xyz, n, lp);

            // Circular smoothstep falloff, based in the radial inverse.
            falloff = .0005/sz;
            
            // Rendering the simple pattern on the discs. By the way, you could use some
            // repeat trickery, and cut these steps down, but this isn't a GPU intensive
            // example, and I wanted to try different variations, and so forth. Also, for 
            // readability, I wanted "col" written on the left, so these could be trimmed
            // down further.
            //
            // Shadow, edges, color, etc.
            //
            
            #ifdef TRANSPARENT
            	pCol = (col + .1)*pCol*light*3.;
                // Alternate: Fade between transparent and opaque.
                //pCol = mix(pCol*light, (col + .1)*pCol*light*3., smoothstep(-.1, .1, sin(iTime/4.)));            
            #else
            	pCol *= light;
            #endif
            
            col = mix(col, vec3(0), (1. - smoothstep(0., falloff*10., d - .0035))*.5);
            col = mix(col, vec3(0), 1. - smoothstep(0., falloff, d));
            col = mix(col, pCol, 1. - smoothstep(0., falloff, d + .01));
            col = mix(col, vec3(0), 1. - smoothstep(0., falloff, d + sz - sz*.4));
            col = mix(col, vec3(light), 1. - smoothstep(0., falloff, d + sz - sz*.4 + .01));
            col = mix(col, vec3(0), 1. - smoothstep(0., falloff, d + sz - sz*.2 + .01));


        }

    }
  
    
	// POSTPROCESSING.
    
	// A bit of color mixing, based on the canvas Y coordinate.
    //col = mix(col.xzy, col, .75);
    col = mix(col.xzy, col, U.y*.3 + .65);
    
    #ifndef RANDOM_VARIATION
	#ifdef TRANSPARENT
    col = col.zyx;
    #endif 
    #endif 
 
    // Rough gamma correction.
    O = vec4(sqrt(max(col, 0.)), 1);
}


// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
