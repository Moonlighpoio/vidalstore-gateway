import { Controller, Get, Delete, Param, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '../../auth/auth.guard';
import axios from 'axios';

@Controller('v1/licencias')
@UseGuards(AuthGuard)
export class LicenciasRoutes {
  private readonly bffUrl = process.env.BFF_URL || 'http://localhost:8081';

  @Get()
  async getLicencias(@Req() req: Request, @Res() res: Response) {
    try {
      const response = await axios.get(`${this.bffUrl}/v1/licencias`, {
        headers: {
          Authorization: req.headers.authorization,
        },
      });
      res.json(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      res.status(status).json({ 
        error: 'Failed to fetch licencias',
        message: error.message,
      });
    }
  }

  @Delete(':licenciaId')
  async deleteLicencia(
    @Param('licenciaId') licenciaId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const response = await axios.delete(
        `${this.bffUrl}/v1/licencias/${licenciaId}`,
        {
          headers: {
            Authorization: req.headers.authorization,
          },
        },
      );
      res.json(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      res.status(status).json({ 
        error: 'Failed to revoke licencia',
        message: error.message,
      });
    }
  }
}