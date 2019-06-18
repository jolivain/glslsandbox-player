#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

//Signal modulation techniques
//Input signal (no modulation)
//AM modulated
//FM modulated
//Pulse width modulated

float carrier = 48.0;

float tau = atan(1.0)*8.0;

vec2 scale = vec2(2, 8);

float distline(vec2 p0,vec2 p1,vec2 uv)
{
	vec2 dir = normalize(p1-p0);
	uv = (uv-p0) * mat2(dir.x,dir.y,-dir.y,dir.x);
	return distance(uv,clamp(uv,vec2(0),vec2(distance(p0,p1),0)));   
}

float signal(float x)
{
	return sin(tau*x*3.0 + time);
}

float fm(float carrier, float modulation, float x)
{
	float band = 2.0;
	return sin(tau * (x * carrier + modulation * band));
}

float am(float carrier, float modulation, float x)
{
	return sin(tau * x * carrier) * (modulation * 0.5 + 0.5);
}

float pwm(float carrier, float modulation, float x)
{
	return step(modulation * 0.5 + 0.5, mod(x * carrier, 1.0));
}

float f(float x, float mode)
{
	float sig = signal(x);
	
	if(mode == 3.0)
	{
		return sig;	
	}
	if(mode == 2.0)
	{
		return am(carrier, sig,x);
	}
	if(mode == 1.0)
	{
		return fm(carrier, sig,x);
	}
	if(mode == 0.0)
	{
		return pwm(carrier, sig,x);
	}
	return 0.0;
}

vec4 sample(vec4 sx, float mode)
{
	sx *= scale.x * 0.5;
	return vec4(f(sx.x, mode), f(sx.y, mode), f(sx.z, mode), f(sx.w, mode)) / scale.y * 0.5;
}

void main(void) 
{
	float rep = 1.0 / (resolution.x / 2.0);
	vec2 aspect = resolution.xy / resolution.y;
	vec2 uv = ( gl_FragCoord.xy / resolution.y );
	
	float mode = floor(uv.y / 0.25);
	
	uv.y = mod(uv.y, 0.25);
	uv.y -= aspect.y/8.0;
	
	float dist = 1e6;
	
	vec2 ruv = vec2(mod(uv.x, rep), uv.y);
	
	vec4 offs = vec4(-1, 0, 1, 2);
	vec4 sx = (offs * rep);
	vec4 sy = sample((offs + floor(uv.x / rep)) * rep, mode);
	
	vec2 p0 = vec2(sx.x, sy.x);
	vec2 p1 = vec2(sx.y, sy.y);
	vec2 p2 = vec2(sx.z, sy.z);
	vec2 p3 = vec2(sx.w, sy.w);
	
	dist = min(dist, distline(p0, p1, ruv));
	dist = min(dist, distline(p1, p2, ruv));
	dist = min(dist, distline(p2, p3, ruv));
	
	float lw = 1.5 / resolution.y;
	
	float color = smoothstep(lw, 0.0, dist);
		
	gl_FragColor = vec4( vec3( 0, color, 0 ), 1.0 );

}
