import { Request } from "express";
import { File } from "multer";

export interface MulterRequest extends Request {
  file?: File;
}