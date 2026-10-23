export type LocalRenderOptions = {
  image: HTMLImageElement;
  canvas: HTMLCanvasElement;
  durationSeconds: number;
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:5";
  onProgress?: (progress: number) => void;
};

const dimensions: Record<LocalRenderOptions["aspectRatio"], [number, number]> = {
  "16:9": [1280, 720],
  "9:16": [720, 1280],
  "1:1": [900, 900],
  "4:5": [900, 1125],
};

function drawCover(context: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number, progress: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight) * (1.04 + progress * 0.12);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const x = (width - drawWidth) / 2 - progress * width * 0.025;
  const y = (height - drawHeight) / 2 - progress * height * 0.018;
  context.drawImage(image, x, y, drawWidth, drawHeight);
  const vignette = context.createRadialGradient(width / 2, height / 2, width * 0.1, width / 2, height / 2, width * 0.75);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(3,7,18,.5)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);
}

export async function renderPhotoToWebM(options: LocalRenderOptions): Promise<Blob> {
  const [width, height] = dimensions[options.aspectRatio];
  options.canvas.width = width;
  options.canvas.height = height;
  const context = options.canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is not supported in this browser");
  const stream = options.canvas.captureStream(30);
  const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((type) => MediaRecorder.isTypeSupported(type));
  if (!mimeType) throw new Error("WebM recording is not supported in this browser");
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5_000_000 });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data); };
  const result = new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error("Local recording failed"));
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
  });
  const started = performance.now();
  const durationMs = options.durationSeconds * 1000;
  const frame = () => {
    const progress = Math.min(1, (performance.now() - started) / durationMs);
    context.fillStyle = "#030712";
    context.fillRect(0, 0, width, height);
    drawCover(context, options.image, width, height, progress);
    options.onProgress?.(progress);
    if (progress < 1 && recorder.state === "recording") requestAnimationFrame(frame);
    else if (recorder.state === "recording") recorder.stop();
  };
  recorder.start(250);
  requestAnimationFrame(frame);
  return result;
}
