import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
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

@Controller('v1/auditoria')
@UseGuards(AuthGuard)
export class AuditoriaRoutes {
  private readonly bffUrl =
    process.env.BFF_URL ?? 'http://localhost:3000';

  private forwardHeaders(
    req: AuthenticatedRequest,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    if (req.user?.sub) {
      headers['x-user-sub'] = req.user.sub;
    }

    const groups = req.user?.['cognito:groups'];
    if (Array.isArray(groups)) {
      headers['x-user-groups'] = groups.join(',');
    }

    return headers;
  }

  @Get()
  async getAuditoria(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    try {
      const response = await axios.get(
        `${this.bffUrl}/v1/auditoria`,
        {
          headers: this.forwardHeaders(req),
        },
      );
      res.status(response.status).json(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      res
        .status(status)
        .json(error.response?.data || { message: error.message });
    }
  }
}