import { Request, Response, NextFunction } from 'express'
import { pick } from 'lodash'

export const filterMiddllewares = (filterBody: string[]) => (req: Request, res: Response, next: NextFunction) => {
  req.body = pick(req.body, filterBody);
  next()
}
