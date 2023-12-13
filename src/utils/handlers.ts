import { Request, Response, NextFunction, RequestHandler } from 'express'

export const wrapAsync = <P>(Fn: RequestHandler<P,any,any,any>) => {
  return async (req: Request<P>, res: Response, next: NextFunction) => {
    try {
      await Fn(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
