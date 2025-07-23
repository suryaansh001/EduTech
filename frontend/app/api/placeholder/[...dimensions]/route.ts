import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { dimensions: string[] } }
) {
  const [width = '100', height = '100'] = params.dimensions
  
  // Create a simple SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
      <line x1="0" y1="0" x2="${width}" y2="${height}" stroke="#9ca3af" stroke-width="2"/>
      <line x1="0" y1="${height}" x2="${width}" y2="0" stroke="#9ca3af" stroke-width="2"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="12" fill="#6b7280" text-anchor="middle" dominant-baseline="middle">
        ${width}×${height}
      </text>
    </svg>
  `
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  })
}
