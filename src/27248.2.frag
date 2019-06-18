#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

vec3 squereTexture(vec2 uv, vec3 firstColor, vec3 secondColor) { // Flag texture
	if(bool(mod(floor(20.0 * uv.x), 2.0)) ^^ bool(mod(floor(20.0 * uv.y), 2.0))) // I made a true table and this is the result
		return secondColor;
	else
		return firstColor;
}

void main(){
	vec2 uv= gl_FragCoord.xy / resolution.xy; // Calculates UV screen coordinates
	vec2 mousePos = mouse;
	vec3 colorA = vec3(0.467, 0.161, 0.325);
	vec3 colorB = vec3(0.867, 0.282, 0.078);
	float radio = 0.2;
	
	uv.y *= resolution.y / resolution.x;
	mousePos.y *= resolution.y / resolution.x;
	
	if(length(uv - mousePos) <= radio) { // Fish eye effect!!
		float newLength;
		
		uv -= mousePos;
		newLength = pow(length(uv) / radio, 0.5) * length(uv);
		uv /= length(uv);
		uv *= newLength;
		uv += mousePos;
	}
	
	gl_FragColor = vec4(squereTexture(uv, colorA, colorB), 1.0); // Painting flag!
}
