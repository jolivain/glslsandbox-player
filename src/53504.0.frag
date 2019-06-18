/*
 * Original shader from: https://www.shadertoy.com/view/XscBzr
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
const float fPi = 3.14159;
const float fSmile = 0.0;	// 1.0 for a smiling bean

float DistanceP(vec2 p, vec2 segA, vec2 segB)
{
    	vec2 p2 = vec2(segB.x - segA.x,segB.y - segA.y);
    	float num = p2.x * p2.x + p2.y * p2.y;
    	float u = ((p.x - segA.x) * p2.x + (p.y - segA.y) * p2.y) / num;

    	if (u > 1.0 ) {
    		u = 1.0;
    	}
    	else if (u < 0.0) {
    		u = 0.0;
    	}

    	float x = segA.x + u * p2.x;
    	float y = segA.y + u * p2.y;

    	float dx = x - p.x;
    	float dy = y - p.y;

    	return sqrt(dx*dx + dy*dy);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    
    vec2 pMid = vec2(-2.5, -1.5) + uv * vec2(5.0, 3.0);
    float fTime = iTime + 25.0;

    	float distMid = DistanceP(pMid, vec2(0.0, -0.5), vec2(0.0, 0.5));
	
	
	float beanForm = distMid * (1.0 - 0.17 * abs(cos(2.0 + pMid.y * 3.1)));
	
	beanForm *= 1.0 - 0.1 * max(0.0, sin(fTime * 2.1)) * max(0.0, sin(-pMid.y * fPi + 0.5)); //clamp(-pMid.y * 3.0, 0.0, 1.0);
	
	float fBean = smoothstep(-0.4, -0.35, -beanForm);
	float fBeanSoft = smoothstep(-0.4, -0.3, -beanForm);
	float fBeanSuperSoft = smoothstep(-0.4, 0.05, -beanForm);
	
	// Augen
	vec2 v2Eyes = vec2(abs(pMid.x), pMid.y); 
	
	vec2 v2LookTo = 0.03 * vec2(sin(pMid.x * 3.7 + fTime * 0.91), 
								sin(pMid.x * 4.2 + fTime * 1.03));
	
	float fPupiDist = length(v2Eyes - vec2(0.175, 0.32) + v2LookTo);
	
	vec2 v2Blink = vec2(1.0, 1.0 + 12.0 * (max(0.0, 3.0 * sin(fTime * 1.7) - 2.9)));
	float fEyeDist = length(v2Blink * (v2Eyes - vec2(0.175, 0.32)));
	float fEyesBorder = smoothstep(-0.17, -0.16, -fEyeDist);
	float fEyes = smoothstep(-0.16, -0.12, -fEyeDist);
	
	float fPupi = smoothstep(-0.08, -0.06, -fPupiDist);
	vec3 colEye = mix(vec3(0.0), vec3(1.0) * (1.0 - fPupi), fEyes);
	fEyes = max(fEyes, fEyesBorder);
	
	
	// Mund
	float fMouth = smoothstep(-0.03, -0.005, -abs(pMid.y + (0.1 - 0.27 * fSmile) * (1.0 - cos(pMid.x * fPi * 0.8))));
	//fMouth = max(fMouth, clamp(fValue - 0.5, 0.0, 1.0) * 2.0 * smoothstep(-0.11, -0.07, -length(pMid * vec2(0.3, 1.0))));
	fMouth = fMouth * fBeanSuperSoft;
	
	// Helm
	float fHelmet = smoothstep(-0.5, -0.4, -beanForm);
	fHelmet = clamp((fHelmet - 
					 min(fBeanSoft, fBeanSoft * (-pMid.y * 3.0 + 3.2)))  // Bohnenkopf nicht bedecken, ganz oben einen Streifen lassen
					 * max(0.0, (pMid.y - 0.05) * 7.5), 0.0, 1.0);		 // Helm ist nur am Kopf
	
	fHelmet += 0.5 * fHelmet * max(0.0, cos(abs(pMid.y * fPi)) - fBean); // Lichteffekt
	
	// Engine
	// 1) Grundform
	float fEngine = (  0.15 + -pMid.y * 0.8 - abs(pMid.x) * 1.4  	// shape
					 + 0.2 * (1.0 - cos(pMid.x * 4.6)))				// swing
					* smoothstep(-0.75, -0.7, pMid.y + 0.15);		// Bottom

	fEngine *= 5.0;		// mehr Kontur
	fEngine = smoothstep(0.7, 1.0, fEngine);
	
	// 2) dasselbe nochmal etwas niedriger (y-Achse)
	float fEngineBottom = (-0.4 + -pMid.y * 1.2 - abs(pMid.x) * 1.25  	
						   + 0.2 * (1.0 - cos(pMid.x * 4.3)))
						   ;	
	fEngineBottom *= 5.0;
	fEngineBottom = smoothstep(0.7, 1.0, fEngineBottom);	
	
	// 3) und extrahieren für die endgültige Form
	fEngine = fEngine - fEngineBottom;
	
	// 4) nochmal die Engine für die Kante:
	fEngine = 	fEngine * 1.2 - fEngine * 
				0.4 * smoothstep(0.7, 1.0,
				(5.75 * (0.05 + -pMid.y * 0.8 - abs(pMid.x) * 1.4
				+ 0.2 * (1.0 - cos(pMid.x * 4.6)))));
	fEngine = clamp(fEngine, 0.0, 1.0);
	
	// 5) Fertig, noch die Bohne bevorzugen:
	fEngine = clamp(fEngine - fBeanSoft, 0.0, 1.0);
	
	
	// alle Farben addieren:
	vec3 col1 = vec3(0.85, 0.2, 0.2) * (0.8 * fBean + 0.4 * fBeanSuperSoft);
	col1 += vec3(0.85, 0.65, 0.25) * fHelmet;
	col1 += vec3(0.85, 0.65, 0.25) * fEngine * 1.2;
	col1 = mix(col1, colEye, fEyes);
	col1 = mix(col1, vec3(0.0), fMouth);
	
    // background
	col1 = mix(vec3(0.2, 0.3, 0.6), col1, fBean + fHelmet + fEngine);
	fragColor = vec4(col1, 1.0);

}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
