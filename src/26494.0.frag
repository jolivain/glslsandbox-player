// Chains - @P_Malin
// https://github.com/fxlex/ProcessingGLSL/blob/master/ProcessingGLSL/src/data/glslsandbox/chains.glsl

#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

struct C_Ray
{
	vec3 vOrigin;
	vec3 vDir;
};

struct C_HitInfo
{
	float fDistance;
	float fObjectId;
	vec3 vPos;
};

struct C_Material
{
	vec3 cAlbedo;
	float fR0;
	float fSmoothness;
};

vec2 DistCombineUnion( const in vec2 v1, const in vec2 v2 )
{
	//if(v1.x < v2.x)
	//            return v1;
	//else
	//            return v2;
	return mix(v1, v2, step(v2.x, v1.x));
}

vec2 DistCombineIntersect( const in vec2 v1, const in vec2 v2 )
{
	return mix(v2, v1, step(v2.x,v1.x));
}

vec2 DistCombineSubstract( const in vec2 v1, const in vec2 v2 )
{
	return DistCombineIntersect(v1, vec2(-v2.x, v2.y));
}

vec3 DomainRepeatXZGetTile( vec3 vPos, vec2 vRepeat, out vec2 vTile )
{
	vec3 vResult = vPos;
	vec2 vTilePos = (vPos.xz / vRepeat) + 0.5;
	vTile = floor(vTilePos + 1000.0);
	vResult.xz = (fract(vTilePos) - 0.5) * vRepeat;
	return vResult;
}

vec3 DomainRepeatY( vec3 vPos, float fSize )
{
	vec3 vResult = vPos;
	vResult.y = (fract(vPos.y / fSize + 0.5) - 0.5) * fSize;
	return vResult;
}

float GetDistanceXYTorus( const in vec3 p, const in float r1, const in float r2 )
{
   vec2 q = vec2(length(p.xy)-r1,p.z);
   return length(q)-r2;
}

float GetDistanceYZTorus( const in vec3 p, const in float r1, const in float r2 )
{
   vec2 q = vec2(length(p.yz)-r1,p.x);
   return length(q)-r2;
}

float GetDistanceChain(vec3 vPos)
{
	vec3 vChainDomain = vPos;
	
	vChainDomain.y = fract(vChainDomain.y + 0.5) - 0.5;		
	float fDistTorus1 = GetDistanceXYTorus(vChainDomain, 0.35, 0.1);
	
	vChainDomain.y = fract(vChainDomain.y + 1.0) - 0.5;		
	float fDistTorus2 = GetDistanceYZTorus(vChainDomain, 0.35, 0.1);
	
	float fDist = min(fDistTorus1, fDistTorus2);

	return fDist;
}

float GetDistanceCylinderY(vec3 vPos, float r)
{
	return length(vPos.xz) - r;
}

vec2 GetDistanceScene( const in vec3 vPos )
{             
	vec2 vDistFloor = vec2(vPos.y + 0.5, 1.0);
	
	vec2 vChainTile;
	vec3 vChainDomain = vPos;
	float fRepeat = 3.0;
	vChainDomain.xz += fRepeat / 2.0;
	vChainDomain = DomainRepeatXZGetTile(vChainDomain, vec2(fRepeat), vChainTile);
	float fSpeed = (sin(vChainTile.y + vChainTile.x) + 1.1) * 0.5;
	vChainDomain.y += sin(time * fSpeed);
	vec2 vDistChain = vec2( GetDistanceChain(vChainDomain), 100.0);

	vec2 vDistChainHole = vec2( GetDistanceCylinderY(vChainDomain, 0.7), 2.0);
	
	vec2 vResult = vDistFloor;
	vResult = DistCombineSubstract( vResult, vDistChainHole );
	vResult = DistCombineUnion( vResult, vDistChain );
       return vResult;
}

