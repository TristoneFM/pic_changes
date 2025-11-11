import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const approverId = searchParams.get('approverId');

    if (!approverId) {
      return NextResponse.json(
        { success: false, error: 'approverId is required' },
        { status: 400 }
      );
    }

    console.log('API: Fetching pending approvals for approverId (emp_id):', approverId);

    // Get PICs that have pending approvals for this approver (using employee login ID)
    // Exclude PICs that have been rejected by any approver
    const pics = await prisma.pic.findMany({
      where: {
        AND: [
          {
            approvals: {
              some: {
                approverId: approverId.toString(),
                approvalStatus: 'pending',
              },
            },
          },
          {
            // Exclude PICs that have been rejected by any approver
            approvals: {
              none: {
                approvalStatus: 'rejected',
              },
            },
          },
        ],
      },
      include: {
        procedureSteps: true,
        documents: true,
        validations: true,
        approvals: true,
        availability: true,
        changeReason: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`API: Found ${pics.length} PICs with pending approvals for emp_id: ${approverId}`);

    return NextResponse.json({ success: true, data: pics });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

