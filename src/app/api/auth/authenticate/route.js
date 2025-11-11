import { NextResponse } from 'next/server';
import prismaEmpleados from '@/lib/prismaEmpleados';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { authenticated: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Proxy the request to the external authentication server
    const authUrl = 'http://10.56.98.3:5001/PICS_AD/AUTHENTICATE';
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 10 second timeout
    
    let response;
    try {
      response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', fetchError);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { 
            authenticated: false, 
            message: 'Request timeout: Authentication server did not respond in time' 
          },
          { status: 504 }
        );
      }
      return NextResponse.json(
        { 
          authenticated: false, 
          message: `Error connecting to authentication server: ${fetchError.message}` 
        },
        { status: 500 }
      );
    }

    // Check if response is ok before parsing
    let data;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        return NextResponse.json(
          { 
            authenticated: false, 
            message: `Invalid response from authentication server: ${response.status} ${response.statusText}` 
          },
          { status: response.status || 500 }
        );
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { 
          authenticated: false, 
          message: 'Invalid response format from authentication server' 
        },
        { status: 500 }
      );
    }

    if (!response.ok || !data.authenticated) {
      return NextResponse.json(
        { authenticated: false, message: data.message || 'Authentication failed' },
        { status: response.status || 401 }
      );
    }

    // After successful authentication, look up emp_id using username
    try {
      const empleado = await prismaEmpleados.$queryRaw`
        SELECT emp_id, emp_alias 
        FROM del_empleados 
        WHERE emp_alias = ${data.username}
        LIMIT 1
      `;

      if (empleado && empleado.length > 0) {
        // Return authentication response with emp_id for compatibility
        return NextResponse.json({
          authenticated: true,
          success: true, // For compatibility with existing code
          data: {
            emp_id: empleado[0].emp_id,
            emp_alias: empleado[0].emp_alias,
          },
          // Also include original auth response data
          username: data.username,
          isAdmin: data.isAdmin,
          message: data.message,
          userInfo: data.userInfo,
          groups: data.groups,
        });
      } else {
        // User authenticated but not found in empleados table
        console.warn(`User ${data.username} authenticated but not found in empleados table`);
        return NextResponse.json({
          authenticated: true,
          success: false,
          message: `User authenticated but employee record not found for ${data.username}`,
          username: data.username,
          isAdmin: data.isAdmin,
          userInfo: data.userInfo,
          groups: data.groups,
        }, { status: 404 });
      }
    } catch (dbError) {
      console.error('Error looking up employee:', dbError);
      // Return auth success but with database lookup error
      return NextResponse.json({
        authenticated: true,
        success: false,
        message: 'Authentication successful but error looking up employee information',
        username: data.username,
        isAdmin: data.isAdmin,
        userInfo: data.userInfo,
        groups: data.groups,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Authentication proxy error:', error);
    const errorMessage = error.message || 'Unknown error';
    return NextResponse.json(
      { 
        authenticated: false, 
        message: `Error connecting to authentication server: ${errorMessage}` 
      },
      { status: 500 }
    );
  }
}

