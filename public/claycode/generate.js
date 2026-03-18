/**
 * ClayCode Image Generator (headless, postMessage driven)
 * Based on scene_image_claycode.js from https://github.com/marcomaida/claycode
 * MIT License with Commons Clause
 */

import { } from "./geometry/vector.js";
import { } from "./geometry/math.js";
import { clearDrawing, initDrawing } from "./packer/draw.js";
import { drawClaycode } from "./packer/draw_polygon_claycode.js";
import { area } from "./geometry/geometry.js";
import { textToTree } from "./conversion/convert.js";
import { createCirclePolygon } from "./geometry/shapes.js";
import { duplicateTreeNTimes } from "./tree/util.js";
import { createBinaryImage } from "./image_processing/binary_image.js";
import { computeContourPolygons } from "./image_processing/contour.js";
import { drawPolygon } from "./packer/draw.js";
import { packClaycode } from "./packer/pack.js";
import { DefaultBrush } from "./packer/packer_brush.js";

const CANVAS_SIZE = 800;
const HEDGEHOG_URL = "./images/hedgehog.png";
const REDUNDANCY = 1;
const BORDER_SIZE = 0.05;

let app = null;

function distributeFragments(polygons, targetNumFragments, minAreaPerc) {
  const total_area = polygons.reduce((acc, p) => acc + area(p), 0);
  const minArea = minAreaPerc * total_area;
  const areas = polygons.map((p) => area(p));
  const filteredTotalArea = areas.reduce((acc, curr) => curr >= minArea ? acc + curr : acc, 0);

  return polygons.map((p) => {
    const polygonArea = area(p);
    if (polygonArea < minArea) return 0;
    return Math.round((polygonArea / filteredTotalArea) * targetNumFragments);
  });
}

async function initApp() {
  app = new PIXI.Application({
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    backgroundColor: 0x000000,
    resolution: 1,
    antialias: true,
  });
  document.getElementById("pixiDiv").appendChild(app.view);
  initDrawing(app);
}

async function loadHedgehogPolygons() {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      // Create canvas and draw image
      const canvas = document.createElement("canvas");
      canvas.width = CANVAS_SIZE;
      canvas.height = CANVAS_SIZE;
      const ctx = canvas.getContext("2d");

      // Center the image in the canvas
      const scale = Math.min(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height) * 0.8;
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (CANVAS_SIZE - w) / 2;
      const y = (CANVAS_SIZE - h) / 2;
      ctx.drawImage(img, x, y, w, h);

      // Convert to binary image (alpha channel)
      const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      const binaryImage = [];
      for (let row = 0; row < CANVAS_SIZE; row++) {
        const rowData = [];
        for (let col = 0; col < CANVAS_SIZE; col++) {
          const idx = (row * CANVAS_SIZE + col) * 4;
          rowData.push(imageData.data[idx + 3] === 0 ? 0 : 1);
        }
        binaryImage.push(rowData);
      }

      const center = new PIXI.Vec(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
      const polygons = computeContourPolygons(binaryImage, center, CANVAS_SIZE);
      resolve(polygons);
    };
    img.onerror = () => reject(new Error("Failed to load hedgehog image"));
    img.src = HEDGEHOG_URL;
  });
}

async function generateClaycode(downloadCode) {
  const polygons = await loadHedgehogPolygons();
  if (!polygons || polygons.length === 0) {
    throw new Error("No polygons extracted from hedgehog image");
  }

  const tree = textToTree(downloadCode);
  const fragmentsDistribution = distributeFragments(polygons, REDUNDANCY, 0.0);

  const treesAndPolygons = [];
  for (let i = 0; i < polygons.length; i++) {
    const numFragments = fragmentsDistribution[i];
    const polygon = polygons[i];

    let t = null;
    if (numFragments === 0) {
      // Too small polygon, skip
      continue;
    } else {
      t = duplicateTreeNTimes(tree, numFragments);
    }

    if (packClaycode(t, polygon)) {
      treesAndPolygons.push([t, polygon]);
    }
  }

  // Draw
  clearDrawing();

  // Draw border (square frame)
  const center = new PIXI.Vec(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
  const spriteSize = CANVAS_SIZE * 0.8;
  const borderExternal = createCirclePolygon(
    center, spriteSize * (0.707106 + BORDER_SIZE), 4, new PIXI.Vec(1, 1), 45
  );
  const borderInternal = createCirclePolygon(
    center, spriteSize * 0.707106, 4, new PIXI.Vec(1, 1), 45
  );
  drawPolygon(borderExternal, 0xffffff);
  drawPolygon(borderInternal, 0xffffff);

  // Draw ClayCode patterns
  const brush = new DefaultBrush();
  for (const [t, polygon] of treesAndPolygons) {
    drawClaycode(t, polygon, brush);
  }

  // Force render
  app.renderer.render(app.stage);

  // Export canvas
  return app.view.toDataURL("image/png");
}

// Initialize and listen for messages
await initApp();

window.addEventListener("message", async (event) => {
  if (!event.data || event.data.type !== "generate") return;

  try {
    const { downloadCode } = event.data;
    if (!downloadCode) {
      parent.postMessage({ type: "error", error: "No downloadCode provided" }, "*");
      return;
    }

    const dataUrl = await generateClaycode(downloadCode);
    parent.postMessage({ type: "result", dataUrl }, "*");
  } catch (err) {
    parent.postMessage({ type: "error", error: err.message || "Generation failed" }, "*");
  }
});

// Signal ready
parent.postMessage({ type: "ready" }, "*");
