/*
 * Original shader from: https://www.shadertoy.com/view/tls3RX
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

// Emulate a black texture
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
const float GRASS_BLADE_HEIGHT = 7.35;
const float GRASS_BLADE_HALFWIDTH = 0.35;

const vec3  GRASS_COLOR_1 = vec3(1.0,0.45,0.0);
const vec3  GRASS_COLOR_2 = vec3(0.7,0.6,0.5);
const vec3  CLEAR_SKY_COLOR = vec3(0.1, 0.2, 0.6);
const vec3  FOG_COLOR = vec3(0.4, 0.7, 1.0);
const vec3  SUN_COLOR = vec3(1.0,1.0,3.0);

const vec3	SUN_DIRECTION = normalize(vec3(-0.4,0.2,0.0));
const float SUN_DISC_SIZE = 0.04;

const float CAMERA_HEIGHT = 18.5;

const float CAMERA_PITCH_1 = -0.2;
const float CAMERA_PITCH_2 = 0.3;

const float CAMERA_YAW = 0.0; //4.4;
const float CAMERA_PITCH = -0.4;

const float CAMERA_SPEED = 0.25;

const float	GRASS_FIELD_STEP = 0.3;

const bool	ANTI_ALIASING_4X = false;




struct CAMERA_RAY
{
    vec3 eye, ray, right, up;
};

float freq(float K)
{
    return K / 0.4;
}

float noise_func( vec2 xy )
{
    float x = xy.x;
    float y = xy.y;
    float rx = x + sin(y/43.0)*43.0;
    float ry = y + sin(x/37.0)*37.0;
    
    float f = sin(rx/11.2312) + sin(ry/14.4235);
    
    f = f*0.5 + sin(rx/24.0) * sin(ry/24.0);
    
    rx += sin(y/210.23)*210.23;
    ry += sin(x/270.0)*270.0;
    
    f = f*0.5 + sin(rx/65.0) * sin(ry/65.0);
    f = f*0.5 + sin(rx/165.0) * sin(ry/165.0);
    
    return f / 1.0;
}


float wind_power( float x )
{
    float w = sin(x/freq(5.0)) + sin(x/freq(13.0));
    w *= 1.2;
    
    float bigw = sin(x/freq(35.0)) + sin(x/freq(33.0));
    
    bigw = bigw*0.25 + 0.5;
    bigw *= bigw;
  
    w += bigw*3.0;

    
    float hf = sin(x/freq(0.65))*0.2;
    float lowf = sin(x/freq(17.0));
    
    lowf = max( lowf, 0.0 );
    
    w = lowf * (hf - lowf*0.6) + w;
    
    return w;
}


void generate_grass_blade_at_position( in CAMERA_RAY cam, in vec3 pos, out vec3 v0, out vec3 v1, out vec3 v2, out vec3 color )
{
    vec3 eye = cam.eye;
    vec3 ray = cam.ray;
    
    vec3	center	= vec3(floor(pos.x), 0, floor(pos.z));
    float	noise_angle	= fract( center.x/4.5678234 * center.z/3.1415 );
    
    vec3 right = normalize( cross( normalize(pos - eye), vec3(0,1,0) ) );
    
	float noise = max( (sin(center.x/34.0) * cos(center.z/34.0)*0.5 + (sin(center.x/13.0) * cos(center.z/13.0))*0.4) / 1.5, 0.0 );
    
    center.x += cos(noise_angle*8.5)*GRASS_BLADE_HALFWIDTH*2.0;
    center.z += sin(noise_angle*8.5)*GRASS_BLADE_HALFWIDTH*2.0;
    
    
    v0 = center + cam.right * GRASS_BLADE_HALFWIDTH;
    v1 = center - cam.right * GRASS_BLADE_HALFWIDTH;
    v2 = center + vec3(0,GRASS_BLADE_HEIGHT*(0.8 + 0.2*noise),0);
    
    float wind_pow = wind_power( sin(center.x/10.0)* sin(center.z/10.0)*19.0 + iTime*40.0 ) * 1.3;
    
    v2.x -= wind_pow;
    
    float noise2 = max( sin(center.x/7.31) + sin(center.z/14.02), 0.0);
    
    float n3 = noise_func( center.xz*5.0 );
    
    float xt = center.x - iTime*40.0;
    float clouds = sin(xt/50.0)*sin(center.z/50.0) + sin(xt/87.0) * sin(center.z/87.0);
    
    clouds = clamp( clouds, 0.0, 1.0 );
    
    color = mix( GRASS_COLOR_1, GRASS_COLOR_2, clamp(n3,0.0,1.0) );
    
    color *= 1.0 - 0.5*clouds;
}

bool intersect_triangle( in CAMERA_RAY cam, in vec3 v0, in vec3 v1, in vec3 v2, out vec3 P )
{
    const float EPSILON = 0.0000001;
    
    vec3 edge1, edge2, h, s, q;
    float a,f,u,v;
    edge1 = v1 - v0;
    edge2 = v2 - v0;
    h = cross( cam.ray, edge2 );
    a = dot( edge1, h );
    if (a > -EPSILON && a < EPSILON)
        return false;
    f = 1.0 / a;
    s = cam.eye - v0;
    u = f * dot( s, h );
    if (u < 0.0 || u > 1.0)
        return false;
    q = cross( s, edge1 );
    v = f * dot( cam.ray, q );
    if (v < 0.0 || u + v > 1.0)
        return false;
    float t = f * dot( edge2, q );
    if (t > EPSILON)
    {
        P  = cam.eye + cam.ray * t;
        return true;
    }
    else
        return false;
}

bool intersect_sphere( in vec3 ray, in vec3 center, in float R, out float T )
{
    float B = dot(center,ray);
    float det = B*B - dot(center,center) + R * R;
    if( det < 0.0 ) return false;
    
    T = dot(ray, center) - sqrt(det);
    return T > 0.0;
}

vec3 sky_color( in CAMERA_RAY cam )
{
    vec3 ray = cam.ray;
    
    // sky color, brighter on the horizon
    
    float horizon = ray.y;
    horizon = 1.0 - horizon;
    horizon *= horizon;
    horizon *= horizon;
    horizon = 1.0 - horizon;    

    float space = ray.y;
    space *= space;
   	space = 1.0 - space*0.5;
    
    ray = normalize( ray );
    
    vec3 clear_sky = CLEAR_SKY_COLOR;
    vec3 horizon_sky = FOG_COLOR;
    
    vec3 sky = mix( vec3(0,0,0), mix( horizon_sky, clear_sky, horizon ), space);
    
    // pulsing sun light
    
    float view_dot_sun = max( dot(ray, SUN_DIRECTION), 0.0 );
    float sun_pulse = 0.4 * abs( sin(view_dot_sun*200.0 + iTime*4.0));
    float view_dot_sun_mask = pow( view_dot_sun, 64.0 );
    
    sky += SUN_COLOR * (view_dot_sun_mask + sun_pulse * 0.2 * min( view_dot_sun_mask, 1.0) );
    
    float empty_space = 1.0;
    
    // big white moon
    
    float TI;
    vec3 moon = vec3(0.6,0.1,-1.5);
    if( intersect_sphere( ray, moon, 0.4, TI ))
    {
        vec3 pos = ray*TI;
        vec3 N = normalize(pos - moon);
        
        sky += max( dot(N,SUN_DIRECTION), 0.0) * (0.3 + 0.05*noise_func( N.yz/0.00007 )) * vec3(0.5,0.5,0.5);
        
        empty_space = 0.0;
    }
    
    // smaller red moon
    
    moon = vec3(-1.4,0.3,1.5);
    if( intersect_sphere( ray, moon, 0.3, TI ))
    {
        vec3 pos = ray*TI;
        vec3 N = normalize(pos - moon);
        
        sky += max( dot(N,SUN_DIRECTION), 0.0) * (0.5 + 0.2*noise_func( N.yz/0.001 )) * vec3(1.5,0.3,0.3);
        
        empty_space = 0.0;
    }
    
    // falling meteor
    
    float meteor_anim = fract( iTime*180.0 / 1300.0 ) * 1300.0 - 800.0;
    
    vec3 out_p;
    vec3 fs_orig = vec3(2000.0,300.0 - meteor_anim,meteor_anim);
    if(intersect_triangle(cam, fs_orig, fs_orig - vec3(0.0,5.0,5.0), fs_orig - vec3(0.0,-200.0,200.0), out_p))
    {
        sky += vec3(0.4,0.3,0.1);
    }
    
    // stars in the sky, blocked by the moons
    
    vec2 sky_coord = vec2( atan(ray.x, ray.z), ray.y );
    float star = texture( iChannel1, sky_coord ).x;
    star = pow( star, 32.0 );
    sky += vec3( star, star, star ) * empty_space;
    
    return sky;
}

vec3 post_process( in vec3 ray, in vec2 screen_uv, in vec3 color )
{
	vec3 t = texture( iChannel0, screen_uv ).xyz;
    
    // camera lens dirt
    
    float dirt = pow( t.x, 9.0 );
    vec3 dirt_mask = vec3(dirt, dirt, dirt);

    float view_dot_sun = max( dot(ray, SUN_DIRECTION), 0.0 );
    
    //dirt_mask *= pow( max(1.0 - view_dot_sun, 0.0), 1.0);
    dirt_mask *= min( view_dot_sun * 0.1, 1.0 );
    dirt_mask *= 17.0;
    
    color += dirt_mask;

    return color;
}

vec3 ground_color(vec3 eye, vec3 ray)
{
    return vec3(0.0,0.0,0.0);
}

bool test_grass_blade(in CAMERA_RAY cam, in vec3 pos, out vec3 color)
{
    vec3 v0, v1, v2;
	generate_grass_blade_at_position( cam, pos, v0, v1, v2, color );
    
    vec3 P;
    if( intersect_triangle( cam, v0, v1, v2, P ))
    {
        color *= 0.0 + P.y / v2.y;
        return true;
    }
    return false;
}

vec3 trace_ray( in CAMERA_RAY cam, in vec2 screen_uv )
{
    vec3 color;
    
    if( cam.ray.y > 0.0 )
    {
        color = sky_color(cam);
    }
    else
    {
        vec3 pos = cam.eye;

        if( pos.y > GRASS_BLADE_HEIGHT )
        {
            pos += cam.ray*(pos.y - GRASS_BLADE_HEIGHT) / -cam.ray.y;
        }

        vec3 ray_step = cam.ray / -cam.ray.y * GRASS_FIELD_STEP;

        vec3 right = cam.right;

        vec3 final_color = vec3(0.0, 0.0, 0.0);
        int intersections = 0;
        float coverage = 0.0;

        for( int i=0; i<100; ++i )
        {
            for( float k=-2.0; k<=2.1; k += 1.0 )
            {
                if( test_grass_blade( cam, pos + right*k, color ))
                {
                    float dist_coverage_coef = 1.0 - min( length(pos - cam.eye) / 40.0, 1.0 )*0.7;

                    final_color += color; //*(1.0 - coverage)*dist_coverage_coef;
                    coverage = 1.0;

                    coverage += (1.0 - coverage)*0.9 *dist_coverage_coef;
                    intersections++;
                    break;
                }
            }

            if( pos.y < 0.0 ) break;
            pos += ray_step;
            if (intersections >= 2) break ;
        }

        if(intersections>0)
        {
            final_color *= 1.0/float(intersections);
        }

        final_color += ground_color(cam.eye, cam.ray )*(1.0 - coverage);

        // apply some fog
        float fog_coef = 1.0 - exp( -length(cam.eye - pos) * 0.002);
        final_color = mix( final_color, FOG_COLOR, fog_coef );
    
    	color = final_color;
    }
    return post_process( cam.ray, screen_uv, color );
}

vec3 rotate_around_y( in vec3 v, float angle )
{
    float s = sin(angle), c = cos(angle);
    return vec3( v.x*c - v.z*s, v.y, v.x*s + v.z*c );
}

vec3 rotate_around_x( in vec3 v, float angle )
{
    float s = sin(angle), c = cos(angle);
    return vec3( v.x, v.y*c - v.z*s, v.y*s + v.z*c );
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	// camera position and direction movement
    CAMERA_RAY cam;
    cam.ray = normalize( vec3( fragCoord/iResolution.yy - 0.5, 1.0 ));
    
    if(CAMERA_YAW > 0.0)
    {
        cam.ray = rotate_around_x( cam.ray, CAMERA_PITCH );
        cam.ray = rotate_around_y( cam.ray, CAMERA_YAW );
        cam.eye = vec3(0.0, CAMERA_HEIGHT, 0.0);
    }
    else
    {
	    cam.ray = rotate_around_x( cam.ray, mix(CAMERA_PITCH_1, CAMERA_PITCH_2, 0.5+0.5*sin(iTime * CAMERA_SPEED * 2.0)) );
	    cam.ray = rotate_around_y( cam.ray, iTime * CAMERA_SPEED );
		cam.eye = vec3( 20.0*sin(5.0*iTime * CAMERA_SPEED), CAMERA_HEIGHT, 20.0*sin(4.0*iTime * CAMERA_SPEED));  // 5:4 Lissajous
    }
    
	
	cam.right = normalize(cross(cam.ray, vec3(0,1,0)));
    cam.up = normalize(cross(cam.ray, cam.right));
    
    vec2 screen_uv = fragCoord / iResolution.xy;

    vec3 color = trace_ray( cam, screen_uv );
    
    if(ANTI_ALIASING_4X)
    {
        vec3 eye = cam.eye;
        cam.eye += eye  + cam.right * (1.5/iResolution.y);
	    color += trace_ray( cam, screen_uv );
        cam.eye = eye  - cam.right * (1.5/iResolution.x);
	    color += trace_ray( cam, screen_uv );
        cam.eye = eye  + cam.up * (1.5/iResolution.x);
	    color += trace_ray( cam, screen_uv );
	    color *= 0.25;
    }
    
    
    fragColor = vec4(color,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
