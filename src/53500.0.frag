/*
 * Original shader from: https://www.shadertoy.com/view/Xtcczj
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

	Psuedo CJKV Characters
	----------------------

	Combining random vertical and horizontal line segments to vaguely form 
	pseudo digitized script logograms used in various parts of Asia. From 
	834144373's perpective, it will look like a bunch of meaningless random 
	lines strung together by an illiterate Westerner. :D

	Fabrice Neyret recently posted a trimmed down version of Otavio Good's
	"Runes" example, and it reminded me of a pseudo Chinese character
	version I'd seen around in a few places. This particular image was
	modelled from memory off an image I came across on a Tumblr blog called 
    "Experiments In Processing" run by Jerome Herr. The link is below, for 
	anyone interested.

	As you can see, it's just some random horizontal and vertical lines. 
	This should have been a very simple exercise -- Render 16 horizontal 
	segments and 16 vertical segments in a random fashion, and you're done. 
	Couldn't be easier... unless you have the logic of a drunk squirrel, and 
	spend ages not realizing that four lines bound three cells and not four. :D

	Anyway, to a Westerner like myself, it gives the impression of digitized
	Chinese characters for about 2 seconds, before the brain starts to sense
	that something's amiss. At that point, the characters take on a pseudo
	alien appearance, which is vaguely interesting in its own right. Someone
	with more expertise might be able to apply some heuristics to make it
	look more one way or the other, but this was just a quick diversion, so I
	wouldn't take it too seriously. :)

	I'll put together a fancier example later, but for now, I just wanted to 
	show a proof of concept. By the way, if you didn't require rounded lines, 
	you could push this out in a couple of tweets or less.

	Inspired by:

	runes (simplified version)  - FabriceNeyret2
    https://www.shadertoy.com/view/4ltyDM
    Which in turn was based on:
	runes - otaviogood 
	https://www.shadertoy.com/view/MsXSRn
	

    Image based on:

	// Dave Hoskins tracked down the image I based this off of:
    grid stuff 5: pseudo-chinese
	http://p5art.tumblr.com/page/13 -- That could change later.

    // The rest of the blog contains some really cool imagery and is 
    // worth perusing through:
	Experiments In Processing - Jerome Herr
    http://p5art.tumblr.com/archive

	

*/

// This is a rewrite of IQ's original. It's self contained, which makes it much
// easier to copy and paste. I've also tried my best to minimize the amount of 
// operations to lessen the work the GPU has to do, but I think there's room for
// improvement.
//
float n3D(vec3 p){
    
    // Just some random figures, analogous to stride. You can change this, if you want.
	const vec3 s = vec3(1, 57, 113);
	
	vec3 ip = floor(p); // Unique unit cell ID.
    
    // Setting up the stride vector for randomization and interpolation, kind of. 
    // All kinds of shortcuts are taken here. Refer to IQ's original formula.
    vec4 h = vec4(0., s.yz, s.y + s.z) + dot(ip, s);
    
	p -= ip; // Cell's fractional component.
	
    // A bit of cubic smoothing, to give the noise that rounded look.
    p = p*p*(3. - 2.*p);
    
    // Standard 3D noise stuff. Retrieving 8 random scalar values for each cube corner,
    // then interpolating along X. There are countless ways to randomize, but this is
    // the way most are familar with: fract(sin(x)*largeNumber).
    h = mix(fract(sin(h)*43758.5453), fract(sin(h + s.x)*43758.5453), p.x);
	
    // Interpolating along Y.
    h.xy = mix(h.xz, h.yw, p.y);
    
    // Interpolating along Z, and returning the 3D noise value.
    return mix(h.x, h.y, p.z); // Range: [0, 1].
	
}

float fbm(vec3 p, float sc){
    
    p *= sc;
    return n3D(p)*.57 + n3D(p*2.)*.28 + n3D(p*4.)*.15;
    
}

// vec2 to float hash formula.
float hash21(vec2 p){ return fract(sin(dot(p, vec2(111.71, 157.93)))*43758.5453); }

// IQ's 2D unsigned box formula.
float sBox(vec2 p, vec2 b){ return length(max(abs(p) - b, 0.)); }


// Based on the imagery produced, this is probably self explanatory: Partition
// space into grid cells, then randomly render lines within the cell to produce
// a character. It's take most people ten minutes to code, but it took me much
// longer... It always does. Sigh! :D

