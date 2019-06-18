// Cross-platform workarounds.
// ------------------------------------------------------------------------------------

//#define SHADERTOY
#define GLSLSANDBOX

// ShaderToy defines this itself, but not all sandboxes do.
#ifndef SHADERTOY
	#ifdef GL_ES
	precision mediump float;
	#endif
#endif

// Almost all GLSL sandboxes include a resolution uniform, but they're all named differently
// and have different things in the axes.  This should always return the width/height of the
// display in pixels as a vec2.
#ifdef SHADERTOY 
	#define RESOLUTION iResolution.xy 
#endif
#ifdef GLSLSANDBOX
	uniform vec2 resolution;
	#define RESOLUTION resolution
#endif

// Almost all GLSL sandboxes include a time uniform, but they're all named differently.
// This should always return the time since the start of the animation, in seconds.
#ifdef SHADERTOY 
	#define TIME iGlobalTime
#endif
#ifdef GLSLSANDBOX
	uniform float time;
	#define TIME time
#endif

// Some GLSL sandboxes don't allow direct access to gl_FragCoord, so it can be aliased here.
#ifdef SHADERTOY
	#define FRAGCOORD fragCoord
#else
	#define FRAGCOORD gl_FragCoord.xy
#endif

// Some GLSL sandboxes don't allow direct access to gl_FragColor, so it can be aliased here.
#ifdef SHADERTOY
	#define FRAGCOLOR fragColor
#else
	#define FRAGCOLOR gl_FragColor
#endif

// Misc. tools.
// ------------------------------------------------------------------------------------

// IE11 has problems with 1.0/0.0.
#define INFINITY 10000.0

// Returns the location of the current fragment relative to the center of the screen, where 0.5 is the distance to the nearest screen border.
// This will return values > +-0.5 on the X axis in widescreen, and the Y axis in portrait.
#define PixelCoord ((FRAGCOORD - (RESOLUTION / 2.0)) / min(RESOLUTION.x, RESOLUTION.y))

// Lenses.
// ------------------------------------------------------------------------------------
// Lenses generate a ray for the current pixel, storing where it starts in "rayStart",
// and a normal along which it points in "rayNormal".

// A very simplistic, not in any way accurate or "true" lens.  FieldOfView can be any positive value.
#define SimpleLens(fieldOfView) { rayStart = vec3(0.0); vec2 coord = PixelCoord; rayNormal = normalize(vec3(coord.x / fieldOfView, 1.0, coord.y / fieldOfView)); }

// Surfaces.
// ------------------------------------------------------------------------------------
// These are raytraceable surfaces, reading from rayStart and rayNormal to find the
// distance along that ray to the surface.  (calling ApplySurface to store it in "nearest") 
//
// They are not themselves rendered.
//
// When rendering lights, this position is used instead of the closest point on the ray
// to the light origin if it is closer to the start of the ray.
// Write to "nearest" if you are closer than the value already there.

// Given the distance to a surface, first checks it is not behind the camera, then that it is
// closer than what is already stored in "nearest" and overwrites it if so.
#define ApplySurface(dist, pattern) { float _dist = dist; vec3 intersection = rayStart + rayNormal * _dist; if(_dist > 0.0 && _dist < nearest && pattern) nearest = _dist; }

// Given a lowercase axis (x/y/z) and a (float) location on that axis, draws an infinitely 
// large plane there.
#define AxisSurface(axis, location, pattern) ApplySurface((location - rayStart.axis) / rayNormal.axis, pattern)

// Given a (vec3) location and a (float) radius, draws a sphere at that location of that size.
#define SphereSurface(location, radius, pattern) { vec3 _location = location; float along = dot(_location - rayStart, rayNormal); float dist = distance(_location, rayStart + rayNormal * along); float _radius = radius; if(dist < _radius) { ApplySurface(along - (_radius * sin(acos(dist / _radius))), pattern) } }

vec3 ClosestTimeOfApproach(vec3 pos1, vec3 vel1, vec3 pos2, vec3 vel2)
{
    // There's probably much better ways to calculate this, but I'm not very good at maths, so here's my approach:
    // A slice of the target line is a point, so if we project the start/end as though we're looking right down the ray,
    // we can clearly see where the closest point is.2
    vec3 projStart = pos2 - (vel1 * dot(pos2 - pos1, vel1));
    vec3 projEnd = vel2 - (vel1 * dot(vel2 - pos1, vel1));
    vec3 projNorm = normalize(projEnd - projStart);
  
    float along = dot(pos1 - projStart, projNorm);
    vec3 closest = mix(pos2, vel2, clamp(along / distance(projStart, projEnd), 0.0, 1.0));
    return closest;
}

