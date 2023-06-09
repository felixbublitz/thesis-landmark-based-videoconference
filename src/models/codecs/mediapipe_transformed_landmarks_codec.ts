import { RenderObject } from "../../renderer/renderer";
import { FaceMesh, InputImage, NormalizedLandmarkList } from "@mediapipe/face_mesh";
import { EncodableArray, EncodableCoordinates } from "../../encoding/types";
import { Codec } from "../../encoding/codec";

export class MediapipeTransformedLandmarksCodec implements Codec{
    private readonly faceMesh : FaceMesh;
    private readonly LIBRARY_FACE_MESH =  'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/';
    private currentLandMarks : NormalizedLandmarkList[];
    init = false;

    constructor(){
        this.faceMesh = new FaceMesh({locateFile: (file) => {
            return this.LIBRARY_FACE_MESH + file;
          }});
    }

    startEncoding() {
        this.startFaceDetection();
    }

    private async startFaceDetection(){
        this.faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
  
        this.faceMesh.onResults((results) => {
          if (results.multiFaceLandmarks && results.multiFaceLandmarks [0] != null)
            this.currentLandMarks = results.multiFaceLandmarks;
        });
  
        await this.faceMesh.initialize();
        this.init = true;
      }

    async encodeFrame(videoDom : HTMLVideoElement) : Promise<Int8Array> {
        if(!this.init) return;
        
        await this.faceMesh.send({image: videoDom as InputImage});
        const data = new EncodableArray();

        if(this.currentLandMarks != null){
            let landmarks = this.transformLandmarks(this.currentLandMarks[0]);
            landmarks.forEach((landmark : any)=>{
              data.add(new EncodableCoordinates(landmark.x, landmark.y, landmark.z))
            });

        }
        return data.encode(EncodableCoordinates, 8);;

    }

    decodeFrame(data : Int8Array) : RenderObject {
      const out = EncodableArray.decode(data, EncodableCoordinates, 8);
      return new RenderObject(out.getValue());
    }
    
  
    transformLandmarks = (landmarks : NormalizedLandmarkList) => {
      if (!landmarks) {
        return landmarks;
      }
    
      let hasVisiblity = !!landmarks.find(l => l.visibility);
    
      let minZ = 1e-4;
    
      // currently mediapipe facemesh js
      // has visibility set to undefined
      // so we use a heuristic to set z position of facemesh
      if (hasVisiblity) {
        landmarks.forEach(landmark => {
          let { z, visibility } = landmark;
          z = -z;
          if (z < minZ && visibility) {
            minZ = z
          }
        });
      } else {
        minZ = Math.max(-landmarks[234].z, -landmarks[454].z);
      }
     
      return landmarks.map(landmark => {
        let {x, y, z} = landmark;
        return {
          x: -0.5 + x,
          y: 0.5 - y,
          z: -z - minZ,
          visibility: landmark.visibility,
        }
      });
    }
  }


   
    