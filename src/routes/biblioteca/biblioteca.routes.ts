import { Controller, Get, Post, Body, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '../../auth/auth.guard';
import axios from 'axios';

interface AuthenticatedRequest extends Request {
  user?: {
    sub?: string;
    iss?: string;
    client_id?: string;
    'cognito:groups'?: string[];
    [key: string]: unknown;
  };
}

@Controller('v1')
@UseGuards(AuthGuard)
export class BibliotecaRoutes {
  // Unificado al puerto del BFF (3000)
  private readonly bffUrl = process.env.BFF_URL ?? 'http://localhost:3000';

  private forwardHeaders(req: AuthenticatedRequest): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    const subject = req.user?.sub;
    if (subject) {
      headers['x-user-sub'] = subject;
    }

    const groups = req.user?.['cognito:groups'];
    if (Array.isArray(groups)) {
      headers['x-user-groups'] = groups.join(',');
    }

    return headers;
  }

  @Get('biblioteca')
  async getBiblioteca(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    try {
      const response = await axios.get(`${this.bffUrl}/v1/biblioteca`, {
        headers: this.forwardHeaders(req),
      });
      res.status(response.status).json(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      res.status(status).json(error.response?.data || { message: error.message });
    }
  }

  @Post('compras')
  async postCompra(@Body() body: any, @Req() req: AuthenticatedRequest, @Res() res: Response) {
    try {
      const response = await axios.post(`${this.bffUrl}/v1/compras`, body, {
        headers: this.forwardHeaders(req),
      });
      res.status(response.status).json(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      res.status(status).json(error.response?.data || { message: error.message });
    }
  }
}