// Given the (vec3) location of the start and end of a capsule and a (float) radius, draws a capsule
// between those locations of that size.  Essentially a cylinder between those locations capped with
// a sphere; protrudes beyond start/end by radius.
#define CapsuleSurface(start, end, radius, pattern) { SphereSurface( ClosestTimeOfApproach(rayStart, rayNormal, start, end), radius, pattern ) }

// Patterns.
// ------------------------------------------------------------------------------------
// These are functions which define where on a surface is solid, and where is not.
// They typically take the intersected point (intersection) and return true to make the surface solid.

// Always solid.
#define SolidPattern true

// Never solid.
#define NonSolidPattern false

// Given a lowercase axis (x/y/z), a (float) location on that axis and two patterns, one pattern is shown 
// on one side of a plane on that axis at that location, and on the other side, the other pattern.
#define AxisPattern(axis, location, negativePattern, positivePattern) (intersection.axis > location ? positivePattern : negativePattern)

// Given a spacing between each circle, a radius for each circle and two patterns, one pattern is shown
// inside a repeating grid of circles while the other is shown outside the circles.
#define CirclePattern(spacing, radius, insidePattern, outsidePattern)

// Given a (float) spacing between each stripe, a (float) width for the stripes and two patterns, 
// diagonal stripes are drawn with one pattern used on the stripes and the other used off the stripes.
#define StripePattern(spacing, width, onPattern, offPattern)

// Lights.
// ------------------------------------------------------------------------------------
// False volumetric lights computed by taking the closest point to the origin along the ray
// and then computing the distance/etc. to the origin.  This gives a nice misty looking light.
// 
// Each light is built in the following steps:
// - An Origin function.  This determines the distance along the ray to the nearest point to the 
//   light (stored in "origin"), storing it in "originAlong".  These call common code to reset 
//   "intensity" to 1.0 and compute "originNearest", the closest point on the ray to the light origin.
// - One or more Falloff functions.  These use the origin data to determine a coefficient (rolloff
//   over distance, etc.) and multiply "intensity" by it.
// - A call to Shade to color the light and store it in an accumulator.

// Applies the current light, multiplying it by a color and saving it to the display.
#define Shade(color) { accumulator += intensity * color; }

// Resets the intensity of the light so its origin can be reused.
#define ResetFalloff { intensity = 1.0; }

// Called by every origin to setup common data.
#define SetupOrigin { intensity = 1.0; if(originAlong < 0.0 || originAlong > nearest) { originAlong = nearest; } originNearest = rayStart + rayNormal * originAlong; }

// Origins.
// ---------------------------------

// Given a location, creates a radial light from that location.
#define RadialOrigin(location) { origin = location; originAlong = dot(origin - rayStart, rayNormal); SetupOrigin }

// Given a lowercase axis (x/y/z) and a (float) location on that axis, creates a light emitted from
// an infinite plane there.
#define AxisOrigin(axis, location)

// Falloffs.
// ---------------------------------

// The light gets darker the further we are from the origin.  Larger rates fall off quicker.
// Linearity is the power of the falloff; 1.0 is linear, 2.0 is inverse square, 3.0 is inverse cube, etc.
#define DistanceFalloff(rate, linearity) { intensity /= pow(1.0 + distance(origin, originNearest) * rate, linearity); }

// The light gets darker the further off a (vec3) normal we are from the origin.
// Linearity is the power of the falloff; 1.0 is linear, 2.0 is inverse square, 3.0 is inverse cube, etc.
// Note that because we sample the closest point to the origin of the light, on point lights
// pointing at or away from the camera the spot is infinitely small so the light disappears.
#define DirectionalFalloff(normal, linearity) { intensity *= pow(max(0.0, dot(normal, normalize(originNearest - origin))), linearity); }

vec3 rotateX(vec3 transform, float angle) {
    mat3 mat = mat3(1.0, 0.0, 0.0, 0.0, cos(angle), -sin(angle), 0.0, sin(angle), cos(angle));
    return transform * mat;
}

vec3 rotateY(vec3 transform, float angle) {
    mat3 mat = mat3(cos(angle), 0.0, -sin(angle), 0.0, 1.0, 0.0, sin(angle), 0.0, cos(angle));
    return transform * mat;
}

vec3 rotateZ(vec3 transform, float angle) {
    mat3 mat = mat3(cos(angle), -sin(angle), 0.0, sin(angle), cos(angle), 0.0, 0.0, 0.0, 1.0);
    return transform * mat;
}


// Post-processes.
// ------------------------------------------------------------------------------------
// These modify the color stored in "accumulator".

// This where main() should be.
// However, some GLSL sandboxes don't allow you to define main() yourself.
#ifdef SHADERTOY
	void mainImage( out vec4 fragColor, in vec2 fragCoord )
#else
    void main()
