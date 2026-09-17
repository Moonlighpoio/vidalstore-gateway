import { Module } from '@nestjs/common';
import { CatalogoRoutes } from './catalogo/catalogo.routes';
import { BibliotecaRoutes } from './biblioteca/biblioteca.routes';
import { LicenciasRoutes } from './licencias/licencias.routes';
import { HealthRoutes } from './health/health.routes';

@Module({
  imports: [],
  controllers: [CatalogoRoutes, BibliotecaRoutes, LicenciasRoutes, HealthRoutes],
  providers: [],
  exports: [],
})
export class RoutesModule {}