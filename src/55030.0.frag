/*
 * Original shader from: https://www.shadertoy.com/view/WtBGDz
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
/*

	Algorithmic Vector Art
	----------------------

	This example focuses on applying layering techniques to a distance field.
    Algorithmically speaking, there's nothing particularly new here -- I just 
    wanted to put something artsy together.

	Back in the math days, it used to be all about the theory. I still appreciate 
    the reasoning behind certain graphics routines, and still enjoy tweaking code 
	to make things go faster. However, these days, my favorite part of the rendering
	process is the decorative side of things... It's not exactly my forte, but I
	enjoy it anyway. :)

	This particular example is rendered in a sticker style, which is a vector 
	graphics cliche you'll see all over the place. I guess it's popular because it's
	trivial to produce, but has decent visual impact. In essence, you render some
	thick (usually contrasting) outer layers, the main colored layer, and some
	highlighting. The latter is produced via some simple distance-field operation
    trickery. It's also relatively cheap to produce as well, which helps.

	The forground distance field is just some simple Truchet-based tiling, and the
	background is some overlapping shapes that are produced in a similar way to
	Voronoi -- None of which are difficult to code.

	The code and comments were written from top to bottom without a lot of 
	forethought, so I wouldn't take any of it too seriously. The main purpose was 
	show that it's possible to render realtime content in a lot of the static 
	vector graphic styles that you see on the net.


*/


// I put this in as an afterthought. It didn't make the cut, but it's interesting. :)
//#define LEAFY

// A cooler look.
//#define BLUE

// Display the grid, in order to see the individual tiles.
//#define SHOW_GRID

// Remove the pipes in the foreground. Used for debug purposes, but I've left
// it there for anyone who'd like to see the background only.
//#define REMOVE_FOREGROUND


// Standard 2D rotation formula.
mat2 rot2(in float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }


float hash21(vec2 p){
    
    return fract(sin(dot(p, vec2(27.917, 57.543)))*43758.5453);
}


float dist(vec2 p, float rnd){
    
    
    #ifdef LEAFY
    // Leaves.
    
    	p = rot2(6.2831*rnd + fract(rnd*57. + .37)*iTime/2.)*p;
    
        #if 1
        // Leaf 1.
        float r = length(p) + sqrt(abs(p.x/8.));
        #else
        // Leaf 2.
        float r = pow(dot(pow(abs(p), vec2(2.)), vec2(1)), 1./2.) + abs(p.x);
        #endif
        return r/1.4142 - .0;
    #else 
    // Bubbles -- Much simpler. :)
        return length(p);

    #endif
    
}


// IQ's 2D signed box formula: I tried saving calculations by using the unsigned one, and
// couldn't figure out why the edges and a few other things weren't working. It was because
// functions that rely on signs require signed distance fields... Who would have guessed? :D
float sBox(vec2 p, vec2 b){

  vec2 d = abs(p) - b;
  return min(max(d.x, d.y), 0.) + length(max(d, 0.));
}

// Pipe distance field pattern, consisting of three simply constructed Truchet tiles.
vec2 PipePattern(vec2 p, float lw){
    
    // Distance field variables.
    float d = 1e5, d2 = 1e5;
    

	vec2 ip = floor(p); // Cell ID.
    p -= ip + .5; // Cell's local position. Range [vec2(-.5), vec2(.5)].

    
    // Using the cell ID to generate some unique random numbers.
    //
    float rnd = hash21(ip + 12.53); // Cell type selection.
    float rnd2 = hash21(ip); // Individual random tile flipping.

 
    if(rnd2>.6){
        
        // Standard, double arc Truchet tile.
        
        // Random tile flipping.
        p.y *= (rnd>.5)? -1. : 1.;

        // Diagonal repeat symmetry, in order to draw two arcs with one call.
        p = p.x>-p.y? p : -p;

        // Creating two annuli at diagonal corners.
        float dc = abs(length(p - .5) - .5);
        d = min(d, dc);

        // Without diagonal symmetry, you'd need to draw the other arc.
        //dc = abs(length(p + .5) - .5);
        //d = min(d, dc);
        
    }
    else if(rnd2>.3){
        
        
        // A single line running down the middle of the tile, with dots on
        // the two remaining edges.
        
        // Random tile flipping.
        p = (fract(rnd*151. + .76)>.5)? p.yx : p;

        // Line.
        d = min(d, sBox(p, vec2(0, .5)));

        // Two dots.
        p.x = abs(p.x); // Repeat trick.
        d = min(d, length(p - vec2(.5, 0)));            
        
    }
    else {

        // Cross over lines. This necessitates two distance fields, since 
        // there is rendering order to consider. This tile by itself would
        // create a weave pattern.
        
        // Random tile flipping.
        p = (fract(rnd*57. + .34)>.5)? p.yx : p;
        
        // Verticle line.
        d = min(d, sBox(p, vec2(0, .5)));
        // Horizontal line.
        d2 = min(d2, sBox(p, vec2(.5, 0)));
       
    }

 
    // Field width, or giving the pipe pattern some width.
    d -= lw/2.;
    d2 -= lw/2.;
 
   
    return vec2(d, d2);
    
    
}