C_Material GetObjectMaterial( in float fObjId, in vec3 vPos )
{
	C_Material mat;

	if(fObjId < 1.5)
	{
		// floor
		mat.fR0 = 0.02;
		mat.fSmoothness = 0.8;
		mat.cAlbedo = vec3(0.8, 1.0, 0.8);
	}
	else
	if(fObjId < 2.5)
	{
		// hole interior
		mat.fR0 = 0.0;
		mat.fSmoothness = 0.0;
		mat.cAlbedo = vec3(0.8, 0.8, 0.8);
	}
	else
	{
		// chain
		mat.fR0 = 0.2;
		mat.fSmoothness = 0.2;
		mat.cAlbedo = vec3(0.2, 0.19, 0.16);
	}
	
	return mat;
}

vec3 GetSkyGradient( const in vec3 vDir )
{
	float fBlend = clamp(vDir.y, 0.0, 1.0);
	return mix(vec3(0.8, 0.9, 1.0), vec3(0.4, 0.2, 0.3), fBlend);
}

vec3 GetLightPos()
{
	return vec3(sin(time), 1.5 + cos(time * 1.231), cos(time * 1.1254));
}

vec3 GetLightCol()
{
	return vec3(18.0, 18.0, 6.0);
}

vec3 GetAmbientLight(const in vec3 vNormal)
{
	return GetSkyGradient(vNormal);
}

void ApplyAtmosphere(inout vec3 col, const in C_Ray ray, const in C_HitInfo intersection)
{
	// fog
	float fFogDensity = 0.025;
	float fFogAmount = exp(intersection.fDistance * -fFogDensity);
	vec3 cFog = GetSkyGradient(ray.vDir);
	col = mix(cFog, col, fFogAmount);
	
	// glare from light (a bit hacky - use length of closest approach from ray to light)
	
	vec3 vToLight = GetLightPos() - ray.vOrigin;
	float fDot = dot(vToLight, ray.vDir);
	fDot = clamp(fDot, 0.0, intersection.fDistance);
       
	vec3 vClosestPoint = ray.vOrigin + ray.vDir * fDot;
	float fDist = length(vClosestPoint - GetLightPos());
	col += GetLightCol() * 0.01/ (fDist * fDist);	
}

vec3 GetSceneNormal( const in vec3 vPos )
{
	// tetrahedron normal  
	
	float fDelta = 0.01;
	
	vec3 vOffset1 = vec3( fDelta, -fDelta, -fDelta);
	vec3 vOffset2 = vec3(-fDelta, -fDelta,  fDelta);
	vec3 vOffset3 = vec3(-fDelta,  fDelta, -fDelta);
	vec3 vOffset4 = vec3( fDelta,  fDelta,  fDelta);
	
	float f1 = GetDistanceScene( vPos + vOffset1 ).x;
	float f2 = GetDistanceScene( vPos + vOffset2 ).x;
	float f3 = GetDistanceScene( vPos + vOffset3 ).x;
	float f4 = GetDistanceScene( vPos + vOffset4 ).x;
	
	vec3 vNormal = vOffset1 * f1 + vOffset2 * f2 + vOffset3 * f3 + vOffset4 * f4;
	
	return normalize( vNormal );
}

// This is an excellent resource on ray marching -> http://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm
void Raymarch( const in C_Ray ray, out C_HitInfo result, const float fMaxDist, const int maxIter )
{            
	const float fEpsilon = 0.01;
	const float fStartDistance = 0.1;
	
	result.fDistance = fStartDistance; 
	result.fObjectId = 0.0;
		      
	for(int i=0;i<=256;i++)                  
	{
		result.vPos = ray.vOrigin + ray.vDir * result.fDistance;
		vec2 vSceneDist = GetDistanceScene( result.vPos );
		result.fObjectId = vSceneDist.y;
		
		// abs allows backward stepping - should only be necessary for non uniform distance functions
		if((abs(vSceneDist.x) <= fEpsilon) || (result.fDistance >= fMaxDist) || (i > maxIter))
		{
			break;
		}                            
		
		result.fDistance = result.fDistance + vSceneDist.x;                          
	}
	
	
	if(result.fDistance >= fMaxDist)
	{
		result.fObjectId = 0.0;
		result.fDistance = 1000.0;
	}
}

