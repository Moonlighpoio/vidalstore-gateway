import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthRoutes {
  @Get()
  getHealth(): { status: string; timestamp: string; uptime: number } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}