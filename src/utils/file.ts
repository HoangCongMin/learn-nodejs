import fs from 'fs'
import path from 'path'
import formidable, { File } from 'formidable'
import { Request } from 'express'

export const initFileImg = () => {
  if (!fs.existsSync(path.resolve('upload/image/temp'))) {
    fs.mkdirSync(path.resolve('upload/image/temp'), {
      recursive: true
    })
  }
}
export const initFileVideo = () => {
  if (!fs.existsSync(path.resolve('upload/video'))) {
    fs.mkdirSync(path.resolve('upload/video'), {
      recursive: true
    })
  }
}

export const createFileImg = async (req: Request) => {
  const form = formidable({
    uploadDir: path.resolve('upload/image/temp'),
    maxFileSize: 300 * 1084,
    maxTotalFileSize: 300 * 1084 * 4,
    keepExtensions: true,
    maxFiles: 4,
    filter: function ({ name, originalFilename, mimetype }) {
      const result = name === 'image' && Boolean(mimetype?.includes('image/'))
      if (!result) {
        form.emit('error' as any, new Error('loi khong phai anh hoac sai truong') as any)
      }
      return result
    }
  })
  const data = await new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      if (!Boolean(files.image)) {
        return reject(new Error('image khong duoc de rong'))
      }

      resolve(files.image as File[])
    })
  })

  return data
}

export const createFileVideo = async (req: Request) => {
  const form = formidable({
    uploadDir: path.resolve('upload/video'),
    maxFileSize: 50 * 1024 * 1084,
    filter: function ({ name, originalFilename, mimetype }) {
      return true
    }
  })

  const data = await new Promise<File>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      if (!Boolean(files.video)) {
        return reject(new Error('video khong duoc de rong'))
      }
      const result = (files.video as File[])[0]
      const fullName = (result.originalFilename as string).split('.')
      fs.renameSync(result.filepath, result.filepath + '.' + fullName[fullName.length - 1])
      result.newFilename = result.newFilename + '.' + fullName[fullName.length - 1]
      resolve((files.video as File[])[0])
    })
  })
  return data
}

export const getNameFormFullName = (value: string) => {
  const result = value.split('.')
  result.pop()
  return result.join(' ')
}
