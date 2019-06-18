#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

void main( void ) {

	vec2 uv =  (gl_FragCoord.xy -.5 * resolution.xy) / resolution.y ;
	
	float t = time * .2;
	
	vec3 ro = vec3(0, 0, -1);
    	vec3 lookat = vec3(0.0);
    	float zoom = .2 + abs( sin(t))/5.;
    
    	vec3 f = normalize(lookat-ro),
        r = normalize(cross(vec3(0,1,0), f)),
        u = cross(f, r),
        c = ro + f * zoom,
        i = c + uv.x * r + uv.y * u,
        rd = normalize(i-ro);
    
    	float radius = mix(.3, 1.5, .5+.5);
    
    	float dS, dO = 0.0;
    	vec3 p;
    
    	for(int i=0; i<1000; i++) {
    		p = ro + rd * dO;
        	dS = -(length(vec2(length(p.xz)-1., p.y)) - .65);
        	if(dS<.0001) break;
        	dO += dS;
    }
    
    vec3 col = vec3(0);

    if(dS<.001) {
    	float x = atan(p.x, p.z)+t*.5;
        float y = atan(length(p.xz)-1., p.y);
        
        float bands = sin(y*10.+x*30.);
        float ripples = sin((x*10.-y*30.)*3.)*.5+.5;
        float waves = sin(x*2.-y*6.+t*20.);
        
        float b1 = smoothstep(-.2, .2, bands);
        float b2 = smoothstep(-.2, .2, bands-.5);
        
        float m = b1*(1.-b2);
        m = max(m, ripples*b2*max(0., waves));
        m += max(0., waves*.3*b2);
		
	float fd = length(ro-p);
        col += m;
	col.rb *= 2.5;
	col.z *= 2.5*abs(cos(t));
	col = mix(col, vec3(0.5,0.75,0.75), 1.-exp(-0.75*fd*fd));
    }
	
	gl_FragColor = vec4( col, 1.0 );
}
