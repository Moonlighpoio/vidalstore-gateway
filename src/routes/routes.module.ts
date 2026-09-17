import { Module } from '@nestjs/common';
import { CatalogoRoutes } from './catalogo/catalogo.routes';

@Module({
  imports: [],
  controllers: [CatalogoRoutes],
  providers: [],
  exports: [],
})
export class RoutesModule {}