float GetShadow( const in vec3 vPos, const in vec3 vLightDir, const in float fLightDistance )
{
	C_Ray shadowRay;
	shadowRay.vDir = vLightDir;
	shadowRay.vOrigin = vPos;
	
	C_HitInfo shadowIntersect;
	Raymarch(shadowRay, shadowIntersect, fLightDistance, 32);
				       
	return step(0.0, shadowIntersect.fDistance) * step(fLightDistance, shadowIntersect.fDistance );             
}

// http://en.wikipedia.org/wiki/Schlick's_approximation
float Schlick( const in vec3 vNormal, const in vec3 vView, const in float fR0, const in float fSmoothFactor)
{
	float fDot = dot(vNormal, -vView);
	fDot = min(max((1.0 - fDot), 0.0), 1.0);
	float fDot2 = fDot * fDot;
	float fDot5 = fDot2 * fDot2 * fDot;
	return fR0 + (1.0 - fR0) * fDot5 * fSmoothFactor;
}

float GetDiffuseIntensity(const in vec3 vLightDir, const in vec3 vNormal)
{
	return max(0.0, dot(vLightDir, vNormal));
}

float GetBlinnPhongIntensity(const in C_Ray ray, const in C_Material mat, const in vec3 vLightDir, const in vec3 vNormal)
{             
	vec3 vHalf = normalize(vLightDir - ray.vDir);
	float fNdotH = max(0.0, dot(vHalf, vNormal));

	float fSpecPower = exp2(4.0 + 6.0 * mat.fSmoothness);
	float fSpecIntensity = (fSpecPower + 2.0) * 0.125;
	
	return pow(fNdotH, fSpecPower) * fSpecIntensity;
}

// use distance field to evaluate ambient occlusion
float GetAmbientOcclusion(const in C_Ray ray, const in C_HitInfo intersection, const in vec3 vNormal)
{
	vec3 vPos = intersection.vPos;

	float fAmbientOcclusion = 1.0;

	float fDist = 0.0;
	for(int i=0; i<=5; i++)
	{
		fDist += 0.1;

		vec2 vSceneDist = GetDistanceScene(vPos + vNormal * fDist);
		
		fAmbientOcclusion *= 1.0 - max(0.0, (fDist - vSceneDist.x) * 0.2 / fDist );		       
	}

	return fAmbientOcclusion;
}

vec3 GetObjectLighting(const in C_Ray ray, const in C_HitInfo intersection, const in C_Material material, const in vec3 vNormal, const in vec3 cReflection)
{
	vec3 cScene ;
	
	vec3 vLightPos = GetLightPos();
	vec3 vToLight = vLightPos - intersection.vPos;
	vec3 vLightDir = normalize(vToLight);
	float fLightDistance = length(vToLight);
	
	float fAttenuation = 1.0 / (fLightDistance * fLightDistance);

	float fShadowBias = 0.1;	
	float fShadowFactor = GetShadow( intersection.vPos + vLightDir * fShadowBias, vLightDir, fLightDistance - fShadowBias );
	vec3 vIncidentLight = GetLightCol() * fShadowFactor * fAttenuation;
	
	vec3 vDiffuseLight = GetDiffuseIntensity( vLightDir, vNormal ) * vIncidentLight;
	
	float fAmbientOcclusion = GetAmbientOcclusion(ray, intersection, vNormal);
	vec3 vAmbientLight = GetAmbientLight(vNormal) * fAmbientOcclusion;
	
	vec3 vDiffuseReflection = material.cAlbedo * (vDiffuseLight + vAmbientLight);
	
	vec3 vSpecularReflection = cReflection * fAmbientOcclusion;
		       
	vSpecularReflection += GetBlinnPhongIntensity( ray, material, vLightDir, vNormal ) * vIncidentLight;
		       
	float fFresnel = Schlick(vNormal, ray.vDir, material.fR0, material.fSmoothness * 0.9 + 0.1);
	cScene = mix(vDiffuseReflection , vSpecularReflection, fFresnel);
	
	return cScene;
}

