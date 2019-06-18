#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

#define MAX_ITER 20.0

mat3 rotationMatrix(vec3 axis, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat3(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c);
}


float DE(vec3 z){
	z = rotationMatrix(normalize(vec3(1.0, 1.0, 0.)), time/10.) * z;
	    float r;

	//    float s = 2. + sin(time)/2. + (texture2D(audio_time, vec2(length(z)/3., 0.0)).a - 0.5)/2.;
	    int iter = 0;
	float s = 2.0;
	    for( int n = 0 ; n < 10; n ++ ) { 
	       if(z.x+z.y<0.) z.xy = -z.yx; // fold 1
	       if(z.x+z.z<0.) z.xz = -z.zx; // fold 2
	       if(z.y+z.z<0.) z.zy = -z.yz; // fold 3	
	       z = z*s - 1.*(s-1.0);
	       iter++;
	    }

	    return (length(z) ) * pow(s, -float(iter));
}


vec3 gradient(vec3 p) {
	vec2 e = vec2(0., 0.01);

	return normalize( 
		vec3(
			DE(p+e.yxx) - DE(p-e.yxx),
			DE(p+e.xyx) - DE(p-e.xyx),
			DE(p+e.xxy) - DE(p-e.xxy)
		)
	);
}			
void main( void ) {
	
	vec2 uv = 2. * ((gl_FragCoord.xy ) / resolution  - 0.5);

	
 	vec3 camera = vec3(0.,0.,-2.);
	vec3 point;
	bool hit = false;
	float thresh = 0.01;
	vec3 ray = normalize( vec3(uv , 1.0) );
	
	// raycasting parameter
 	float t = 0.;
 	float iter = 0.;

	for(float i = 0.0; i < MAX_ITER; i++) {

		point = camera + ray * t;
		float dist = DE(point);
	
		if (abs(dist) < thresh)
		    break;
		
		t += dist;
		iter ++;
	    }
	float shade = dot(ray, -gradient(point));
	vec3 color = vec3(1., 0., 1.)* shade;
	// // vignette
	color *= (1. - length(uv));
	color *= exp(1. - (abs(point.z - camera.z)));
	color *= exp(iter/MAX_ITER);
	
	gl_FragColor = vec4(color, 1.0 );

}