float ChChars(vec2 p){
    
    // The distance field value. Initiate it to the maximum.
    float d = 1.;
    
    // Line drawing probability threshold. If the unique ID of the line segment
    // exceeds this amount, render it.
    const float th = 1./3.;
    
    const float lw = .005;  // Line width -- Editable.
    const float sp = 2./9.; // Cell spacing -- Editable.
    // The individual line segment lengths: Exclude the cell edge spacing, then 
    // divide by 3. High school logic... that took me an embarassing amount of
    // time, due to the fact that the 4x4 horizontal lines and 4x4 vertical lines 
    // surround a "3x3" grid, and not a 4x4 one. It's not the first time I've made
    // that dumb mistake, and it won't be the last. :)
    const float ll = (1. - sp*2.)/3.;  
    
    // Unique character cell ID.
    vec2 ip = floor(p);
    
    // Local cell coordinates -- Edged out by the cell edge spacing.
    p -= ip + sp;
   
    // Iterate through all the possible combinations of lines segments
    // in both the horizontal and the vertical. By the way, if rounded
    // edges weren't a requirement, this wouldn't be necessary... and
    // there might be some clever way to do it without the loops, but
    // nothing immediately came to mind. Either way, there's no 3D 
    // involved, so the GPU will have no trouble with this at all.
    for(int j = 0; j<4; j++){
        for(int i = 0; i<4; i++){

            // Individual segment ID... I'm pretty sure that's right, but
            // I'd double check, just to make sure.
            vec2 ijp = ip*16. + vec2(i, j*4);

            float rndX= hash21(ijp); // Individual horizontal line ID.
            float rndY = hash21(ijp + .5); // Individual vertical line ID.

            // The line segment starting position. As we iterate throught the loop,
            // advance by the line length.
            vec2 q = p - vec2(i, j)*ll;

            // Draw the horizontal lines to the right of the first column.
            if(rndX>th && i>0){
               d = min(d, sBox(q + vec2(ll/2., 0), vec2(ll/2. + lw, lw)));
            }

            // Draw the vertical lines above the last row.
            if(rndY>th && j>0){
                d = min(d, sBox(q + vec2(0, ll/2.), vec2(lw, ll/2. + lw)));
            }  

        }
    }
    
    // Return the 2D distance field.
    return d;
    
    
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ){

     
    // Centered, scaled, aspect correct screen coordinates: Fabrice and I were lightly 
    // discussing this the other day. As Fabrice pointed out, the "fragCoord" term is 
    // already in aspect correct form, so you only need center it then scale (with an 
    // aspect preserving scalar or vector) to get it into the form you want. 
    //
    // Introducing an unnecessary stretching\squashing step then correcting it doesn't make
    // a lot of sense. In mathematical terms, both sides of the following do the same thing, 
    // but the right hand side is kind of absurd, unless obfuscation is the objective: :)
    //
    // (p - q)/s.y = vec2((p.x - q.x)*s.x/s.y, p.y - q.y)/s;
    //
    // Just for the record, it doesn't phase me how it's done, but more code than the
    // following hurts Fabrice's eyes. :D
    //
    vec2 uv = (fragCoord - iResolution.xy*.5)/iResolution.y;
    
    
    // Scaling and movement.
    vec2 p = uv*5. + vec2(0, .5) + vec2(1, 0)*iTime;
    
    // UV distortion to give the stokes a hand drawn vibe. Obviously, a lot more effort 
    // could be put into this, but it's just a basic example. I might work on this later, 
    // to get a wind swept paper look happening.
    //p += (vec2(n3D(vec3(p/2., iTime/2. + 1.)), n3D(vec3(p/2., iTime/2. + 1.37) )) - .5)*.1;
    p += (vec2(fbm(vec3(p, 1.), 2.5), fbm(vec3(p, 1.37), 2.5)) - .5)*.04;
    
    // The distance field to the grid full of pseudo characters.
    float d = ChChars(p);
    // The distance field for the corresponding shadow.
    float dSh = ChChars(p - vec2(1, -.8)*.1);
    
    // Distance field shade value. Not to be confused with the shadow above. :)
    float dShade = max(1. - d*16., 0.)*.04;
    
    // Set the background to a bland creme color, then mix in some subtle diagonal lines.
    vec3 col = vec3(.96, .92, .88);
    float pat = clamp(sin((p.x + p.y)*128.) + .0, 0., 1.);
    col = mix(col, vec3(0), pat*.1);
   
    // Apply the distance field to the canvas. Just a mild shadow and icon outline,
    // followed by black or red characters.
    
    // Set the character color to something dark.
    vec3 charCol = vec3(.03);
    // Using the individual character cell ID, "floor(p)," obtain a random number, then 
    // set the occasional character to red.
    if(hash21(floor(p))>.9) charCol = vec3(1, .03, .01);

    // Shadow (offset distance field), light character outline, and color layers.
    col = mix(col, vec3(0), (1. - smoothstep(0., .03, dSh - .06))*.25);
    col = mix(col, vec3(1), (1. - smoothstep(0., .02, d - .06))*.5);
    col = mix(col, charCol + dShade, 1. - smoothstep(0., .01, d - .04));
    
    
    // Just the field lines, for anyone interested.
    //col = vec3(1)*(clamp(cos(d*6.2831*8.) + .1, 0., 1.));
    
    /*
    // Show the grid border -- Kind of self explanatory, but the option's
    // there anyway. :)
    vec2 q = abs(fract(p) - .5);
    d = max(q.x, q.y) - .5 + .015;
    col = mix(col, vec3(0), smoothstep(0., .01, d + .02)*.8);
    col = mix(col, vec3(1), smoothstep(0., .005, d));
    */
    
    
    // Apply a tiny sprinkling of noise, just to break things up a little.
    float ns = fbm(vec3(p, 1), 64.);//n3D(vec3(p, 1)*64.)*.57 + n3D(vec3(p, 1)*128.)*.28 + n3D(vec3(p, 1)*256.)*.15;
    col *= ns*.25 + .8;
    
    // Positioning a mild spot light in the opposite direction of the shadow offset to give
    // a very subtle indication that something is causing the shadows.
    col *= max(1.2 - length(uv - vec2(-1, .8)*.3)*.35, 0.);


    // Rough gamma correction.
    fragColor = vec4(sqrt(max(col, 0.)), 1);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
