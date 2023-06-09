import { SequenceLogger, TimeMeasuringItem } from "../../logging/sequence_logger";
import { RenderObject } from "../../renderer/renderer";
import { RenderModel } from "../../renderer/render_model";

const S_TO_MS = 1000;

export class VideoRenderModel implements RenderModel{

    domRenderer : HTMLVideoElement = document.createElement('video');

    constructor(width : number, height : number){
        this.domRenderer.width = width;
        this.domRenderer.height = height;
        this.domRenderer.autoplay = true;
        this.domRenderer.playsInline = true;
    }

    customPerformanceMeasurement(meter: SequenceLogger, renderObject : RenderObject): boolean {
        return true;
    }

    init(data: any): void {}

    renderFrame(renderObject: RenderObject) {
        this.domRenderer.srcObject = renderObject.data.stream;
    }

    destruct(): void {
        let video = this.domRenderer as HTMLVideoElement;
        video.pause();
        video.removeAttribute('src');
        window.setTimeout(() => {
            video.load();
        }, (50));
    }

}