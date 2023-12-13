import { Request, Response, NextFunction } from 'express'
import fileservice from '~/services/files.services'

export const testFormUploadController = async (req: Request, res: Response, next: NextFunction) => {
  const data = await fileservice.cereateFile(req)

  return res.json({
    data: data
  })
}

export const createFileVideosController = async (req: Request, res: Response, next: NextFunction) => {
  const data = await fileservice.createFileVideo(req)
  return res.json({
    data: data
  })
}
