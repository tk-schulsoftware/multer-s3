import { S3Client } from "@aws-sdk/client-s3";
import type multer from "@koa/multer";
import { PassThrough } from "stream";

export type Callback<T> = (error: Error | null, result?: T) => void;

export interface Transformer<T = unknown, U = unknown> {
  id: string;
  key: (req: T, file: U, cb: Callback<string>) => void;
  transform: (req: T, file: U, cb: Callback<PassThrough>) => void;
  getContentType?: (req: T, file: U, cb: Callback<string>) => void;
}

export interface S3StorageOptions<T = unknown, U = unknown> {
  s3: S3Client;
  bucket: string | ((req: T, file: U, cb: Callback<string>) => void);
  key?: string | ((req: T, file: U, cb: Callback<string>) => void);
  acl?: string | ((req: T, file: U, cb: Callback<string>) => void);
  contentType?: string | ((req: T, file: U, cb: Callback<string>) => void);
  metadata?: ((req: T, file: U, cb: Callback<any>) => void);
  cacheControl?: string | ((req: T, file: U, cb: Callback<string>) => void);
  contentDisposition?: string | ((req: T, file: U, cb: Callback<string>) => void);
  contentEncoding?: string | ((req: T, file: U, cb: Callback<string>) => void);
  storageClass?: string | ((req: T, file: U, cb: Callback<string>) => void);
  serverSideEncryption?: string | ((req: T, file: U, cb: Callback<string>) => void);
  sseKmsKeyId?: string | ((req: T, file: U, cb: Callback<string>) => void);
  shouldTransform?: boolean | ((req: T, file: U, cb: Callback<boolean>) => void);
  transformers?: Transformer<T, U>[];
}

export interface S3Storage<T = unknown, U = unknown> extends multer.StorageEngine {
  s3: S3Client;
  getBucket: (req: T, file: U, cb: Callback<string>) => void;
  getKey: (req: T, file: U, cb: Callback<string>) => void;
  getAcl: (req: T, file: U, cb: Callback<string>) => void;
  getContentType: (req: T, file: U, cb: Callback<string>) => void;
  getMetadata: (req: T, file: U, cb: Callback<any>) => void;
  getCacheControl: (req: T, file: U, cb: Callback<string>) => void;
  getContentDisposition: (req: T, file: U, cb: Callback<string>) => void;
  getStorageClass: (req: T, file: U, cb: Callback<string>) => void;
  getSSE: (req: T, file: U, cb: Callback<string>) => void;
  getSSEKMS: (req: T, file: U, cb: Callback<string>) => void;
  getShouldTransform: (req: T, file: U, cb: Callback<boolean>) => void;
  transformers: Transformer<T, U>[];
  directUpload: (opts: any, file: U, cb: Callback<any>) => void;
  transformUpload: (opts: any, req: any, file: U, cb: Callback<any>) => void;
  _handleFile: (req: T, file: U, cb: Callback<any>) => void;
  _removeFile: (req: T, file: U, cb: Callback<void>) => void;
}

export type MulterS3 = <T = unknown, U = unknown>(opts: S3StorageOptions<T, U>) => S3Storage<T, U>;

export type AutoContentType = <T = unknown, U = unknown>(req: T, file: U, cb: Callback<string>) => void;
export type DefaultContentType = <T = unknown, U = unknown>(req: T, file: U, cb: Callback<string>) => void;

export function multerS3<T = unknown, U = unknown>(opts: S3StorageOptions<T, U>): S3Storage<T, U>;