#endif
{
    vec3 rayStart, rayNormal;
    
    float nearest = INFINITY;
    
    vec3 origin, originNearest;
    float originAlong;
    
    vec3 accumulator = vec3(0.0);
    float intensity;    
    
    // Start of generated code.
    SimpleLens(1.0)
        
    
     rayStart.x += 5.9;
    rayStart.y -= 14.4;
        rayStart.z += 1.6;
    
    rayNormal = rotateZ(rotateX(rayNormal, sin(TIME * 0.4) * 0.1), 0.5 + sin(TIME * 0.5) * 0.1);
    
    // Render surfaces.
    
    // Road
    AxisSurface(z, 0.0, SolidPattern)
        
    // Sidewalk top.
        AxisSurface(z, 0.1, 
                    // Left.
                    AxisPattern(x, -3.0, SolidPattern, 
                                // Right
                               AxisPattern(x, 3.0, NonSolidPattern, SolidPattern)
                   ))
        
    // Sidewalk left curb.
        AxisSurface(x, -3.0, AxisPattern(z, 0.1, SolidPattern, NonSolidPattern))
        
    // Sidewalk right curb.
        AxisSurface(x, 3.0, AxisPattern(z, 0.1, SolidPattern, NonSolidPattern)) 
       
        //Streelights.
        
        CapsuleSurface(vec3(-4.425, 8.0, 0.1), vec3(-4.425, 8.0, 1.0), 0.25, SolidPattern)
        CapsuleSurface(vec3(-4.425, 8.0, 1.0), vec3(-4.425, 8.0, 5.255), 0.125, SolidPattern)
        CapsuleSurface(vec3(-2.8, 8.0, 5.225), vec3(-4.425, 8.0, 5.225), 0.125, SolidPattern)
        
        CapsuleSurface(vec3(4.425, -2.0, 0.1), vec3(4.425, -2.0, 1.0), 0.25, SolidPattern)
        CapsuleSurface(vec3(4.425, -2.0, 1.0), vec3(4.425, -2.0, 5.255), 0.125, SolidPattern)
        CapsuleSurface(vec3(2.8, -2.0, 5.225), vec3(4.425, -2.0, 5.225), 0.125, SolidPattern) 
        
               CapsuleSurface(vec3(4.425, 18.0, 0.1), vec3(4.425, 18.0, 1.0), 0.25, SolidPattern)
        CapsuleSurface(vec3(4.425, 18.0, 1.0), vec3(4.425, 18.0, 5.255), 0.125, SolidPattern)
        CapsuleSurface(vec3(2.8, 18.0, 5.225), vec3(4.425, 18.0, 5.225), 0.125, SolidPattern)  
        
        CapsuleSurface(vec3(-4.425, -12.0, 0.1), vec3(-4.425, -12.0, 1.0), 0.25, SolidPattern)
        CapsuleSurface(vec3(-4.425, -12.0, 1.0), vec3(-4.425, -12.0, 5.255), 0.125, SolidPattern)
        CapsuleSurface(vec3(-2.8, -12.0, 5.225), vec3(-4.425, -12.0, 5.225), 0.125, SolidPattern)        
        
        CapsuleSurface(vec3(-4.425, 28.0, 0.1), vec3(-4.425, 28.0, 1.0), 0.25, SolidPattern)
        CapsuleSurface(vec3(-4.425, 28.0, 1.0), vec3(-4.425, 28.0, 5.255), 0.125, SolidPattern)
        CapsuleSurface(vec3(-2.8, 28.0, 5.225), vec3(-4.425, 28.0, 5.225), 0.125, SolidPattern)         
        
    // Bridge underside.
        AxisSurface(z, 5.5, AxisPattern(y, 3.4, NonSolidPattern, AxisPattern(y, 28.2, SolidPattern, NonSolidPattern)));
        
    // Bridge front.
    	AxisSurface(y, 3.4, AxisPattern(z, 5.5, NonSolidPattern, AxisPattern(z, 8.4, SolidPattern, NonSolidPattern)))
    
    // Bridge lights.
            CapsuleSurface(vec3(22.5, 10.0, 13.175), vec3(22.5, 5.6, 12.175), 0.125, SolidPattern)
            CapsuleSurface(vec3(22.5, 5.6, 7.3), vec3(22.5, 5.6, 12.0), 0.25, SolidPattern)
            
            CapsuleSurface(vec3(-7.5, 10.0, 13.175), vec3(-7.5, 5.6, 12.175), 0.125, SolidPattern)
            CapsuleSurface(vec3(-7.5, 5.6, 7.3), vec3(-7.5, 5.6, 12.0), 0.25, SolidPattern)            
            
     // Bridge supports.
            CapsuleSurface(vec3(12.5, 9.2, 4.8), vec3(12.5, 9.2, -1.75), 2.0, SolidPattern)
            CapsuleSurface(vec3(12.5, 22.40618, 4.8), vec3(12.5, 22.40618, -1.75), 2.0, SolidPattern)
            
            CapsuleSurface(vec3(-17.5, 9.2, 4.8), vec3(-17.5, 9.2, -1.75), 2.0, SolidPattern)
            CapsuleSurface(vec3(-17.5, 22.40618, 4.8), vec3(-17.5, 22.40618, -1.75), 2.0, SolidPattern)            
            
            CapsuleSurface(vec3(-47.5, 9.2, 4.8), vec3(-47.5, 9.2, -1.75), 2.0, SolidPattern)
            CapsuleSurface(vec3(-47.5, 22.40618, 4.8), vec3(-47.5, 22.40618, -1.75), 2.0, SolidPattern)   
            
            CapsuleSurface(vec3(-77.5, 9.2, 4.8), vec3(-77.5, 9.2, -1.75), 2.0, SolidPattern)
            CapsuleSurface(vec3(-77.5, 22.40618, 4.8), vec3(-77.5, 22.40618, -1.75), 2.0, SolidPattern)                        
            
            // Distant buildings.
            /*
            AxisSurface(y, 115.0, AxisPattern(x, -58.7668, NonSolidPattern, AxisPattern(x, -37.55514, SolidPattern, NonSolidPattern)))
            AxisSurface(x, -37.55514, AxisPattern(y, 115.0, NonSolidPattern, SolidPattern))
            
            AxisSurface(y, 123.14195, AxisPattern(x, -30.41511, NonSolidPattern, AxisPattern(x, -9.20345, SolidPattern, NonSolidPattern)))
            AxisSurface(x, -30.41511, AxisPattern(y, 123.14195, NonSolidPattern, SolidPattern))
            */
    // Render lights.
        #define Rain(size, speed, strength) { intensity *= dot(mix(vec3(strength), vec3(1.0), sin(sin(size * originNearest + TIME * speed) + TIME)), vec3(1.0)); }
    #define StreetLight DistanceFalloff(1.2, 2.0) DirectionalFalloff(vec3(0.0, 0.0, -1.0), 2.0) Rain(0.5, vec3(1.0, 5.0, 8.0), 0.7) Shade(vec3(1.0, 1.0, 0.6))   
    RadialOrigin(vec3(-2.8, -12.0, 5.225)) StreetLight    
    RadialOrigin(vec3(2.8, -2.0, 5.225)) StreetLight    
    RadialOrigin(vec3(-2.8, 8.0, 5.225)) StreetLight    
    RadialOrigin(vec3(2.8, 18.0, 5.225)) StreetLight    
    RadialOrigin(vec3(-2.8, 28.0, 5.225)) StreetLight   
            
    #define OverpassLight DistanceFalloff(1.2, 2.0) Rain(0.5, vec3(1.0, 5.0, 8.0), 0.7) Shade(vec3(0.8, 0.4, 0.1))   
            // Closest side of overpass.
    RadialOrigin(vec3(22.5, 10.0, 13.05)) OverpassLight              
            RadialOrigin(vec3(-7.5, 10.0, 13.05)) OverpassLight              
            RadialOrigin(vec3(-47.5, 10.0, 13.05)) OverpassLight              
        
            // Furthest side of overpass.
          RadialOrigin(vec3(37.5, 21.6, 13.05)) OverpassLight    
            RadialOrigin(vec3(7.5, 21.6, 13.05)) OverpassLight    
			RadialOrigin(vec3(-22.5, 21.6, 13.05)) OverpassLight    
            RadialOrigin(vec3(-52.5, 21.6, 13.05)) OverpassLight    
            /*
            // Lights between the distant buildings.
            #define DistantLight(color) DistanceFalloff(1.0, 2.0) Shade(color)
            
            RadialOrigin(vec3(-64.3834, 115.0, 1.0)) DistantLight(vec3(0.4, 0.3, 0.0))
            RadialOrigin(vec3(-35.0, 135.0, 4.0)) DistantLight(vec3(0.5, 0.3, 0.0))
            RadialOrigin(vec3(-8.0, 150.0, 3.0)) DistantLight(vec3(0.2, 0.1, 0.05))
            */
            // A big dim light to help separate things a little.
            RadialOrigin(vec3(-38.96571, 58.15232, 20.55807)) DistanceFalloff(2.0, 1.0) Shade(vec3(0.0, 0.0, 1.0))
            
    // Sky
        if(nearest == INFINITY) {
            //accumulator += vec3(0.02, 0.018, 0.005);
        }
        
    // End of generated code.
    
    // Gamma correct and wrap for GLSL.
	FRAGCOLOR = vec4(pow(accumulator, vec3(1.0 / 2.2)),1.0);
}
