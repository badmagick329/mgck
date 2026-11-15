import type { Size, SourceRect } from './output-preview';

/**
 * The previews' route from the editor's video to their canvases.
 *
 * Firefox's 2D `drawImage` of a hardware-decoded video reads the whole frame
 * back from the GPU and converts it on the CPU, however small the target:
 * about 13 ms per draw for 1080p and 50 ms for 4K, which held even a single
 * preview to a few frames a second and made the editor's video drop frames.
 * Uploading the frame to a WebGL texture stays on the GPU (about 2 ms at any
 * size), so each video's frame is uploaded once, mipmapped, and each preview
 * gets its region rendered at its own canvas size, which a 2D canvas then
 * copies cheaply. Without WebGL2 the previews draw from the video directly.
 */
type Renderer = {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  region: WebGLUniformLocation;
};

type Feed = {
  /** Created on the first region asked for; null when WebGL2 is unavailable. */
  renderer?: Renderer | null;
  /** Set when the video may show a new frame; the next read re-uploads it. */
  stale: boolean;
  listeners: Set<() => void>;
  stop: () => void;
};

const feeds = new WeakMap<HTMLVideoElement, Feed>();

const vertexShader = `#version 300 es
in vec2 corner;
uniform vec4 region;
out vec2 texel;
void main() {
  // Texture rows run top-down, clip space bottom-up.
  texel = region.xy + vec2(corner.x * 0.5 + 0.5, 0.5 - corner.y * 0.5) * region.zw;
  gl_Position = vec4(corner, 0.0, 1.0);
}`;

const fragmentShader = `#version 300 es
precision mediump float;
in vec2 texel;
uniform sampler2D frame;
out vec4 colour;
void main() {
  colour = texture(frame, texel);
}`;

function createRenderer(): Renderer | null {
  const canvas = document.createElement('canvas');
  // The canvas is read by `drawImage`, never shown, so the buffer must not
  // be cleared behind the reader's back.
  const gl = canvas.getContext('webgl2', {
    preserveDrawingBuffer: true,
    antialias: false,
    depth: false,
  });
  if (!gl) return null;
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  };
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexShader));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentShader));
  gl.bindAttribLocation(program, 0, 'corner');
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  // Mipmaps keep a 4K frame shrunk to a 22 px emoji from aliasing.
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_LINEAR
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  // The canvas is premultiplied, so a transparent video must be too.
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  return {
    canvas,
    gl,
    region: gl.getUniformLocation(program, 'region')!,
  };
}

function startFeed(video: HTMLVideoElement): Feed {
  const feed: Feed = { stale: true, listeners: new Set(), stop: () => {} };
  const changed = () => {
    feed.stale = true;
    for (const listener of feed.listeners) listener();
  };
  video.addEventListener('loadeddata', changed);
  video.addEventListener('seeked', changed);
  let frame = 0;
  let handle: number | undefined;
  if ('requestVideoFrameCallback' in video) {
    // Fires once per presented frame, during playback and after a seek,
    // and not at all while paused.
    handle = video.requestVideoFrameCallback(function onFrame() {
      changed();
      handle = video.requestVideoFrameCallback(onFrame);
    });
  } else {
    // Older browsers without frame callbacks; the DOM types assume them.
    const media: HTMLMediaElement = video;
    frame = requestAnimationFrame(function tick() {
      if (!media.paused) changed();
      frame = requestAnimationFrame(tick);
    });
  }
  feed.stop = () => {
    video.removeEventListener('loadeddata', changed);
    video.removeEventListener('seeked', changed);
    if (handle !== undefined) video.cancelVideoFrameCallback(handle);
    cancelAnimationFrame(frame);
    feed.renderer?.gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
  return feed;
}

/** Calls `onFrame` whenever the video may show a new frame. */
export function subscribeToFrames(
  video: HTMLVideoElement,
  onFrame: () => void
): () => void {
  let feed = feeds.get(video);
  if (!feed) {
    feed = startFeed(video);
    feeds.set(video, feed);
  }
  feed.listeners.add(onFrame);
  return () => {
    feed.listeners.delete(onFrame);
    if (feed.listeners.size > 0) return;
    feed.stop();
    feeds.delete(video);
  };
}

/**
 * `source` (video pixels) of a subscribed video's current frame, as an image
 * and the rectangle of it to draw at `size`; null before the first decoded
 * frame. The image is shared and only good until the next call, so draw it
 * straight away.
 */
export function frameRegion(
  video: HTMLVideoElement,
  source: SourceRect,
  size: Size
): { image: CanvasImageSource; source: SourceRect } | null {
  const feed = feeds.get(video);
  if (!feed || video.readyState < 2 || !video.videoWidth) return null;
  if (feed.renderer === undefined) feed.renderer = createRenderer();
  const renderer = feed.renderer;
  if (!renderer || renderer.gl.isContextLost()) return { image: video, source };
  const { canvas, gl, region } = renderer;
  if (feed.stale) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    gl.generateMipmap(gl.TEXTURE_2D);
    feed.stale = false;
  }
  if (canvas.width !== size.width) canvas.width = size.width;
  if (canvas.height !== size.height) canvas.height = size.height;
  gl.viewport(0, 0, size.width, size.height);
  gl.uniform4f(
    region,
    source.x / video.videoWidth,
    source.y / video.videoHeight,
    source.width / video.videoWidth,
    source.height / video.videoHeight
  );
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  return {
    image: canvas,
    // Named, not spread: a canvas passed as the size keeps them on its prototype.
    source: { x: 0, y: 0, width: size.width, height: size.height },
  };
}