// vec2 to vec2 hash.
vec2 hash22(vec2 p) { 

    // Faster, but doesn't disperse things quite as nicely. However, when framerate
    // is an issue, and it often is, this is a good one to use. Basically, it's a tweaked 
    // amalgamation I put together, based on a couple of other random algorithms I've 
    // seen around... so use it with caution, because I make a tonne of mistakes. :)
    float n = sin(dot(p, vec2(41, 289)));
    //return fract(vec2(262144, 32768)*n)*2. - 1.; 
    
    // Animated.
    p = fract(vec2(262144, 32768)*n);
    return sin(p*6.2831853 + iTime); 
    
}


// Based on IQ's gradient noise formula.
float n2D3G( in vec2 p ){
   
    vec2 i = floor(p); p -= i;
    
    vec4 v;
    v.x = dot(hash22(i), p);
    v.y = dot(hash22(i + vec2(1, 0)), p - vec2(1, 0));
    v.z = dot(hash22(i + vec2(0, 1)), p - vec2(0, 1));
    v.w = dot(hash22(i + 1.), p - 1.);

#if 1
    // Quintic interpolation.
    p = p*p*p*(p*(p*6. - 15.) + 10.);
#else
    // Cubic interpolation.
    p = p*p*(3. - 2.*p);
#endif

    return mix(mix(v.x, v.y, p.x), mix(v.z, v.w, p.x), p.y);
}


// Smooth fract function.
float sFract(float x, float sf){
    
    x = fract(x);
    return min(x, (1. - x)*x*sf);
    
}


// Cheap and nasty 2D smooth noise function with inbuilt hash function -- based on IQ's 
// original. Very trimmed down. In fact, I probably went a little overboard. I think it 
// might also degrade with large time values.
float n2D(vec2 p) {

	vec2 i = floor(p); p -= i; p *= p*(3. - p*2.);  
    
	return dot(mat2(fract(sin(vec4(0, 1, 113, 114) + dot(i, vec2(1, 113)))*43758.5453))*
                vec2(1. - p.y, p.y), vec2(1. - p.x, p.x) );

}

// FBM -- 4 accumulated noise layers of modulated amplitudes and frequencies.
//float fbm(vec2 p){ return n2D(p)*.533 + n2D(p*2.)*.267 + n2D(p*4.)*.133 + n2D(p*8.)*.067; }


// The grungey texture -- Kind of modelled off of the metallic Shaderto texture,
// but not really. Most of it was made up on the spot, so probably isn't worth 
// commenting. However, for the most part, is just a mixture of colors using 
// noise variables.
vec3 GrungeTex(vec2 p){
    
 	// Some fBm noise.
    //float c = n2D(p*4.)*.66 + n2D(p*8.)*.34;
    float c = n2D(p*3.)*.57 + n2D(p*7.)*.28 + n2D(p*15.)*.15;
   
    // Noisey bluish red color mix.
    vec3 col = mix(vec3(.25, .1, .02), vec3(.35, .5, .65), c);
    // Running slightly stretched fine noise over the top.
    col *= n2D(p*vec2(150., 350.))*.5 + .5; 
    
    // Using a smooth fract formula to provide some splotchiness... Is that a word? :)
    col = mix(col, col*vec3(.75, .95, 1.2), sFract(c*4., 12.));
    col = mix(col, col*vec3(1.2, 1, .8)*.8, sFract(c*5. + .35, 12.)*.5);
    
    // More noise and fract tweaking.
    c = n2D(p*8. + .5)*.7 + n2D(p*18. + .5)*.3;
    c = c*.7 + sFract(c*5., 16.)*.3;
    col = mix(col*.6, col*1.4, c);
    
    // Clamping to a zero to one range.
    return clamp(col, 0., 1.);
    
}



