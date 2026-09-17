import { Controller, Get, Post, Body, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '../../auth/auth.guard';
import axios from 'axios';

@Controller('v1')
@UseGuards(AuthGuard)
export class BibliotecaRoutes {
  private readonly bffUrl = process.env.BFF_URL || 'http://localhost:8081';

  @Get('biblioteca')
  async getBiblioteca(@Req() req: Request, @Res() res: Response) {
    try {
      const response = await axios.get(`${this.bffUrl}/v1/biblioteca`, {
        headers: {
          Authorization: req.headers.authorization,
        },
      });
      res.json(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      res.status(status).json({ 
        error: 'Failed to fetch biblioteca',
        message: error.message,
      });
    }
  }

  @Post('compras')
  async postCompra(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const response = await axios.post(`${this.bffUrl}/v1/compras`, body, {
        headers: {
          Authorization: req.headers.authorization,
          'Content-Type': 'application/json',
        },
      });
      res.json(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      res.status(status).json({ 
        error: 'Failed to create compra',
        message: error.message,
      });
    }
  }
}