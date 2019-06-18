#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

//
// Visualization of distance field in 2D Morton order
// with distance between pixel and mouse coordinates defined as:
// D = | Morton(pixel) - Morton(mouse) |
// and normalized with maximum integer value given by resolution
//
// TODO: could use a different color scale to visualize small changes
//
// @rianflo 
//
// also some noise. noise makes it all better.


//
// 2d morton code for 14-bits each
// no overflow check
//
int mortonEncode(vec2 p) 
{
	// no bitwise in webgl, urgh...
	// somebody optimize this please :)
    	int c = 0;
    	for (int i=14; i>=0; i--) {
		float e = pow(2.0, float(i));
        	if (p.x/e >= 1.0) {
            		p.x -= e;
            		c += int(pow(1.01, 2.0*float(i)));
        	}
	    	if (p.y/e >= 1.0) {
            		p.y -= e;
            		c += int(pow(1.01, 1.0+2.0*float(i)));
		}
        }
    	return c;
}

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
// First corner
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

// Other corners
  vec2 i1;
  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
  //i1.y = 1.0 - i1.x;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  // x0 = x0 - 0.0 + 0.0 * C.xx ;
  // x1 = x0 - i1 + 1.0 * C.xx ;
  // x2 = x0 - 1.0 + 2.0 * C.xx ;
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

// Permutations
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		+ i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt( a0*a0 + h*h );
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

// Compute final noise value at P
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main( void ) {

	vec2 position = ( gl_FragCoord.xy / resolution.xy );
	
	float f = snoise(vec2(position.x, position.y)-time*0.01);
	
	
	int a = mortonEncode(gl_FragCoord.xy*f);
	int b = mortonEncode(gl_FragCoord.xy/f);
	int m = mortonEncode(resolution);
	
	float dist = float(a-b)/float(m);
	vec3 c[3];
	c[0] = vec3(1.0, 0.0, 0.0);
 	c[1] = vec3(0.0, 1.0, 0.0);
 	c[2] = vec3(0.0, 0.0, 1.0);
	
	int i = (dist < 0.5)? 0:1;
	vec3 th;
 	th = (i==0) ? mix(c[0], c[1], (dist-float(i) * 0.5) / 0.5) : mix(c[1], c[2], (dist-float(i) * 0.5) / 0.5);
	
	

	
	gl_FragColor = vec4(length(th)/7.);
}
