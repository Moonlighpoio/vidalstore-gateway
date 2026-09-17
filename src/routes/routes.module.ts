import { Module } from '@nestjs/common';
import { CatalogoRoutes } from './catalogo/catalogo.routes';
import { BibliotecaRoutes } from './biblioteca/biblioteca.routes';

@Module({
  imports: [],
  controllers: [CatalogoRoutes, BibliotecaRoutes],
  providers: [],
  exports: [],
})
export class RoutesModule {}