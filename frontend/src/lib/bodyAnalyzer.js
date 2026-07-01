// Body-language analyzer using MediaPipe FaceLandmarker + PoseLandmarker.
// Client-side, free. Tracks eye-contact % and posture score in real time.

let visionModule = null;
let faceLandmarker = null;
let poseLandmarker = null;

const VISION_WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const FACE_MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const POSE_MODEL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";

async function ensureLoaded() {
  if (faceLandmarker && poseLandmarker) return;
  visionModule = await import("@mediapipe/tasks-vision");
  const { FilesetResolver, FaceLandmarker, PoseLandmarker } = visionModule;
  const fileset = await FilesetResolver.forVisionTasks(VISION_WASM);
  faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: FACE_MODEL, delegate: "GPU" },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: false,
  });
  poseLandmarker = await PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: POSE_MODEL, delegate: "GPU" },
    runningMode: "VIDEO",
    numPoses: 1,
  });
}

function blendshapeScore(cats, name) {
  const c = cats?.find((k) => k.categoryName === name);
  return c ? c.score : 0;
}

// Returns { eyeContact (0-1), posture (0-1) } for the current video frame.
function analyzeOnce(video, tsMs) {
  const out = { eyeContact: null, posture: null };
  try {
    const fRes = faceLandmarker.detectForVideo(video, tsMs);
    if (fRes?.faceBlendshapes?.length) {
      const cats = fRes.faceBlendshapes[0].categories;
      // The higher these values, the more the eyes deviate from the camera.
      const dev = Math.max(
        blendshapeScore(cats, "eyeLookInLeft"),
        blendshapeScore(cats, "eyeLookInRight"),
        blendshapeScore(cats, "eyeLookOutLeft"),
        blendshapeScore(cats, "eyeLookOutRight"),
        blendshapeScore(cats, "eyeLookUpLeft"),
        blendshapeScore(cats, "eyeLookUpRight"),
        blendshapeScore(cats, "eyeLookDownLeft"),
        blendshapeScore(cats, "eyeLookDownRight"),
      );
      const closed = Math.max(
        blendshapeScore(cats, "eyeBlinkLeft"),
        blendshapeScore(cats, "eyeBlinkRight"),
      );
      if (closed > 0.7) {
        out.eyeContact = null; // blink — skip sample
      } else {
        // dev ~ 0..0.7 typical range. Contact = 1 - min(dev / 0.35, 1)
        out.eyeContact = Math.max(0, Math.min(1, 1 - dev / 0.35));
      }
    }
  } catch (e) { /* face detect can fail if resolution not ready */ }

  try {
    const pRes = poseLandmarker.detectForVideo(video, tsMs);
    const lm = pRes?.landmarks?.[0];
    if (lm && lm.length >= 13) {
      const ls = lm[11]; // left shoulder
      const rs = lm[12]; // right shoulder
      const nose = lm[0];
      // Shoulder tilt (radians) — good ≈ 0
      const dy = ls.y - rs.y;
      const dx = ls.x - rs.x || 0.0001;
      const tilt = Math.atan2(Math.abs(dy), Math.abs(dx)); // 0 = level
      const tiltScore = Math.max(0, 1 - tilt / 0.35); // >20° tilt → 0

      // Head lean: horizontal distance of nose from shoulder midpoint
      const midX = (ls.x + rs.x) / 2;
      const lean = Math.abs((nose?.x ?? midX) - midX);
      const leanScore = Math.max(0, 1 - lean / 0.15);

      // Slump: shoulder Y position (higher = closer to top = better upright).
      // If shoulders are very low (large y), user is slumping toward camera.
      const shoulderY = (ls.y + rs.y) / 2;
      const uprightScore = Math.max(0, Math.min(1, (1.05 - shoulderY) / 0.6));

      out.posture = tiltScore * 0.4 + leanScore * 0.3 + uprightScore * 0.3;
    }
  } catch (e) { /* pose detect can fail */ }

  return out;
}

// Public helper: start a rolling analyzer for a given <video> element.
// Returns { stop, sample } where sample() returns { eyeContact, posture, samples } aggregated so far.
export async function startBodyAnalyzer(video) {
  await ensureLoaded();
  let running = true;
  const samples = { eye: [], posture: [] };
  const live = { eye: 0, posture: 0 };
  let lastTs = 0;
  const loop = () => {
    if (!running) return;
    const now = performance.now();
    if (video.readyState >= 2 && now - lastTs >= 200) { // ~5 fps
      lastTs = now;
      const { eyeContact, posture } = analyzeOnce(video, now);
      if (eyeContact != null) { samples.eye.push(eyeContact); live.eye = eyeContact; }
      if (posture != null) { samples.posture.push(posture); live.posture = posture; }
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  return {
    live,
    stop: () => { running = false; },
    reset: () => { samples.eye = []; samples.posture = []; },
    snapshot: () => {
      const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      return {
        eye_contact_pct: Math.round(avg(samples.eye) * 100),
        posture_score: Math.round(avg(samples.posture) * 100),
        eye_samples: samples.eye.length,
        posture_samples: samples.posture.length,
      };
    },
  };
}
