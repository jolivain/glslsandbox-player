#ifdef GL_ES
precision mediump float;
#endif

#define M_PI 3.1415926535897932384626433832795
uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float lim(float alpha) {
	// Simple 0.0 - 1.0 limiter
	return min(1.0, max(0.0, alpha));
}

float xpow(float val, float ex) {
	if (val < 0.0) {return .00;}
	return pow(val, ex);
}

void main( void ) {
	
	vec2 position = (gl_FragCoord.xy / resolution.xy) - 0.5;
	position.y *= resolution.y / resolution.x;

	// Config variables
	float mouthEdge = 0.2; // abs X coord where mouth corners are
	float lipWidth = 0.02; // Width of lips
	float openSize = sin(3.1415 * 0.5 * mouse.x); // how much the mouth is open 
	float cornerPull = mouse.y * 2.0 - 1.0; // +/- pull at the corners for smile/frown
	vec3 LipColor = vec3(0.6, 0.25, 0.2);
	vec3 MouthColor = vec3(0.25, 0.07, 0.1);	
	
	
	vec4 color=vec4(0.10, 0.2, 0.25,1.0);
	
	gl_FragColor = color;
	
	
	// Define edges
	float cpv = cornerPull * 0.1 * (1.0 - cos(abs(position.x) / mouthEdge)); // corner pull value, accounting for X coord
	float osv = openSize * 0.07 * cos(3.1415 * 0.47 * abs(position.x) / mouthEdge);
	float mouthT = cpv + osv; // Y coord of edge of top lip
	float mouthB = cpv - osv; // Y coord of edge of bottom lip
	float mouthFade = max(0.0, min(1.0, (abs(position.x) - (mouthEdge * 0.94)) * 50.0)); // Fade based on X coord past mouthEdge
	
	// Draw inner mouth
	float im = lim((position.y - mouthT) * 100.0);
	im = lim(im + lim((position.y - mouthB) * -100.0));
	im = lim(im + mouthFade); // Visibility between lips
	vec3 innerMouth = MouthColor * (0.5-position.y * 20.0); // Roof of mouth
	if (im < 1.0) {
		// Draw tongle
		float tongue = cos(abs(position.x) * 3.0 - 0.15) - 1.0 - openSize * 0.03;
		innerMouth = mix(MouthColor * 2.0, innerMouth, lim((position.y - tongue) * 100.0));
		
		// Draw teeth
		for (int t=0; t<5; t++) {
			float tx = (float(t) + 0.5) * 0.036;
			tx = lim(abs(abs(position.x) - tx) * 100.0 - 1.0);
			float tu = lim((-position.y + 0.04 + float(t) * 0.002) * 100.0);
			innerMouth = mix(vec3(0.7 - 0.05 * float(t)), innerMouth, lim(tx + tu));
			
			float tb = lim((position.y + 0.035 + openSize * 0.02 + float(t) * 0.002) * 100.0);
			innerMouth = mix(vec3(0.7 - 0.05 * float(t)), innerMouth, lim(tx + tb));
		}
	}
	gl_FragColor.rgb = mix(innerMouth, gl_FragColor.rgb, im);
	
	// Draw lower lip
	float BLip = lipWidth * xpow(sin(3.1415 * 0.5 * (1.0 - abs(position.x) / mouthEdge)), 0.55);
	BLip = lim((abs(position.y - mouthB + BLip) - BLip) * 300.0);
	gl_FragColor.rgb = mix(LipColor * 1.15, gl_FragColor.rgb, lim(BLip+mouthFade));

	// Draw upper lip
	float TLip = lipWidth * sin(3.1415 * 0.65 * (1.0 - abs(position.x) / mouthEdge));
	TLip = lim((abs(position.y - mouthT - TLip) - TLip) * 300.0);
	gl_FragColor.rgb = mix(LipColor * 0.8, gl_FragColor.rgb, lim(TLip+mouthFade));
	
	// Darken inner mouth lip edges
	gl_FragColor.rgb *= min(1.0, 0.5 + mouthFade + 500.0*abs(position.y - mouthT));
	gl_FragColor.rgb *= min(1.0, 0.5 + mouthFade + 500.0*abs(position.y - mouthB));
	
	
	
	

}
