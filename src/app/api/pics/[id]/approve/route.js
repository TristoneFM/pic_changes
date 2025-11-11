import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request, { params }) {
  try {
    // Handle params - in Next.js 15+, params is a Promise
    let id;
    if (params && typeof params.then === 'function') {
      // params is a Promise (Next.js 15+)
      const resolvedParams = await params;
      id = resolvedParams?.id;
    } else if (params && typeof params === 'object') {
      // params is directly available (Next.js 13-14)
      id = params.id;
    } else {
      // Try to get id from URL as fallback
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      id = pathParts[pathParts.indexOf('pics') + 1];
    }
    
    console.log('Approval API - params:', params);
    console.log('Approval API - extracted id:', id);
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'PIC ID is required' },
        { status: 400 }
      );
    }

    // Ensure id is a valid number
    const picId = parseInt(id);
    if (isNaN(picId)) {
      return NextResponse.json(
        { success: false, error: `Invalid PIC ID: ${id}` },
        { status: 400 }
      );
    }

    const { approverId, status, comment } = await request.json();
    console.log('Approval API - picId:', picId, 'approverId:', approverId, 'status:', status);

    if (!approverId || !status) {
      return NextResponse.json(
        { success: false, error: 'approverId and status are required' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'status must be either "approved" or "rejected"' },
        { status: 400 }
      );
    }

    // Find the approval record for this PIC and approver
    const approval = await prisma.picApproval.findFirst({
      where: {
        picId: picId,
        approverId: approverId.toString(),
        approvalStatus: 'pending',
      },
    });

    if (!approval) {
      return NextResponse.json(
        { success: false, error: 'Pending approval not found for this PIC and approver' },
        { status: 404 }
      );
    }

    // Update the approval
    const updatedApproval = await prisma.picApproval.update({
      where: { id: approval.id },
      data: {
        approvalStatus: status,
        comment: comment || null,
        responseDate: new Date(),
      },
    });

    // Check if all approvals are completed
    const allApprovals = await prisma.picApproval.findMany({
      where: { picId: picId },
    });

    const allApproved = allApprovals.every(
      (a) => a.approvalStatus === 'approved'
    );
    const anyRejected = allApprovals.some(
      (a) => a.approvalStatus === 'rejected'
    );

    // Update PIC status based on approvals
    let picStatus = null;
    if (anyRejected) {
      picStatus = 'rejected';
    } else if (allApproved && allApprovals.length > 0) {
      picStatus = 'approved';
    }

    if (picStatus) {
      await prisma.pic.update({
        where: { id: picId },
        data: { status: picStatus },
      });
    }

    return NextResponse.json({
      success: true,
      data: { approval: updatedApproval, picStatus },
    });
  } catch (error) {
    console.error('Error approving/rejecting PIC:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

