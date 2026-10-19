import * as T from 'three';

// Fit the actual cabinet silhouette, including the score glass. No generic
// square bounding box: that used to waste most of a portrait phone's width.
const points=[];
for(const x of [-51,51])for(const z of [-92,92])points.push(new T.Vector3(x,3,z));
for(const x of [-48,48])for(const z of [-111,-90])points.push(new T.Vector3(x,5,z));
for(const x of [-6,6])points.push(new T.Vector3(x,33,-11));
export function fitCabinet(camera,width,height,view='cabinet',navigationHeight=48){
 const cabinetTilt=width/height>1?26:T.MathUtils.clamp(16+(width/height-.5)*95,16,32);
 const tilt=T.MathUtils.degToRad(({cabinet:cabinetTilt,overhead:5,deep:28})[view]??cabinetTilt);
 const target=new T.Vector3(0,1,-9),direction=new T.Vector3(0,Math.cos(tilt),Math.sin(tilt));
 camera.aspect=width/height;camera.fov=34;
 // Navigation floats above the glass; the score display starts beneath it.
 const header=Math.min(navigationHeight,height*.24);
 camera.setViewOffset(width,height,0,-header/2,width,height);
 const place=distance=>{camera.position.copy(target).addScaledVector(direction,distance);camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld();};
 const inside=distance=>{place(distance);return points.every(p=>{const v=p.clone().project(camera),x=(v.x+1)*width/2,y=(1-v.y)*height/2;return x>=3&&x<=width-3&&y>=header&&y<=height-3;});};
 let low=70,high=1100;
 for(let i=0;i<35;i++){const middle=(low+high)/2;if(inside(middle))high=middle;else low=middle;}
 place(high);
 return {target,position:camera.position.clone(),distance:high,header};
}
export function canvasCabinetLayout(width,height,navigationHeight=48){
 const header=Math.min(navigationHeight,height*.24),scale=Math.min((width-6)/103,(height-header-6)/204);
 return {scale,ox:(width-100*scale)/2,oy:header+(height-header-204*scale)/2+23*scale};
}
