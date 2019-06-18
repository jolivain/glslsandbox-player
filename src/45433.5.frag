#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;


float Line(vec2 fragCoord, vec2 loc, float angle, float thickness)
{
	//soh,cah,toa
	vec2 lineDir = vec2(cos(angle),sin(angle));
	vec2 toFrag = fragCoord - loc;
	
	vec2 lineLoc = loc + ( lineDir * dot(lineDir,toFrag));
	
	float lengthToLineLoc = length(fragCoord - lineLoc);
	
	
	float line = pow(1.0 - lengthToLineLoc , 1200.0 * (1.0/thickness));
	
	
	return line;
}

void main( void ) {

	vec2 pos = ( gl_FragCoord.xy / resolution.x );
	float ratio =resolution.y/resolution.x; 
	float halfY = 0.5 * ratio;
	
	vec4 lines = vec4(0.0);
	
	for( float f = 0.0; f < 7.0; f += 1.0)
	{
		float tfrac = abs(sin(cos(time * 0.05)));
		float y = (halfY * 0.5)  + (f * f * 0.006);
		float x = 0.5 + (sin(time * 0.2) * 0.1 * f);
		float ft = f + (time);
		float wavefreq = sin(ft) * 0.06;
		float waveDir = wavefreq/abs(wavefreq);
		float wave =  abs(wavefreq) * waveDir;
		
		
		vec3 fLines = vec3(0.0);
		fLines.x += mod(f,3.0);
		fLines.y += mod(f+1.0,3.0);
		fLines.z += mod(f+2.0,3.2);
		
		fLines *= 0.8;
		
		float l = Line(pos,vec2(x,y),wave,1.0 + (f * 0.1 ));
		
		lines += fLines.xyzz * l;
	}

	gl_FragColor = lines;

}
