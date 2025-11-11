import { NextResponse } from 'next/server';
import prismaAreas from '@/lib/prismaAreas';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const areaId = searchParams.get('areaId') || '4'; // Default to area ID 4
    
    // Fetch subareas from areas_subarea table in the 'areas' database where id_area = 4
    // Using raw query since the table might not be in Prisma schema
    const subareas = await prismaAreas.$queryRaw`
      SELECT id_subarea, subarea 
      FROM areas_subarea 
      WHERE id_area = ${parseInt(areaId)}
      ORDER BY subarea ASC
    `;
    
    return NextResponse.json({ 
      success: true, 
      data: subareas 
    });
  } catch (error) {
    console.error('Error fetching subareas:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

