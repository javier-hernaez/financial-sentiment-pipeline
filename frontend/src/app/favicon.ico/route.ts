// Same mark as app/icon.svg: three layers (Bronze, Silver, Gold) narrowing as data is refined
export async function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><rect width="32" height="32" rx="9" fill="#c6f24e"/><rect x="8" y="9" width="16" height="3.4" rx="1.7" fill="#000"/><rect x="8" y="14.3" width="11" height="3.4" rx="1.7" fill="#000"/><rect x="8" y="19.6" width="6" height="3.4" rx="1.7" fill="#000"/></svg>`;
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
