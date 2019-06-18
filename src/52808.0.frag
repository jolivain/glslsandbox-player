/*
 * Original shader from: https://www.shadertoy.com/view/Wd23Wc
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);

// --------[ Original ShaderToy begins here ]---------- //
#define WATER_LEVEL 0.075			// from -0.2 to 0.2
#define RAIN_INTENSITY 1.0
#define RAIN_DROPS_SIZE 96.0

float GetHash1D(vec2 p)
{
    // from IQ
	p  = fract( p*0.3183099+.1 );
	p *= 17.0;
    return fract( p.x*p.y*(p.x+p.y) );
}

float Noise1D(vec2 x)
{
	vec2 p = floor(x);
	vec2 f = fract(x);
   	f = f*f*(3.0-2.0*f);

	return 
		mix(
			mix(GetHash1D(p), GetHash1D(p+vec2(1.0, 0.0)), f.x),
			mix(GetHash1D(p+vec2(0.0, 1.0)), GetHash1D(p+vec2(1.0, 1.0)), f.x),
			f.y);
}

vec3 GetHash3D( vec3 p ) // replace this by something better
{
	p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
			  dot(p,vec3(269.5,183.3,246.1)),
			  dot(p,vec3(113.5,271.9,124.6)));

	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

float Noise3D( in vec3 p )
{
    vec3 i = floor( p );
    vec3 f = fract( p );
	
	vec3 u = f*f*(3.0-2.0*f);

    return mix( mix( mix( dot( GetHash3D( i + vec3(0.0,0.0,0.0) ), f - vec3(0.0,0.0,0.0) ), 
                          dot( GetHash3D( i + vec3(1.0,0.0,0.0) ), f - vec3(1.0,0.0,0.0) ), u.x),
                     mix( dot( GetHash3D( i + vec3(0.0,1.0,0.0) ), f - vec3(0.0,1.0,0.0) ), 
                          dot( GetHash3D( i + vec3(1.0,1.0,0.0) ), f - vec3(1.0,1.0,0.0) ), u.x), u.y),
                mix( mix( dot( GetHash3D( i + vec3(0.0,0.0,1.0) ), f - vec3(0.0,0.0,1.0) ), 
                          dot( GetHash3D( i + vec3(1.0,0.0,1.0) ), f - vec3(1.0,0.0,1.0) ), u.x),
                     mix( dot( GetHash3D( i + vec3(0.0,1.0,1.0) ), f - vec3(0.0,1.0,1.0) ), 
                          dot( GetHash3D( i + vec3(1.0,1.0,1.0) ), f - vec3(1.0,1.0,1.0) ), u.x), u.y), u.z );
}

vec2 GetHash2D( in vec2 x )  // replace this by something better
{
    const vec2 k = vec2( 0.3183099, 0.3678794 );
    x = x*k + k.yx;
    return -1.0 + 2.0*fract( 16.0 * k*fract( x.x*x.y*(x.x+x.y)) );
}

// return gradient noise (in x) and its derivatives (in yz)
vec3 Noise2DDer( in vec2 p )
{
    vec2 i = floor( p );
    vec2 f = fract( p );

#if 1
    // quintic interpolation
    vec2 u = f*f*f*(f*(f*6.0-15.0)+10.0);
    vec2 du = 30.0*f*f*(f*(f-2.0)+1.0);
#else
    // cubic interpolation
    vec2 u = f*f*(3.0-2.0*f);
    vec2 du = 6.0*f*(1.0-f);
#endif    
    
    vec2 ga = GetHash2D( i + vec2(0.0,0.0) );
    vec2 gb = GetHash2D( i + vec2(1.0,0.0) );
    vec2 gc = GetHash2D( i + vec2(0.0,1.0) );
    vec2 gd = GetHash2D( i + vec2(1.0,1.0) );
    
    float va = dot( ga, f - vec2(0.0,0.0) );
    float vb = dot( gb, f - vec2(1.0,0.0) );
    float vc = dot( gc, f - vec2(0.0,1.0) );
    float vd = dot( gd, f - vec2(1.0,1.0) );

    return vec3( va + u.x*(vb-va) + u.y*(vc-va) + u.x*u.y*(va-vb-vc+vd),   // value
                 ga + u.x*(gb-ga) + u.y*(gc-ga) + u.x*u.y*(ga-gb-gc+gd) +  // derivatives
                 du * (u.yx*(va-vb-vc+vd) + vec2(vb,vc) - va));
}

vec3 GetFBM( vec2 position)
{
	vec3 f = vec3(0.0);

	vec3 warping = Noise2DDer( position*2.5 )*0.45 + Noise2DDer( position*1.1 ) ;
	position += warping.yz*0.07;

	vec2 q = vec2(8.0)*position;
	f  = vec3(0.5000)*Noise2DDer( q ); q = q*vec2(2.01);
	f += vec3(0.2500*Noise2DDer( q )); q = q*vec2(2.02);
	f += vec3(0.1250*Noise2DDer( q )); q = q*vec2(2.03);
	f += vec3(0.0625*Noise2DDer( q )); q = q*vec2(2.01);
	f += vec3(0.03125*Noise2DDer( q )); q = q*vec2(2.02);

	return f;
}


vec2 Rotate(vec2 pos, float angle) 
{
	return vec2(
        pos.x * cos(angle) - pos.y * sin(angle),
        pos.x * sin(angle) + pos.y * cos(angle)
    );
}

vec2 getRainNormal(vec2 position)
{
	float gridSize = RAIN_DROPS_SIZE;
	vec2 normal2D = vec2(0.0);

	for(float i=0.0; i<15.0 * RAIN_INTENSITY; i++)
	{
		vec2 coord = Rotate(position, .25*i) + vec2(3.0, 7.0)*i;
		vec2 gridPos = floor(coord / vec2(gridSize))*vec2(gridSize);
		float offset = GetHash1D(gridPos+vec2(153.0*i, 127.0*i));
		vec2 delta = gridPos - coord;
		float dist = length(delta);
		delta /= dist;
		dist /= gridSize;
		float mask = 1.0 - clamp((dist)*4.0 - 1.0, 0.0, 1.0);
		offset = mod(iTime + offset*3.0, 3.0)-1.0;
		float ripple = sin((dist - offset)*60.0);
		float dRipple = cos((dist - offset)*60.0);
		float rippleMask = clamp(abs(dist - offset)*10.0, 0.0, 1.0);
		float height = ((1.0-rippleMask)*1.0) * mask;
		normal2D += delta * dRipple * height;
	}

	return normal2D;
}

vec3 getWaterNormal(vec2 position)
{
	float noiseScale = 0.01;
	vec3 bpos = vec3(position.x, position.y, iTime*400.0);
	float base = Noise3D(bpos*noiseScale);
	float N = Noise3D((bpos + vec3( 0.0, 10.0, 0.0))*noiseScale);
	float S = Noise3D((bpos + vec3( 0.0,-10.0, 0.0))*noiseScale);
	float E = Noise3D((bpos + vec3( 10.0, 0.0, 0.0))*noiseScale);
	float W = Noise3D((bpos + vec3(-10.0, 0.0, 0.0))*noiseScale);
	vec2 baseNormal = vec2((N-base)-(S-base),(E-base)-(W-base))*.6;

	return vec3(base, baseNormal.x, baseNormal.y);
}

vec3 getCheckerBackground(vec2 position)
{
	float checkerSize = 64.0;
	vec2 checkerPos = floor(position / vec2(checkerSize));
	float checker = step(mod(checkerPos.x + checkerPos.y, 2.0), 0.0);

	return mix (vec3(0.3, 0.3, 0.3), vec3(0.7, 0.7, 0.7), checker);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
	fragCoord = Rotate(fragCoord - iResolution.xy*0.5, iTime*0.06);
	fragCoord += vec2(sin(iTime*0.015), cos(iTime*0.03))*3000.0;

	// light dir
	vec3 l = normalize(vec3(1.0, -1.0, 2.0));	
	l.xy = Rotate(l.xy, iTime*0.06);

	vec3 groundBase =  GetFBM((fragCoord)*0.0005);
	vec3 water = getWaterNormal(fragCoord);
	float waterDepth = clamp((WATER_LEVEL - water.x*0.02 - groundBase.x), 0.0, 1.0);
	vec3 nUnderwater = normalize(vec3(groundBase.y, groundBase.z, 1.0));
	float diffuseUnderwater = clamp(dot(nUnderwater, l), 0.0, 1.0);
	float waterLimitSharp = clamp(waterDepth*30.0, 0.0, 1.0);
	float waterLimitSmooth = clamp(waterDepth*20.0, 0.0, 1.0);
	vec2 normal2D = getRainNormal(fragCoord + groundBase.yz*50.0 *(1.0 - waterLimitSharp))*0.5 + water.yz*1.0;


	// flowmap
	float timing1 = fract(iTime*0.25);
	vec3 waterFlowing = Noise2DDer((fragCoord + groundBase.yz*timing1 * 150.0) * 0.07) * (1.0 - abs(timing1*2.0 - 1.0));
	float timing2 = fract(iTime*0.25 + 0.5);
	waterFlowing += Noise2DDer((fragCoord + vec2(500.0) + groundBase.yz*timing2 * 150.0) * 0.07) * (1.0 - abs(timing2*2.0 - 1.0));
	float flatGround = clamp(dot(normalize(vec3(groundBase.yz, 1.0)), vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
	waterFlowing *= 1.0 - flatGround;
	normal2D *= flatGround;

	// Ground color - mix with water ponds
	vec3 ground =  GetFBM((fragCoord + normal2D * 500.0 * waterDepth + waterFlowing.yz * RAIN_INTENSITY * 800.0 * (1.0 - flatGround))*0.0005);
	vec3 col = mix (vec3(0.5, 0.3, 0.2), vec3(0.3, 0.25, 0.25), ground.x);
	col = mix (col, mix (vec3(0.4, 0.2, 0.00), vec3(0.0, 0.0, 0.0), waterDepth*3.0), waterLimitSmooth) * diffuseUnderwater;
	normal2D = mix (ground.yz + normal2D*0.1 + waterFlowing.yz * 0.15 * RAIN_INTENSITY, vec2(0.0)+ normal2D, waterLimitSharp);

	vec3 n = normalize(vec3(normal2D.x, normal2D.y, 1.0));
	vec3 v = vec3(0.0, 0.0 ,1.0);

	vec3 reflect = normalize(2.0 * n - l); 
	float specular = pow(clamp(dot(reflect, v), 0.0, 1.0), 65.0)*3.0;
	float diffuse = clamp(dot(n, l), 0.0, 1.0);
	vec3 light = vec3(specular);

	col = col* diffuse + light*0.25;

    fragColor = vec4(col,1.0);
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
