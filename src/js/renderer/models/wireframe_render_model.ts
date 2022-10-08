import { drawConnectors } from "@mediapipe/drawing_utils";
import { FACEMESH_FACE_OVAL, FACEMESH_LEFT_EYE, FACEMESH_LEFT_EYEBROW, FACEMESH_LEFT_IRIS, FACEMESH_LIPS, FACEMESH_RIGHT_EYE, FACEMESH_RIGHT_EYEBROW, FACEMESH_RIGHT_IRIS, FACEMESH_TESSELATION } from "@mediapipe/face_mesh";
import { EncodableArray } from "../../encoding/types";
import { SequenceLogger } from "../../measuring/performance";
import { RenderObject } from "../renderer";
import { RenderModel } from "./render_model";

export class WireframeRenderModel implements RenderModel{

    domRenderer : HTMLCanvasElement = document.createElement('canvas');
    private width = 320;
    private height = 180;

    constructor(){
        this.domRenderer.width = this.width;
        this.domRenderer.height = this.height;
    }

    customPerformanceMeasurement(meter: SequenceLogger, renderObject: RenderObject): boolean {
        return false;
    }

    init(data: any): void {}

    renderFrame(renderObject: RenderObject): void {
        let canvas = this.domRenderer as HTMLCanvasElement;
        let context = canvas.getContext('2d');
        context.save();
        context.clearRect(0,0, this.width, this.height);
       
        let landmarks = renderObject.data as Array<any>;
        drawConnectors(context, landmarks, FACEMESH_TESSELATION,{color: '#C0C0C070', lineWidth: 1});
        drawConnectors(context, landmarks, FACEMESH_RIGHT_EYE, {color: '#C0C0C070'});
        drawConnectors(context, landmarks, FACEMESH_RIGHT_EYEBROW, {color: '#C0C0C070'});
        drawConnectors(context, landmarks, FACEMESH_RIGHT_IRIS, {color: '#C0C0C070'});
        drawConnectors(context, landmarks, FACEMESH_LEFT_EYE, {color: '#C0C0C070'});
        drawConnectors(context, landmarks, FACEMESH_LEFT_EYEBROW, {color: '#C0C0C070'});
        drawConnectors(context, landmarks, FACEMESH_LEFT_IRIS, {color: '#C0C0C070'});
        drawConnectors(context, landmarks, FACEMESH_FACE_OVAL, {color: '#C0C0C070'});
        drawConnectors(context, landmarks, FACEMESH_LIPS, {color: '#C0C0C070'});
        context.restore();
    }

    destruct(): void {}
    
}