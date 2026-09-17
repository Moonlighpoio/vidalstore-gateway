import { Module } from '@nestjs/common';
import { CatalogoRoutes } from './catalogo/catalogo.routes';
import { BibliotecaRoutes } from './biblioteca/biblioteca.routes';
import { LicenciasRoutes } from './licencias/licencias.routes';

@Module({
  controllers: [CatalogoRoutes, BibliotecaRoutes, LicenciasRoutes],
})
export class RoutesModule {}