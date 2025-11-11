import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Load configuration
export async function GET() {
  try {
    // Try to get configuration from database
    try {
      // Use Prisma.$queryRawUnsafe for dynamic queries
      const config = await prisma.$queryRawUnsafe(
        'SELECT * FROM configuration WHERE id = 1 LIMIT 1'
      );
      
      if (config && Array.isArray(config) && config.length > 0) {
        const configData = config[0];
        // Handle JSON column - MySQL returns it as a string or object
        let mandatoryApprovers = [];
        if (configData.mandatory_approvers) {
          if (typeof configData.mandatory_approvers === 'string') {
            mandatoryApprovers = JSON.parse(configData.mandatory_approvers);
          } else {
            mandatoryApprovers = configData.mandatory_approvers;
          }
        }
        
        // Handle areas - can be stored as JSON string or array
        let areas = [];
        if (configData.areas) {
          if (typeof configData.areas === 'string') {
            areas = JSON.parse(configData.areas);
          } else {
            areas = configData.areas;
          }
        } else if (configData.area_afectada) {
          // Legacy support: convert single area to array with approvers
          areas = [{ 
            id: 1, 
            name: configData.area_afectada,
            approvers: mandatoryApprovers || []
          }];
        }
        
        // Ensure each area has approvers array
        areas = areas.map(area => ({
          ...area,
          approvers: area.approvers || []
        }));
        
        return NextResponse.json({
          areas: areas || [],
        });
      }
    } catch (error) {
      // Table doesn't exist yet, return default values
      if (error.code === 'ER_NO_SUCH_TABLE' || error.message?.includes("doesn't exist")) {
        console.log('Configuration table not found, using defaults');
      } else {
        console.error('Error loading configuration:', error);
      }
    }
    
    // Return default empty configuration
    return NextResponse.json({
      areas: [],
    });
  } catch (error) {
    console.error('Error loading configuration:', error);
    return NextResponse.json(
      { error: 'Error al cargar la configuración' },
      { status: 500 }
    );
  }
}

// POST - Save configuration
export async function POST(request) {
  try {
    const data = await request.json();
    const { areas } = data;

    // Try to save to database
    try {
      // First, try to create the table if it doesn't exist
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS configuration (
          id INT PRIMARY KEY DEFAULT 1,
          areas TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      // Check if old column exists and migrate if needed
      try {
        const tableInfo = await prisma.$queryRawUnsafe(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'configuration' 
          AND COLUMN_NAME = 'area_afectada'
        `);
        
        if (tableInfo && Array.isArray(tableInfo) && tableInfo.length > 0) {
          // Old column exists, migrate data and add new column
          const oldData = await prisma.$queryRawUnsafe(
            'SELECT area_afectada FROM configuration WHERE id = 1 LIMIT 1'
          );
          
          if (oldData && Array.isArray(oldData) && oldData.length > 0 && oldData[0].area_afectada) {
            // Get old mandatory approvers if they exist
            let oldApprovers = [];
            try {
              const approversData = await prisma.$queryRawUnsafe(
                'SELECT mandatory_approvers FROM configuration WHERE id = 1 LIMIT 1'
              );
              if (approversData && Array.isArray(approversData) && approversData.length > 0 && approversData[0].mandatory_approvers) {
                if (typeof approversData[0].mandatory_approvers === 'string') {
                  oldApprovers = JSON.parse(approversData[0].mandatory_approvers);
                } else {
                  oldApprovers = approversData[0].mandatory_approvers;
                }
              }
            } catch (e) {
              // Column might not exist
            }
            
            // Convert old single area to array format with approvers
            const migratedAreas = [{ 
              id: 1, 
              name: oldData[0].area_afectada,
              approvers: oldApprovers || []
            }];
            const areasJson = JSON.stringify(migratedAreas);
            
            // Check if areas column exists
            const areasColumnInfo = await prisma.$queryRawUnsafe(`
              SELECT COLUMN_NAME 
              FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'configuration' 
              AND COLUMN_NAME = 'areas'
            `);
            
            if (!areasColumnInfo || !Array.isArray(areasColumnInfo) || areasColumnInfo.length === 0) {
              await prisma.$executeRawUnsafe(`ALTER TABLE configuration ADD COLUMN areas TEXT`);
            }
            
            await prisma.$executeRawUnsafe(`ALTER TABLE configuration DROP COLUMN area_afectada`);
            try {
              await prisma.$executeRawUnsafe(`ALTER TABLE configuration DROP COLUMN mandatory_approvers`);
            } catch (e) {
              // Column might not exist, ignore
            }
            await prisma.$executeRawUnsafe(`
              UPDATE configuration 
              SET areas = '${areasJson.replace(/'/g, "''")}' 
              WHERE id = 1
            `);
          } else {
            // Just add the new column and drop old one
            const areasColumnInfo = await prisma.$queryRawUnsafe(`
              SELECT COLUMN_NAME 
              FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'configuration' 
              AND COLUMN_NAME = 'areas'
            `);
            
            if (!areasColumnInfo || !Array.isArray(areasColumnInfo) || areasColumnInfo.length === 0) {
              await prisma.$executeRawUnsafe(`ALTER TABLE configuration ADD COLUMN areas TEXT`);
            }
            
            try {
              await prisma.$executeRawUnsafe(`ALTER TABLE configuration DROP COLUMN area_afectada`);
            } catch (dropError) {
              // Column might not exist, ignore
              console.log('Could not drop area_afectada column:', dropError);
            }
          }
        }
      } catch (migrationError) {
        // Migration failed, continue with normal save
        console.log('Migration check failed, continuing:', migrationError);
      }
      
      // Insert or update configuration
      const areasJson = JSON.stringify(areas || []);
      await prisma.$executeRawUnsafe(`
        INSERT INTO configuration (id, areas)
        VALUES (1, '${areasJson.replace(/'/g, "''")}')
        ON DUPLICATE KEY UPDATE
          areas = '${areasJson.replace(/'/g, "''")}'
      `);
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error saving configuration:', error);
      // If it's a table error, try creating it again
      if (error.code === 'ER_NO_SUCH_TABLE' || error.message?.includes("doesn't exist")) {
        try {
          await prisma.$executeRawUnsafe(`
            CREATE TABLE configuration (
              id INT PRIMARY KEY DEFAULT 1,
              areas TEXT,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
          `);
          
          const areasJson = JSON.stringify(areas || []);
          await prisma.$executeRawUnsafe(`
            INSERT INTO configuration (id, areas)
            VALUES (1, '${areasJson.replace(/'/g, "''")}')
          `);
          
          return NextResponse.json({ success: true });
        } catch (createError) {
          console.error('Error creating configuration table:', createError);
          throw createError;
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Error saving configuration:', error);
    return NextResponse.json(
      { error: 'Error al guardar la configuración' },
      { status: 500 }
    );
  }
}

