import { NextResponse } from 'next/server';
import prismaEmpleados from '@/lib/prismaEmpleados';

export async function GET(request) {
  try {
    // Fetch employees from del_empleados table in the 'empleados' database
    // Only where emp_alias exists (not null and not empty)
    // Using raw query since the table might not be in Prisma schema
    const empleados = await prismaEmpleados.$queryRaw`
      SELECT emp_id, emp_alias 
      FROM del_empleados 
      WHERE emp_alias IS NOT NULL AND emp_alias != ''
      ORDER BY emp_alias ASC
    `;
    
    return NextResponse.json({ 
      success: true, 
      data: empleados 
    });
  } catch (error) {
    console.error('Error fetching empleados:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

