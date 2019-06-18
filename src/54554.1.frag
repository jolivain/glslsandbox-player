// Author:
// Title:

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;
uniform float time;

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

float Circle(vec2 uv, vec2 origin, float r, float blur) {
    float d = length(uv - origin);
    float c = smoothstep(r, r - blur, d);
    return c;
}

float Remap(float src0, float src1, float tgt0, float tgt1, float p) {
    float normal = (p-src0) / (src1 - src0);
    float map = tgt0 + normal * (tgt1 - tgt0);
    return map;
}

float Smiley(vec2 uv, vec2 origin, float size, float blur) {
    // origin was 0.5, 0.5
    // face size was 0.3
    uv -= origin; // translate the coordinate system
    uv /= size;

    float mask = Circle(uv, vec2(0.0, 0.0), 0.3, blur); 
    mask -= Circle(uv, vec2(-0.1, 0.1), 0.05,  blur);
    mask -= Circle(uv, vec2(0.1, 0.1), 0.05, blur);

    float mouth = Circle(uv, vec2(0.0, 0.0), 0.2, blur);
    mouth -= Circle(uv, vec2(0.0, 0.05), 0.209, blur);

    return mask - mouth;
}

float Band(float t, float start, float end, float blur) {
    float step1 = smoothstep(start - blur, start + blur, t);
    float step2 = smoothstep(end + blur, end - blur, t);

    return step1 * step2;
}

float Rect(vec2 uv, float left, float right, float bottom, float top, float blur) {
    float band1 = Band(uv.x, left, right, blur);
    float band2 = Band(uv.y, bottom, top, blur);

    return band1 * band2;
}

int sprayLeft = 0;
int sprayRight = 1;
int sprayUp = 2;
int sprayDown = 3;

float FoggyCurve(vec2 uv, float left, float right, float bottom, float top, int sprayDirection) {
    float blurMin = 0.0025;
    float blurMax = 0.5;
    float x = uv.x;
    float y = uv.y;
    float m = 0.;
    float blur = 0.;
    
    if (sprayDirection == sprayLeft || sprayDirection == sprayRight) {
        if (sprayDirection == sprayLeft) {
            blur = Remap(left, right, blurMax, blurMin, x);
            m = sin(time + x * 8.0) * 0.1;
        }
        else {
            blur = Remap(left, right, blurMin, blurMax, x);
            m = sin(time - x * 8.0) * 0.1;
        }
        y -= m;
    }
    else {
        if (sprayDirection == sprayUp) {
            blur = Remap(top, bottom, blurMax, blurMin, y);
            m = sin(time - y * 8.0) * 0.1;
        }
        else {
            blur = Remap(top, bottom, blurMin, blurMax, y);
            m = sin(time + y * 8.0) * 0.1;
        }
        x -= m;
    }
    
    blur *= pow(blur, 1.25) * 3.;
    float mask = Rect(vec2(x,y), left, right, bottom, top, blur);
    return mask;

}

void main() {

    vec2 uv = gl_FragCoord.xy/resolution;
    uv -= 0.5; // translate to the centr of the screen (center = 0, 0);
    uv.x *= resolution.x/resolution.y; // adjust for aspect ration
    
    

    float x = uv.x;
    float y = uv.y;

    float r = 0.25; // radius
    float blur = 0.005;
    
    vec3 col = vec3(0.0);
    float m = 0.0;
    //float m = -(x+0.5)*(x-0.5); // use a polynomial root equation to look for shape
    // m  = m * m * 4.0; // tweek it for more effect
    //m = sin(x * u_time *  8.0) * 0.1; //this is not what I wanted, but is kind of cool
    m = sin(5.0*time + x * 8.0 ) * 0.1;

    y -= m;
    blur = Remap(-0.5, 0.5, 0.5, 0.0025, x);
    blur *= pow(blur, 1.25) * 3.;
    //float mask = Band(uv.x, -0.2, 0.2, 0.01);
    //float mask = Rect(vec2(x, y), -0.5, 0.5, -0.05, 0.05, blur);
    float mask1 = FoggyCurve(uv, -0.5, 0.5, -0.05, 0.02,sprayLeft);
    vec3 col1 = vec3(1.0, 1.0, 0.0);
    float mask2 = FoggyCurve(uv, -0.2, -0.14, -0.4, 0.4, sprayUp);
    vec3 col2 = vec3(1.0, 0.0, 1.0);
    float mask3 = FoggyCurve(uv, -0.5, 0.5, 0.3, 0.35, sprayRight);
    vec3 col3 = vec3(0.0, 1.0, 1.0);
    float mask4 = FoggyCurve(uv, 0.2, 0.25, -0.4, 0.48, sprayDown);
    vec3 col4 = vec3(0.0,1.0, 0.0);
    //col = vec3(1.0, 1.0, 0.0) * mask;
    col = col1 * mask1 + col2 * mask2 + col3 * mask3 + col4 * mask4;
    gl_FragColor = vec4(col, 1.0);
}
