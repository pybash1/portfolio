export type FolderSide = "left" | "right";

export interface FolderLight {
  x: number;
  y: number;
  radius: number;
  opacity: number;
}

// Ray directions are slopes per unit of downward travel (dz = -1).
// A distant, small area light above-left, fixed in the folder's desk space.
export const defaultFolderLight: FolderLight = {
  x: 0.35,
  y: 0.45,
  radius: 0.11,
  opacity: 0.38,
};

export const folderOutlines = {
  front:
    "M87 0 H1002 V1000 H35 Q0 1000 0 974 V551 Q0 530 21 520 L39 509 Q52 501 52 480 V27 Q52 0 87 0 Z",
  back: "M-2 0 H997 Q1032 0 1032 27 V474 Q1032 492 1018 504 L1010 511 Q1000 520 1000 541 V974 Q1000 1000 965 1000 H-2 Z",
};

export function folderLightRays(light: FolderLight, count = 64) {
  return Array.from({ length: count }, (_, i) => {
    const radius = light.radius * Math.sqrt((i + 0.5) / count);
    const angle = i * Math.PI * (3 - Math.sqrt(5));

    return {
      x: light.x + radius * Math.cos(angle),
      y: light.y + radius * Math.sin(angle),
    };
  });
}

/** Exact directional ray/plane intersection for each point of the flat cover.
 * SVG x/y are sheet units; z uses x units. The receiver is z=0, hinge x=0.
 * Pshadow = Pcover + (ray.x, ray.y, -1) * Pcover.z.
 * The 14-unit clearance (stock plus the papers filed inside) keeps a soft
 * contact shadow along the shut cover's edge. It rolls in around the fold: a cover lying open beside the receiver is not
 * above it, so either fold side casts the same (no) crease shadow at rest.
 * Multiple rays yield distance-dependent penumbra, without an animated blur.
 */
export function projectFolderShadow(
  side: FolderSide,
  cosine: number,
  aspect: number,
  ray: { x: number; y: number },
) {
  const cos = Math.max(-1, Math.min(1, cosine));
  const sin = Math.sqrt(Math.max(0, 1 - cos * cos));
  const clearance = (14 * (1 + cos)) / 2;

  if (side === "left") {
    const horizontal = cos + ray.x * sin;

    return [
      -horizontal,
      -ray.y * sin * aspect,
      0,
      1,
      1000 * horizontal + ray.x * clearance,
      ray.y * (1000 * sin + clearance) * aspect,
    ];
  }

  return [
    -cos + ray.x * sin,
    ray.y * sin * aspect,
    0,
    1,
    ray.x * clearance,
    ray.y * clearance * aspect,
  ];
}