vec3 GetSceneColourSimple( const in C_Ray ray )
{
	C_HitInfo intersection;
	Raymarch(ray, intersection, 16.0, 32);
		       
	vec3 cScene;
	
	if(intersection.fObjectId < 0.5)
	{
		cScene = GetSkyGradient(ray.vDir);
	}
	else
	{
		C_Material material = GetObjectMaterial(intersection.fObjectId, intersection.vPos);
		vec3 vNormal = GetSceneNormal(intersection.vPos);
		
		// use sky gradient instead of reflection
		vec3 cReflection = GetSkyGradient(reflect(ray.vDir, vNormal));
		
		// apply lighting
		cScene = GetObjectLighting(ray, intersection, material, vNormal, cReflection );
	}
	
	ApplyAtmosphere(cScene, ray, intersection);
	
	return cScene;
}


vec3 GetSceneColour( const in C_Ray ray )
{                                                             
	C_HitInfo intersection;
	Raymarch(ray, intersection, 30.0, 256);
		       
	vec3 cScene;
	
	if(intersection.fObjectId < 0.5)
	{
		cScene = GetSkyGradient(ray.vDir);
	}
	else
	{
		C_Material material = GetObjectMaterial(intersection.fObjectId, intersection.vPos);
		vec3 vNormal = GetSceneNormal(intersection.vPos);
		
		vec3 cReflection;
		//if((material.fSmoothness + material.fR0) < 0.01)
		//{
		//	// use sky gradient instead of reflection
		//	vec3 cReflection = GetSkyGradient(reflect(ray.vDir, vNormal));			
		//}
		//else
		{
			// get colour from reflected ray
			float fSepration = 0.05;
			C_Ray reflectRay;
			reflectRay.vDir = reflect(ray.vDir, vNormal);
			reflectRay.vOrigin = intersection.vPos + reflectRay.vDir * fSepration;
					
			cReflection = GetSceneColourSimple(reflectRay);                                                 		
		}
		
		// apply lighting
		cScene = GetObjectLighting(ray, intersection, material, vNormal, cReflection );
	}
	
	ApplyAtmosphere(cScene, ray, intersection);
	
	return cScene;
}

void GetCameraRay( const in vec3 vPos, const in vec3 vForwards, const in vec3 vWorldUp, out C_Ray ray)
{
	vec2 vUV = ( gl_FragCoord.xy / resolution.xy );
	vec2 vViewCoord = vUV * 2.0 - 1.0;
	
	float fRatio = resolution.x / resolution.y;
	
	vViewCoord.y /= fRatio;                              
	
	ray.vOrigin = vPos;
	
	vec3 vRight = normalize(cross(vForwards, vWorldUp));
	vec3 vUp = cross(vRight, vForwards);
	       
	ray.vDir = normalize( vRight * vViewCoord.x + vUp * vViewCoord.y + vForwards);           
}

void GetCameraRayLookat( const in vec3 vPos, const in vec3 vInterest, out C_Ray ray)
{
	vec3 vForwards = normalize(vInterest - vPos);
	vec3 vUp = vec3(0.0, 1.0, 0.0);
	
	GetCameraRay(vPos, vForwards, vUp, ray);
}

vec3 OrbitPoint( const in float fHeading, const in float fElevation )
{
	return vec3(sin(fHeading) * cos(fElevation), sin(fElevation), cos(fHeading) * cos(fElevation));
}

vec3 Tonemap( const in vec3 cCol )
{
	// simple Reinhard tonemapping operator
	
	return cCol / (1.0 + cCol);
}

void main( void )
{
	C_Ray ray;
	
	GetCameraRayLookat( OrbitPoint(-mouse.x * 5.0, mouse.y) * 8.0, vec3(0.0, 0.0, 0.0), ray);
	//GetCameraRayLookat(vec3(0.0, 0.0, -5.0), vec3(0.0, 0.0, 0.0), ray);
	
	vec3 cScene = GetSceneColour( ray );
	
	float fExposure = 1.5;
	gl_FragColor = vec4( Tonemap(cScene * fExposure), 1.0 );
}
