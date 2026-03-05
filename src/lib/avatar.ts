const COLORS = [
  "#4F46E5", // indigo
  "#7C3AED", // violet
  "#DB2777", // pink
  "#059669", // emerald
  "#D97706", // amber
  "#DC2626", // red
  "#2563EB", // blue
  "#0891B2", // cyan
];

function getColorForUsername(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function generateAvatarSvg(username: string): string {
  const color = getColorForUsername(username);
  const letter = username[0].toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="50" fill="${color}"/>
  <text x="50" y="50" font-family="Arial, sans-serif" font-size="42" font-weight="bold"
    fill="white" text-anchor="middle" dominant-baseline="central">${letter}</text>
</svg>`;
}
