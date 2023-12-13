import { Request, Response, NextFunction } from 'express'
import path from 'path'
import fs from 'fs'

export const staticFileController = async (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params

  return res.sendFile(path.resolve(`upload/image`, name), function (err) {
    if (err) {
      res.status((err as any).status).send('not found')
    }
  })
}

export const staticFileVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params
  const { range } = req.headers
  if (!range) {
    return res.status(400).send('range la bat buoc')
  }

  
  const videoPath = path.resolve('upload/video', name)
  console.log(videoPath)

  const fileSize = fs.statSync(videoPath).size
  const chunkSize = 30 * 10 ** 6
  const start = Number(range.replace(/\D/g, ''))
  const end = Math.min(start + chunkSize, fileSize -1)

  const contentLength = end - start + 1 

  const contentType = 'video/mp4'
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }

  res.writeHead(600, headers)
  const videoSteams = fs.createReadStream(videoPath, { start, end })
  videoSteams.pipe(res)
}
