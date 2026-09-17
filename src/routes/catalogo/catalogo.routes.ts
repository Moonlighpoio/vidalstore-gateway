import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '../../auth/auth.guard';
import axios from 'axios';

@Controller('v1/catalogo')
@UseGuards(AuthGuard)
export class CatalogoRoutes {
  private readonly bffUrl = process.env.BFF_URL || 'http://localhost:8081';

  @Get()
  async getCatalogo(@Req() req: Request, @Res() res: Response) {
    try {
      const response = await axios.get(`${this.bffUrl}/v1/catalogo`, {
        headers: {
          Authorization: req.headers.authorization,
        },
      });
      res.json(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      res.status(status).json({ 
        error: 'Failed to fetch catalogo',
        message: error.message,
      });
    }
  }
}