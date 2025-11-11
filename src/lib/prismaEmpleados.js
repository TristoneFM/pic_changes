import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
if (typeof window === 'undefined') {
  dotenv.config();
}

const globalForPrismaEmpleados = globalThis;

// Separate Prisma client for the 'empleados' database
const prismaEmpleados = globalForPrismaEmpleados.prismaEmpleados || new PrismaClient({
  datasources: {
    db: {
      url: process.env.EMPLEADOS_DATABASE_URL
    }
  }
});

if (typeof window === 'undefined') {
  globalForPrismaEmpleados.prismaEmpleados = prismaEmpleados;
}

export default prismaEmpleados;

