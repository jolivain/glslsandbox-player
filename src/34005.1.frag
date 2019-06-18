#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

bool inside_batman(float x, float y){
    float ax = abs(x);
    float ay = abs(y);
    
    // wings
    if (x*x/49. + y*y/9. - 1. <= 0. && ((ax >= 4. && -3.*sqrt(33.)/7. <= y && y <= 0.) || (ax >= 3. && y >= 0.))) return true;
    
    // lower middle
    float t = abs(ax - 2.) - 1.;
    t = (3.*sqrt(33.) - 7.)/-112.*x*x + 0.5*ax + sqrt(1. - t*t) - y - 3.;
    if (-3. <= y && y <= 0. && ax <= 4. && t <= 0.) return true;
    
    // head sides
    if (y >= 0. && 3./4. <= ax && ax <= 1. && -8.*ax - y + 9. >= 0.) return true;
    
    // ears
    if (0.5 <= ax && ax <= 3./4. && 3.*ax - y + 3./4. >= 0. && y >= 0.) return true;
    
    // head center
    if (ax <= .5 && y >= 0. && 9./4. - y >= 0.) return true;
    
    // shoulders
    float s = ax - 1.;
    s = -0.5*ax - 3./7.*sqrt(10.)*sqrt(4. - s*s) - y + 6./7.*sqrt(10.) + 3./2.;
    if (1. <= ax && ax <= 3. && y >= 0. && s >= 0.) return true;
    
    return false;
}

void main( void ) {

	vec2 p = gl_FragCoord.xy / resolution.xy * 2. - 1.;
	p.x *= resolution.x/resolution.y;
	p *= 6.0;
	p.y += sin(time)*0.1;
	
	vec4 color = vec4(0.0);
	if (!inside_batman(p.x, p.y) && length(p*0.7/vec2(7.0, 3.0)) < 1.0){
		color = vec4(1.0, 1.0, 0.0, 1.0);
	}
	
	gl_FragColor = color;

}
