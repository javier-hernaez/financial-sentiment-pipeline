export async function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><rect width="32" height="32" rx="8" fill="#080b12"/><rect x="5.5" y="5.5" width="21" height="21" rx="3.5" fill="#111827" stroke="#6366f1" stroke-width="2"/><line x1="20" y1="20" x2="27" y2="27" stroke="#818cf8" stroke-width="2.5" stroke-linecap="round"/><line x1="16" y1="10" x2="16" y2="22" stroke="#818cf8" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/><line x1="10" y1="16" x2="22" y2="16" stroke="#818cf8" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/><circle cx="16" cy="16" r="2.2" fill="#38bdf8"/></svg>`;
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
