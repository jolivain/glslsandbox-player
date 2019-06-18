#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

// consts
const float EPS = 1e-4;
const float OFFSET = EPS * 10.0;
const float PI = 3.14159;
const float INF = 1e+10;

const vec3 lightDir = vec3( -0.48666426339228763, 0.8111071056538127, -0.3244428422615251 );
const vec3 backgroundColor = vec3( 0.0 );
const vec3 gateColor = vec3( 1.0, 0.1, 0.1 );

const float totalTime = 75.0;

// globals
vec3 cPos, cDir;
float normalizedGlobalTime = 0.0;
//vec3 illuminationColor;

struct Intersect {
    bool isHit;

    vec3 position;
    float distance;
    vec3 normal;

    int material;
    vec3 color;
};
    
const int BASIC_MATERIAL = 0;
const int MIRROR_MATERIAL = 1;


// distance functions
vec3 opRep( vec3 p, float interval ) {
    return mod( p, interval ) - 0.5 * interval;
}

vec2 opRep( vec2 p, float interval ) {
    return mod( p, interval ) - 0.5 * interval;
}

float opRep( float x, float interval ) {
    return mod( x, interval ) - 0.5 * interval;
}

float sphereDist( vec3 p, vec3 c, float r ) {
    return length( p - c ) - r;
}