void mainImage(out vec4 fragColor, in vec2 fragCoord){
    

    // Aspect correct screen coordinates.
	vec2 uv = (fragCoord - iResolution.xy*.5)/min(800., iResolution.y);
    
    // Scaling and translation.
    float gSc = 5.;
    vec2 p = uv*gSc + vec2(.5, 0)*iTime;
    // Rotation, for something different.
    //vec2 p = rot2(3.14159/6.)*(uv*gSc + vec2(.5, 0)*iTime);
    
    vec2 oP = p;
    
        // Line width and edge width.
    const float lw = .425;
    const float ew = .04;
    // Smoothstepping factor.    
    float sf = 1./iResolution.y*gSc;    
      
    // Three instances of the pipe pattern: The pattern itself, one for the 
    // shadow and another for some highlighting.
    vec2 df = PipePattern(p, lw);
    vec2 dfSh = PipePattern(p - vec2(-.03, -.05)*2., lw);
    vec2 dfHi = PipePattern(p - vec2(.03, .05)*1.1, lw); 

     
    // Two textures. One that matches the pipe movement, and a static one for the background.
    //
    // Background texture.
    vec3 tx = GrungeTex(uv*1. + .5);
    tx = smoothstep(-.1, .5, tx);
    tx = mix(tx, vec3(1)*dot(tx, vec3(.299, .587, .114)), .75);
    tx *= vec3(1, .9, .8);
    //
    // Used on the pipe colored layer... A bit wasteful, but this isn't a taxing example.
    vec3 tx2 = GrungeTex(p/gSc*1. + .5);
    tx2 = smoothstep(-.1, .5, tx2);
    tx2 = mix(tx2, vec3(1)*dot(tx2, vec3(.299, .587, .114)), .75);
    tx2 *= vec3(1, .9, .8);

    // Pipe color.
    vec3 lCol = tx2*2.2*vec3(1, .05, .3);
    lCol = mix(lCol, lCol.xzy, uv.y*.25 + .25);
    //
    // Outer stroke color. White is simpler, but you could try things like vec3(1, .8, .6), ETC.
    vec3 outerCol = vec3(1);

    
    
    #ifdef LEAFY
    // Autumn leaves.
    lCol = mix(lCol.yxz, lCol, uv.y*.25 + .75);
    lCol = mix(lCol, vec3(1)*dot(lCol, vec3(.299, .587, .114)), .5);
    #endif
    
     
 
///////   
    
    vec3 bg = max(max(tx.x, tx.y), tx.z)*vec3(1);
    //vec3 bg = = dot(tx, vec3(.299, .587, .114))*vec3(1);

    
    // Initiate the scene color to the background.
    vec3 col = bg;
    
    
    #ifdef LEAFY
    // Brown background.
    col = (tx*2.2*vec3(.8, .6, .45)*.5);
    col = mix(col, col.xzy, uv.y*.25 + .25);
    col = mix(col, col.yxz, .15);
    #endif
    
    
    // BACKGROUND LAYER RENDERING.
    
    // The background bubbles: I made it up as I went along, but in essence, it's
    // just a few layers, and algorithmically similar to a Voronoi routine.
    float cir = 1e5, cirHi = 1e5, cirSh = 1e5;
    
    const float sc = 3.5; // Object scale.
    
    // Grey color.
    vec3 gr = dot(tx, vec3(.299, .587, .114))*vec3(1.5);
    // Colored layer. Pink, in this case.
    vec3 co = (tx*2.2*vec3(1, .05, .3));
    co = mix(co, co.xzy, uv.y*.25 + .25);
    
    for(int j = 3; j>=-3; j--){ // Top to bottom rendering, for the 3D distance look.
        for(int i = 3; i>=-3; i--){ // Right to left.
            
            vec2 s = uv*gSc*sc - vec2(1., .5)*iTime;
            
            
            vec2 is = floor(s + vec2(i, j)); // Cell ID.
            s -= is + .5; // Cell coordinates.
            if(mod(is.x, 2.)>.5) s.y += .5; // Staggered hexagon-like scale look.
            
            vec2 ofs = vec2(hash21(is + 4.33), hash21(is + 1.57)) - .5;
            ofs = sin(ofs*6.2831 + vec2(1.57, 0) + iTime/2.);
            
            // Random object size.
            float sz = .15 + hash21(is + 4.52)*.45;
            
            // Shadow layer.
            cirSh = dist(s + ofs + vec2(.03, .05)*sc, hash21(is + 7.38)) - sz;
            // Normal layer.
            cir = dist(s + ofs, hash21(is + 7.38)) - sz; 
            // Highlighting layer.
            cirHi = dist(s + ofs - vec2(.03, .05)*1.1*sc, hash21(is + 7.38)) - sz;
            cirHi = max(cirHi, cir - ew*.5*sc); 
            
            // Set the object to a grey color, and a random few pink... What a mess. 
            // You can safely ignore the code. :)
            vec3 bCol = gr;
            #ifndef LEAFY
            if(hash21(is + 4.63)>.85) {
            #endif
                bCol = co;
            #ifndef LEAFY
            }
            #endif
            
            #ifdef LEAFY
            // Autumn leaves.
            bCol = mix(bCol.yxz, bCol, .5 + hash21(is)*.3);
            #endif
            
            // Blue.
            //bCol = mix(bCol.zxy, bCol.zyx, -uv.y*.25 + .75);
    
                
            // The layers: Shadow, strokes, coloring, and highlighting.
            col = mix(col, vec3(0), (1. - smoothstep(0., sf*sc*4., cirSh - ew*6.))*.5);
            col = mix(col, outerCol, (1. - smoothstep(0., sf*sc, cir - ew*5.))*.9);
            col = mix(col, vec3(0), (1. - smoothstep(0., sf*sc, cir - ew*2.))*.95);
    		col = mix(col, bCol, (1. - smoothstep(0., sf*sc, cir + ew)));
            col = mix(col, bCol/2., (1. - smoothstep(0., sf*sc, cirHi + ew*1.3*sc))*.95);
            col = mix(col, vec3(1), (1. - smoothstep(0., sf*sc, cirHi + ew*2.3*sc))*.75);
        }
    }
    
    
    #ifdef REMOVE_FOREGROUND
    // Saving the background.
    vec3 bgCol = col;
    #endif
    
   
    
  
    // FOREGROUND LAYER RENDERING.
  
    // Bottom layer: Shadows, strokes, color, and highlighting.
    // The distance field trickery is due to the fact that rendering order needs
    // to be considered. 
    col = mix(col, vec3(0),  (1. - smoothstep(0., sf*4., min(dfSh.x, dfSh.y) - ew*2./1.))*.75);
    col = mix(col, outerCol, (1. - smoothstep(0., sf, df.x)));
    col = mix(col, vec3(0), (1. - smoothstep(0., sf, df.x + ew*1.5)));
    col = mix(col, lCol,  (1. - smoothstep(0., sf, df.x + ew*3.5)));
    float dHiX = min(dfHi.x, dfHi.y); dHiX = max(dHiX, df.x - ew*.5); 
    col = mix(col, lCol/2.,  (1. - smoothstep(0., sf, dHiX + ew*3.8))*.95);
    col = mix(col, vec3(1),  (1. - smoothstep(0., sf, dHiX + ew*4.8))*.95);
     
	// Top layer.
    // ew*2. is extra shadow width.
    float dShY = max(dfSh.y, max(dfSh.x, df.x) + ew*2.); 
    col = mix(col, vec3(0),  (1. - smoothstep(0., sf*4., dShY - ew*2./1.))*.75);
 	col = mix(col, outerCol, (1. - smoothstep(0., sf, df.y)));
    col = mix(col, vec3(0), (1. - smoothstep(0., sf, df.y + ew*1.5)));
    col = mix(col, lCol,  (1. - smoothstep(0., sf, df.y + ew*3.5)));    
    
    // Hack, to fix the shadow lines that appear at the grid joins. Comment it out to
    // see a visual explanation.
    float dHiY = min(dfHi.y,  max(dfHi.x, -(df.x)));//df.x+ew*1.5
    dHiY = max(dHiY, df.y - ew*.5); 
	col = mix(col, lCol/2.,  (1. - smoothstep(0., sf, dHiY + ew*3.8))*.95);
	col = mix(col, vec3(1),  (1. - smoothstep(0., sf, dHiY + ew*4.8))*.95);
    


    #ifdef SHOW_GRID
    // GRID.
    vec2 ip = floor(p); // Cell ID.
    p -= ip + .5; // Cell's local position. Range [vec2(-.5), vec2(.5)].
    float grid = max(abs(p.x), abs(p.y)) - .5;
    grid = abs(grid) - ew/4.;
    //col = mix(col, vec3(1),  (1. - smoothstep(0., sf, grid - ew)));
	col = mix(col, vec3(1, .9, .8),  (1. - smoothstep(0., sf, grid - ew/1.5))*.65);
	col = mix(col, vec3(0),  (1. - smoothstep(0., sf, grid)));
	#endif
    
    
    // Cheap paper grain.
    //vec3 rn3 = vec3(hash21(oP), hash21(oP + 2.37), hash21(oP + 4.83));
    //col *= .7 + .3*rn3.xyz  + .3*rn3.xxx;
	 
    
    // Fake 8-bit color style.
    //col = floor(col*7.999)/7.;
    
    
    #ifdef REMOVE_FOREGROUND
    // Just the background.
    col = bgCol;
    #endif
    
    
    #ifdef BLUE
    // Blue.
    col = mix(col.zxy, col.zyx, -uv.y*.25 + .75);
    #endif
     
    // Subtle vignette.
    uv = fragCoord/iResolution.xy;
    col *= pow(16.*uv.x*uv.y*(1. - uv.x)*(1. - uv.y) , .0625);
    // Colored variation.
    //col = mix(col.zyx, col, pow(16.*uv.x*uv.y*(1. - uv.x)*(1. - uv.y) , .0625));
    
     
    // Rough gamma correction.
    fragColor = vec4(sqrt(max(col, 0.)), 1);
    

}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
