import { NextRequest, NextResponse } from 'next/server';
import { generateSpMetadata } from '@/lib/saml';

/**
 * GET /api/auth/saml/[issuerId]/metadata - Get SP metadata for SAML configuration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ issuerId: string }> }
) {
  try {
    const { issuerId } = await params;

    if (!issuerId) {
      return NextResponse.json({ error: 'Issuer ID required' }, { status: 400 });
    }

    const metadata = generateSpMetadata(issuerId);

    return new NextResponse(metadata, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="sp-metadata-${issuerId}.xml"`,
      },
    });
  } catch (error) {
    console.error('Generate SP metadata error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
