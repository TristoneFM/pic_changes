import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request, { params }) {
  try {
    // In Next.js 15+, params is a Promise, in earlier versions it's an object
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    const picId = parseInt(id);

    console.log('Looking for file for PIC ID:', picId);

    if (!picId || isNaN(picId)) {
      return NextResponse.json(
        { error: 'Invalid PIC ID' },
        { status: 400 }
      );
    }

    // Check uploads directory for files matching this PIC ID
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'pics');
    
    console.log('Checking directory:', uploadsDir);
    console.log('Directory exists:', existsSync(uploadsDir));
    
    if (!existsSync(uploadsDir)) {
      console.log('Uploads directory does not exist');
      return NextResponse.json({
        filePath: null,
        exists: false,
      });
    }

    try {
      const files = await readdir(uploadsDir);
      console.log('Files in directory:', files);
      console.log('Looking for file starting with:', `pic_${picId}_`);
      
      // Find file that starts with pic_{picId}_
      const matchingFile = files.find(file => 
        file.startsWith(`pic_${picId}_`) && file.endsWith('.pdf')
      );

      console.log('Matching file found:', matchingFile);

      if (matchingFile) {
        const filePath = `/uploads/pics/${matchingFile}`;
        console.log('Returning file path:', filePath);
        return NextResponse.json({
          filePath: filePath,
          fileName: matchingFile,
          exists: true,
        });
      }

      console.log('No matching file found');
      return NextResponse.json({
        filePath: null,
        exists: false,
        debug: {
          searchedPattern: `pic_${picId}_*.pdf`,
          filesFound: files,
        },
      });
    } catch (error) {
      console.error('Error reading uploads directory:', error);
      return NextResponse.json({
        filePath: null,
        exists: false,
        error: error.message,
      });
    }
  } catch (error) {
    console.error('Error checking file:', error);
    return NextResponse.json(
      { error: 'Error checking file', details: error.message },
      { status: 500 }
    );
  }
}

