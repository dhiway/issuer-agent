// src/types/swagger-ui-express.d.ts
declare module 'swagger-ui-express' {
  import { RequestHandler } from 'express';

  export const serve: RequestHandler;
  export function setup(
    spec: any,
    options?: any,
    customCss?: any
  ): RequestHandler;
}
