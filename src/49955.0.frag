/*
 * Original shader from: https://www.shadertoy.com/view/4l3fzS
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
// Infinite zoom on morphing tiles.
// Recreation of a bees & bombs animation
// https://beesandbombs.tumblr.com/post/179092048114/grids

#define Pi     3.14159265359
#define Tau    6.28318530718
#define Rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))
#define Rot45  Rot(Pi/4.0)


#define TileCount 7.0
#define Duration 6.0


// IQ’s Exact signed distance of a rectangle
float RectangleSd(vec2 p, float size)
{
    vec2 d = abs(p)-vec2(size);
    return length(max(d, vec2(0))) + min(max(d.x, d.y), 0.0);
}


float Phase(vec2 uvi, vec2 uvf, float t)
{
    vec2 uv = (uvi + vec2(0.5))/TileCount + (uvf+1.0)/(2.0*TileCount);
    return smoothstep(0.6, 0.0, (atan(-uv.x, -uv.y) + Pi)/Tau-1.6*t+0.6);
}


float Tile(vec2 uv, vec2 uvi, float eps, float t, float zoom)
{
    // Square:
    float sq = RectangleSd(uv, 1.0);
   
    // Corner diamonds:
    float cdt = min(t, 0.75)/0.75;
    float cds = sqrt(2.0*0.5*0.5);
    float cd = RectangleSd(Rot45*(uv-vec2(-1.,-1.)), cds*Phase(uvi,vec2(-1.,-1.),cdt));
    cd = min(  RectangleSd(Rot45*(uv-vec2( 1.,-1.)), cds*Phase(uvi,vec2( 1.,-1.),cdt)), cd);
    cd = min(  RectangleSd(Rot45*(uv-vec2( 1., 1.)), cds*Phase(uvi,vec2( 1., 1.),cdt)), cd);
    cd = min(  RectangleSd(Rot45*(uv-vec2(-1., 1.)), cds*Phase(uvi,vec2(-1., 1.),cdt)), cd);

    // Side squares:
    float sst = max(t-0.25, 0.0)/0.75;
    float sss = 0.5;
    float ss = RectangleSd(uv-vec2(-1., 0.), sss*Phase(uvi,vec2(-1., 0.),sst));
    ss = min(  RectangleSd(uv-vec2( 1., 0.), sss*Phase(uvi,vec2( 1., 0.),sst)), ss);
    ss = min(  RectangleSd(uv-vec2( 0., 1.), sss*Phase(uvi,vec2( 0., 1.),sst)), ss);
    ss = min(  RectangleSd(uv-vec2( 0.,-1.), sss*Phase(uvi,vec2( 0.,-1.),sst)), ss);
    
    // Combine:
    float sd = sq;
    sd = min(max(sd, -cd), cd);
    sd = min(max(sd, -ss), ss);
 
    // Stroke:
    float width = 14.0/(zoom*450.0);
    return smoothstep(width, (width+eps), abs(sd));
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized coordinates:
    float eps = 1.0/iResolution.y;
    vec2  uv  = eps*(fragCoord - 0.5*iResolution.xy);
	float t   = fract(iTime / Duration);

    // Zoom:
    float zoom = pow(2.0, t);
    uv /= zoom;
    eps /= zoom;
    
    // Tiling:
    vec2 uvf, uvi;
    uv = uv*TileCount - vec2(0.5);
    uvi = floor(uv);
    uvf = 2.0*fract(uv)-1.0;
    eps *= 2.0*TileCount;

    // Render tile:
    float c = 0.95*Tile(uvf, uvi, eps, fract(t), zoom);
    
    // Output to screen
    fragColor = vec4(vec3(pow(c,0.45)),1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
