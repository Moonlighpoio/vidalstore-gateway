import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import axios from 'axios';
import { AuthGuard } from '../../auth/auth.guard';

@Controller('v1/catalogo')
@UseGuards(AuthGuard)
export class CatalogoRoutes {
  private readonly bffUrl =
    process.env.BFF_URL || 'http://localhost:8081';

  @Get()
  async getCatalogo(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const response = await axios.get(
        `${this.bffUrl}/v1/catalogo`,
        {
          headers: this.forwardHeaders(req),
        },
      );

      res.status(response.status).json(response.data);
    } catch (error: unknown) {
      this.handleProxyError(error, res);
    }
  }

  @Post()
  async createCatalogoItem(
    @Body() body: unknown,
    @Req() req: Request,
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
    @Req() req: Request,
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

  private forwardHeaders(req: Request): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const authorization = req.headers.authorization;

    if (authorization) {
      headers.Authorization = authorization;
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