import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import axios from 'axios';
import { AuthGuard } from '../../auth/auth.guard';


interface AuthenticatedRequest extends Request {
  user?: {
    sub?: string;
    iss?: string;
    client_id?: string;
    'cognito:groups'?: string[];
    [key: string]: unknown;
  };
}


@Controller('v1/catalogo')
@UseGuards(AuthGuard)
export class CatalogoRoutes {
  private readonly bffUrl =
    process.env.BFF_URL ?? 'http://localhost:3000';


  @Get()
  async getCatalogo(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const headers = this.forwardHeaders(req);
      
      console.log('📡 Headers enviados al BFF:', JSON.stringify(headers, null, 2));
      console.log('📡 BFF URL:', this.bffUrl);


      const response = await axios.get(
        `${this.bffUrl}/v1/catalogo`,
        {
          headers,
        },
      );


      res.status(response.status).json(response.data);
    } catch (error: unknown) {
      console.error('❌ Error al contactar BFF:', error instanceof Error ? error.message : error);
      this.handleProxyError(error, res);
    }
  }


  @Post()
  async createCatalogoItem(
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const response = await axios.post(
        `${this.bffUrl}/v1/catalogo`,
        body,
        {
          headers: this.forwardHeaders(req),
        },
      );


      res.status(response.status).json(response.data);
    } catch (error: unknown) {
      this.handleProxyError(error, res);
    }
  }


  @Put(':id')
  async updateCatalogoItem(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const response = await axios.put(
        `${this.bffUrl}/v1/catalogo/${encodeURIComponent(id)}`,
        body,
        {
          headers: this.forwardHeaders(req),
        },
      );


      res.status(response.status).json(response.data);
    } catch (error: unknown) {
      this.handleProxyError(error, res);
    }
  }


  private forwardHeaders(
    req: AuthenticatedRequest,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };


    const authorization = req.headers.authorization;


    if (authorization) {
      headers.Authorization = authorization;
    }


    const subject = req.user?.sub;


    if (!subject) {
      throw new Error('Authenticated subject is required');
    }


    headers['x-user-sub'] = subject;


    const groups = req.user?.['cognito:groups'];


    if (Array.isArray(groups)) {
      headers['x-user-groups'] = groups.join(',');
    }


    return headers;
  }


  private handleProxyError(
    error: unknown,
    res: Response,
  ): void {
    if (axios.isAxiosError(error) && error.response) {
      res
        .status(error.response.status)
        .json(error.response.data);
      return;
    }


    res.status(502).json({
      statusCode: 502,
      error: 'Bad Gateway',
      message: 'Catalog service is unavailable',
    });
  }
}