/*
 * Original shader from: https://www.shadertoy.com/view/MldBDH
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

float determinant(mat2 m) {
    return m[0][0]*m[1][1] - m[1][0]*m[0][1];
}

// --------[ Original ShaderToy begins here ]---------- //
//COLOR DEF:

//general colors:
const vec4 COLOR_BLACK=vec4(0.,0.,0.,1.);
const vec4 COLOR_WHITE=vec4(1.,1.,1.,1.);
const vec4 COLOR_SKIN=vec4(0.99, 0.86, 0.71, 1.);

//Stan specific colors:
const vec4 COLOR_STANSHIRT=vec4(0.62, 0.37, 0.32, 1.);
const vec4 COLOR_STANBLUE=vec4(0.31, 0.38, 0.62, 1.);
const vec4 COLOR_STANRED=vec4(0.84, 0.12, 0.25, 1.);

//ANTIALIASING:
const float AA=0.001;

    
    
//MATH UTILS:
float side(vec2 ptA, vec2 ptB, vec2 ptX){
    mat2 m=mat2(ptX-ptA, ptB-ptA);
	return determinant(m);
}

//ANALOGOUS GLSL STEP FUNC
//BUT ADD ANTIALIASING
float stepAA1(float edge, float val){
    //return step(edge, val);
	return smoothstep(edge-AA, edge+AA, val);
}
vec2 stepAA2(vec2 edge, vec2 val){
    //return step(edge, val);
	return smoothstep(edge-vec2(AA,AA), edge+vec2(AA,AA), val);
}


//GEOMETRIC TEST FUNCTIONS:
//return 0.0 if outside, 1.0 if inside
//test if inside a rectangle which center is ctr and dims are wh:
float isInRect(vec2 co, vec2 ctr, vec2 wh){
    vec2 mn=stepAA2(ctr-0.5*wh,co);
    vec2 mx=stepAA2(co,ctr+0.5*wh);
    return mn.x*mn.y*mx.x*mx.y;
} 

//test if inside an ellipse defined by center, size along axis and long axis angle theta:
float isInEllipse(vec2 co, vec2 ctr, vec2 halfWh, float theta){
    float c=cos(theta), s=sin(theta);
    vec2 coCtr=mat2(c,s,-s,c)*(co-ctr);
    vec2 elvec=coCtr/halfWh;
    return stepAA1(dot(elvec, elvec), 1.0);
}

float isInCircle(vec2 co, vec2 ctr, float radius){
    return stepAA1(distance(co, ctr), radius);
}

float isUnderCurve(vec2 co, vec2 ptA, vec2 ptB, float curvature){
    float dAB=distance(ptA,ptB);
    float d=distance(co,ptA)*distance(co,ptB)/(dAB*dAB);
    vec2 n=normalize(ptB-ptA);
    vec2 co2=co-curvature*n.yx*d;
    return stepAA1(0.0, side(ptA, ptB, co2));
}

float isOnHztCurve(vec2 co, vec2 ptA, vec2 ptB, float curvature, float lineWidth){
    float dAB=distance(ptA,ptB);
    float d=distance(co,ptA)*distance(co,ptB)/(dAB*dAB);
    vec2 n=normalize(ptB-ptA);
    vec2 co2=co-curvature*n.yx*d;
    float r=stepAA1(abs(side(ptA, ptB, co2)), lineWidth );
    vec2 mn=min(ptA, ptB)-vec2(lineWidth,lineWidth);
    vec2 mx=max(ptA, ptB)+vec2(lineWidth,lineWidth);
    vec2 isOverMn=stepAA2(mn, co);
    vec2 isUnderMx=stepAA2(co, mx);
    return r*isOverMn.x*isUnderMx.x;
}

float isOnVtCurve(vec2 co, vec2 ptA, vec2 ptB, float curvature, float lineWidth){
    float dAB=distance(ptA,ptB);
    float d=distance(co,ptA)*distance(co,ptB)/(dAB*dAB);
    vec2 n=normalize(ptB-ptA);
    vec2 co2=co-curvature*n.yx*d;
    float r=stepAA1(abs(side(ptA, ptB, co2)), lineWidth );
    vec2 mn=min(ptA, ptB)-vec2(lineWidth,lineWidth);
    vec2 mx=max(ptA, ptB)+vec2(lineWidth,lineWidth);
    vec2 isOverMn=stepAA2(mn, co);
    vec2 isUnderMx=stepAA2(co, mx);
    return r*isOverMn.y*isUnderMx.y;
}


//draw Stan in a square where co.x and .y are in [-1,1]:
vec4 drawStan(in vec2 co){
    //init output as background color (transparent)
    vec4 col=vec4(0.,0.,0.,0.);
    
    //BODY:
    //PANTS:
    col=mix(col, COLOR_STANBLUE, isInRect(co, vec2(0.,-0.89), vec2(0.86,0.17)));
    
    //SHIRT:
    //main part of the shirt
    float isShirt=1.-isUnderCurve(co, vec2(-0.48,-0.8), vec2(0.48,-0.8), -0.24);
    isShirt*=isUnderCurve(co, vec2(-0.48,-0.8), vec2(-0.41,-0.5), 0.02);
    isShirt*=1.0-isUnderCurve(co, vec2(0.48,-0.8), vec2(0.41,-0.5), 0.02);
    isShirt*=step(co.y,0.0);
    col=mix(col, COLOR_STANSHIRT, isShirt);
    
    //sleeves:
    float isSleeveRight=isUnderCurve(co, vec2(-0.61,-0.7), vec2(-0.43,-0.24), -0.18);
    isSleeveRight*=1.0-isUnderCurve(co, vec2(-0.48,-0.8), vec2(-0.4,-0.5), 0.02);
    isSleeveRight*=step(-0.7,co.y);
    isSleeveRight*=step(co.y, 0.0);
    col=mix(col, COLOR_STANSHIRT, isSleeveRight);
    
    float isSleeveLeft=1.0-isUnderCurve(co, vec2(0.56,-0.7), vec2(0.38,-0.24), 0.18);
    isSleeveLeft*=isUnderCurve(co, vec2(0.42,-0.8), vec2(0.35,-0.5), 0.02);
    isSleeveLeft*=step(-0.7,co.y);
    isSleeveLeft*=step(co.y, 0.0);
    col=mix(col, COLOR_STANSHIRT, isSleeveLeft);
    
    //collar:
    float isCollar=isUnderCurve(co, vec2(-0.42,-0.23), vec2(0.385,-0.25), -0.6);
    isCollar*=1.-isUnderCurve(co, vec2(-0.5,-0.28), vec2(0.45,-0.30), -0.6);
    col=mix(col, COLOR_STANRED, isCollar);
    
    //arms borders:
    col=mix(col, COLOR_BLACK, isOnVtCurve(co, vec2(0.36,-0.52), vec2(0.4,-0.7), 0.0, 0.001)); //left arm
    col=mix(col, COLOR_BLACK, isOnVtCurve(co, vec2(-0.41,-0.52), vec2(-0.45,-0.7), 0.0, 0.001));//right arm
    
    //zip:
    col=mix(col, COLOR_BLACK, isOnVtCurve(co, vec2(0.01,-0.4), vec2(-0.01,-0.86), 0.0, 0.004));
    
    //buttons:
    col=mix(col, COLOR_BLACK, isInCircle(co, vec2(-0.06, -0.51), 0.018));
    col=mix(col, COLOR_BLACK, isInCircle(co, vec2(-0.062, -0.65), 0.018));
    col=mix(col, COLOR_BLACK, isInCircle(co, vec2(-0.065, -0.78), 0.018));
    
    //gloves:
    col=mix(col, COLOR_STANRED, isInCircle(co, vec2(-0.51, -0.7), 0.095)); //right
    col=mix(col, COLOR_STANRED, isInCircle(co, vec2(0.48, -0.715), 0.095)); //left
    
    //thumbs:
    col=mix(col, COLOR_BLACK, isInCircle(co, vec2(-0.45, -0.65), 0.042)); //right contour
    col=mix(col, COLOR_STANRED, isInCircle(co, vec2(-0.45, -0.65), 0.035)); //right
    
    col=mix(col, COLOR_BLACK, isInCircle(co, vec2(0.4, -0.69), 0.042)); //left contour
    col=mix(col, COLOR_STANRED, isInCircle(co, vec2(0.4, -0.69), 0.035)); //left contour
    
    //feet:
    float isFootLeft=isUnderCurve(co, vec2(-0.05,-0.98), vec2(0.47,-0.98), 0.2);
    isFootLeft*=step(-0.98, co.y)*step(co.x,0.47)*step(-0.05,co.x)*step(co.y, -0.9);
    col=mix(col, COLOR_BLACK, isFootLeft);
    
    float isFootRight=1.-isUnderCurve(co, vec2(0.05,-0.98), vec2(-0.47,-0.98), -0.2);
    isFootRight*=step(-0.98, co.y)*step(co.x,0.05)*step(-0.47,co.x)*step(co.y, -0.9);
    col=mix(col, COLOR_BLACK, isFootRight);
    
    
    
    //HEAD:
    
    //head skin:
    col=mix(col, COLOR_SKIN, isInCircle(co, vec2(0.0,0.20), 0.62));
    
    //hat:
    float isHat=isInCircle(co, vec2(0.0,0.22), 0.635);
    isHat*=1.-isUnderCurve(co, vec2(-0.63,0.38), vec2(0.63,0.38), 0.3);
    col=mix(col, COLOR_STANBLUE, isHat);
    
    float isHatBand=isUnderCurve(co, vec2(-0.63,0.39), vec2(0.63,0.39), 0.3);
    isHatBand*=1.-isUnderCurve(co, vec2(-0.63,0.26), vec2(0.63,0.26), 0.3);
    isHatBand*=isInRect(co, vec2(0.,0.26), vec2(1.26, 1.0));
    col=mix(col, COLOR_STANRED, isHatBand);
    
    //pompom:
    col=mix(col, COLOR_STANRED, isInCircle(co, vec2(-0.05,0.85), 0.13));
    
    //mouth
    col=mix(col, COLOR_BLACK, isOnHztCurve(co, vec2(-0.1,-0.28), vec2(0.1,-0.28), 0.09, 0.001));
    
    //right eye iris:
    col=mix(col, COLOR_WHITE, isInEllipse(co, vec2(-0.17,0.14), vec2(0.2,0.16), -0.9));
    //left eye iris:
    col=mix(col, COLOR_WHITE, isInEllipse(co, vec2(0.17,0.14), vec2(0.2,0.16), 0.9));
    //right eye pupil:
    col=mix(col, COLOR_BLACK, isInCircle(co, vec2(-0.10,0.13), 0.02));
    //left eye pupil:
    col=mix(col, COLOR_BLACK, isInCircle(co, vec2(0.10,0.13), 0.02));
    
    return col;
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    //viewport coord, between -1 and 1:
    vec2 vpCo = 2.0*fragCoord.xy/iResolution.xy - vec2(1.,1.);
    float aspectRatio=iResolution.x/iResolution.y;
    
    //a character is defined in a square, where co goes from -1 to 1
    vec2 co=vec2(vpCo.x*aspectRatio, vpCo.y);
    
    vec2 coAbs=abs(co);
    if(max(coAbs.x, coAbs.y)>1.0) {
        discard;
    }

    vec4 stanCol=drawStan(co);

    fragColor=stanCol;
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
