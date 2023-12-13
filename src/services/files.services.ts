import { createFileImg, getNameFormFullName, createFileVideo } from '~/utils/file'
import { Request } from 'express'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import { isProduction } from '~/constants/config'
import { config } from 'dotenv'

config()
class fileService {
  async cereateFile(req: Request) {
    const result = await createFileImg(req)
    const total = await Promise.all(
      result.map(async (item) => {
        await sharp(item.filepath)
          .jpeg()
          .toFile(path.resolve('upload/image', `${getNameFormFullName(item.newFilename)}.jpg`))

        fs.unlinkSync(item.filepath)
        return {
          url: isProduction
            ? `http://congminh/upload/${getNameFormFullName(item.newFilename)}.jpg`
            : `http://localhost:4000/medias/image/${getNameFormFullName(item.newFilename)}.jpg`
        }
      })
    )
    return total
  }

  async createFileVideo(req: Request) {
    const result = await createFileVideo(req)
    return {
      url: isProduction
        ? `http://congminh/upload/${result.newFilename}`
        : `http://localhost:4000/medias/video/${result.newFilename}`
    }
  }
}

const fileservice = new fileService()

export default fileservice
