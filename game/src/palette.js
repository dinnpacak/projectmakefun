// Shared sky palette; world and character materials use the voxel garden colors.
export const PALETTE = {
  canvas: '#72cff3',
  surface: '#21383d',
  hairline: '#2c323a',
  ink: '#e9e6df',
  muted: '#98a0a8',
  accent: '#d38a57',
};

export function shade(name) {
  return PALETTE[name];
}
