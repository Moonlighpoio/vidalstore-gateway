import { Module } from '@nestjs/common';
import { CatalogoRoutes } from './catalogo/catalogo.routes';
import { BibliotecaRoutes } from './biblioteca/biblioteca.routes';
import { LicenciasRoutes } from './licencias/licencias.routes';
import { AuditoriaRoutes } from './auditoria/auditoria.routes';
import { HealthRoutes } from './health/health.routes';

@Module({
  imports: [],
  controllers: [CatalogoRoutes, BibliotecaRoutes, LicenciasRoutes, AuditoriaRoutes, HealthRoutes],
  providers: [],
  exports: [],
})
export class RoutesModule {}