float sdCappedCylinder( vec3 p, vec2 h ) {
    vec2 d = abs(vec2(length(p.xz),p.y)) - h;
    return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float udBox( vec3 p, vec3 b )
{
    return length(max(abs(p)-b,0.0));
}

float udFloor( vec3 p ){
    float t1 = 1.0;
    float t2 = 3.0;
    float d = -0.5;
    for( float i = 0.0; i < 3.0; i++ ) {
        float f = pow( 2.0, i );
    	d += 0.1 / f * ( sin( f * t1 * p.x + t2 * time ) + sin( f * t1 * p.z + t2 * time ) );
    }
	return dot(p,vec3(0.0,1.0,0.0)) - d;
}

float dGate( vec3 p ) {
    p.y -= 1.3 * 0.5;
    
    float r = 0.05;
    float left  = sdCappedCylinder( p - vec3( -1.0, 0.0, 0.0 ),  vec2(r, 1.3));
    float right = sdCappedCylinder( p - vec3( 1.0,  0.0, 0.0 ),  vec2(r, 1.3));

    float ty = 0.02 * p.x * p.x;
    float tx = 0.5 * ( p.y - 1.3 );
    float katsura  = udBox( p - vec3( 0.0, 1.3 + ty, 0.0 ), vec3( 1.7 + tx, r * 2.0 + ty, r ) );

    float kan = udBox( p - vec3( 0.0, 0.7, 0.0 ), vec3( 1.3, r, r ) );
    float gakuduka = udBox( p - vec3( 0.0, 1.0, 0.0), vec3( r, 0.3, r ) );

    return min( min( left, right ), min( gakuduka, min( katsura, kan ) ) );
}

float dRepGate( vec3 p ) {
    if ( normalizedGlobalTime <= 0.5 ) {
        p.z = opRep( p.z, 1.0 + 20.0 * cos( PI * normalizedGlobalTime ) );
    } else {
        p.xz = opRep( p.xz, 10.0  );
    }
    return dGate( p );
}

float sceneDistance( vec3 p ) {
    return udFloor( p );
}


// color functions
vec3 hsv2rgb( vec3 c ) {

    vec4 K = vec4( 1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0 );
    vec3 p = abs( fract( c.xxx + K.xyz ) * 6.0 - K.www );
    return c.z * mix( K.xxx, clamp( p - K.xxx, 0.0, 1.0 ), c.y );

}

Intersect minIntersect( Intersect a, Intersect b ) {
    if ( a.distance < b.distance ) {
        return a;
    } else {
        return b;
    }
}

Intersect sceneIntersect( vec3 p ) {

    Intersect a;
    a.distance = udFloor( p );
    a.material = MIRROR_MATERIAL;
    // return minIntersect( a, b );
    return a;
}

vec3 getNormal( vec3 p ) {
	vec2 e = vec2( 1.0, -1.0 ) * 0.001;
	return normalize(
		e.xyy * sceneDistance( p + e.xyy ) + e.yyx * sceneDistance( p + e.yyx ) + 
		e.yxy * sceneDistance( p + e.yxy ) + e.xxx * sceneDistance( p + e.xxx ) );
}

float getShadow( vec3 ro, vec3 rd ) {

    float h = 0.0;
    float c = 0.0;
    float r = 1.0;
    float shadowCoef = 0.5;

    for ( float t = 0.0; t < 50.0; t++ ) {

        h = sceneDistance( ro + rd * c );

        if ( h < EPS ) return shadowCoef;

        r = min( r, h * 16.0 / c );
        c += h;

    }

    return 1.0 - shadowCoef + r * shadowCoef;

}

Intersect getRayColor( vec3 origin, vec3 ray ) {

    // marching loop
    float d, minDist, trueDepth;
    float distance = 0.0;
    vec3 p = origin;
    int count = 0;
    Intersect nearest;

    // first pass (water)
    for ( int i = 0; i < 120; i++ ){

        d = sceneDistance( p );
        distance += d;
        p = origin + distance * ray;

        count = i;
        if ( abs(d) < EPS ) break;

    }

    if ( abs(d) < EPS ) {

        nearest = sceneIntersect( p );
        nearest.position = p;
        nearest.normal = getNormal(p);
        nearest.distance = distance;
        float diffuse = clamp( dot( lightDir, nearest.normal ), 0.1, 1.0 );
        float specular = pow( clamp( dot( reflect( lightDir, nearest.normal ), ray ), 0.0, 1.0 ), 6.0 );
        //float shadow = getShadow( p + nearest.normal * OFFSET, lightDir );

        if ( nearest.material == BASIC_MATERIAL ) {
        } else if ( nearest.material == MIRROR_MATERIAL ) {
            nearest.color = vec3( 0.5, 0.7, 0.8 ) * diffuse + vec3( 1.0 ) * specular;
        }

        nearest.isHit = true;

    } else {

        nearest.color = backgroundColor;
        nearest.isHit = false;

    }
    nearest.color = clamp( nearest.color - 0.1 * nearest.distance, 0.0, 1.0 );

    // second pass (gates)
    p = origin;
    distance = 0.0;
    minDist = INF;
    for ( int i = 0; i < 20; i++ ){
        d = dRepGate( p );
        minDist = min(d, minDist);
        /*if ( d < minDist ) {
            minDist = d;
            trueDepth = distance;
        }*/
        distance += d;
        p = origin + distance * ray;
        if ( i == 9 && normalizedGlobalTime <= 0.5 ) {
            break;
        }
    }

    if ( abs(d) < EPS ) {
        nearest.color += gateColor;
    } else {
        nearest.color += gateColor * clamp( 0.05 / minDist, 0.0, 1.0 );
    }

    return nearest;

}

void main( void ) {
    normalizedGlobalTime = mod( time / totalTime, 1.0 );

    // fragment position
    vec2 p = ( gl_FragCoord.xy * 2.0 - resolution.xy ) / min(  resolution.x,  resolution.y );

    // camera and ray
    if ( normalizedGlobalTime < 0.7 ) {
        cPos = vec3( 0.0, 0.6 + 0.4 * cos( time ), 3.0 * time );
        cDir = normalize( vec3( 0.0, -0.1, 1.0 ) );
    } else {
        cPos = vec3( 0.0, 0.6 + 0.4 * cos( time ) + 50.0 * ( normalizedGlobalTime - 0.7 ), 3.0 * time );
        cDir = normalize( vec3( 0.0, -0.1 - ( normalizedGlobalTime - 0.7 ), 1.0 ) );
    }
    vec3 cSide = normalize( cross( cDir, vec3( 0.0, 1.0 ,0.0 ) ) );
    vec3 cUp   = normalize( cross( cSide, cDir ) );
    float targetDepth = 1.3;
    vec3 ray = normalize( cSide * p.x + cUp * p.y + cDir * targetDepth );

    // Illumination Color
    // illuminationColor = hsv2rgb( vec3( time * 0.02 + 0.6, 1.0, 1.0 ) );

    vec3 color = vec3( 0.0 );
    float alpha = 1.0;
    Intersect nearest;

    for ( int i = 0; i < 3; i++ ) {

        nearest = getRayColor( cPos, ray );

        color += alpha * nearest.color;
        alpha *= 0.5;
        ray = normalize( reflect( ray, nearest.normal ) );
        cPos = nearest.position + nearest.normal * OFFSET;

        if ( !nearest.isHit || nearest.material != MIRROR_MATERIAL ) break;

    }

    gl_FragColor  = vec4(color, 1.0);

}
