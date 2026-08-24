// Declara el módulo 'compression' (Express middleware gzip).
// TODO: reemplazar por `npm i -D @types/compression` cuando no haya
// un servidor dev bloqueando node_modules.
declare module 'compression' {
  import type { RequestHandler } from 'express';
  function compression(options?: { filter?: (req: unknown) => boolean; threshold?: number; level?: number }): RequestHandler;
  export = compression;
}
