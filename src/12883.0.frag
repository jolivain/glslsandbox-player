#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 resolution;

void main( void ) {

	vec2 position = gl_FragCoord.xy / resolution.yy;

	float walls = clamp(1.5-abs(position.y - 0.3)*100.,0.,1.);
	walls += clamp(1.5-abs(position.y - 0.34)*100.,0.,1.);
	walls += clamp(1.5-abs(position.y - 0.66)*100.,0.,1.);
	walls += clamp(1.5-abs(position.y - 0.7)*100.,0.,1.);

	vec2 pill;
	pill.x = mod(position.x + time,1./4.) - 0.125;
	pill.y = position.y - 0.5;
	float pillrad = 0.03;
	float pillbody = clamp( (pillrad - length( pill ) ) * 400.,0.,1.);
	pillbody *= (position.x < 0.5) ? 0. : 1.;

	vec2 pacCtr = vec2( 0.5,0.5 );
	float pacRad = 0.1;
	vec4 pacColor = vec4(1,1,0,0);
	float pacBody = clamp( ( pacRad - length(position - pacCtr) ) * 500.0, 0., 1.);
	float pacMouthAng = 1. - sin( (time * 8. ) * 3.1415926535) * 0.25 - 0.25;
	vec2 pm1 = vec2( sin( pacMouthAng ), cos( pacMouthAng ) ) * 0.5;
	float pacMouth = dot((position - pacCtr), pm1 ) / 100.;
	pacMouth = dot(normalize(position - pacCtr), normalize( vec2(1.,0.) ) ) > pacMouthAng ? 1. : 0.;
	vec4 pac = clamp( pacColor * pacBody - pacMouth, 0., 1. );

	gl_FragColor = pac + vec4(0.,0.,walls,1.) + (1.- pac.x) * vec4(pillbody,pillbody,pillbody,0);
}

