import { ValidationChain, validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'
import { ErrorWithStatus, entityError } from '~/models/Errors'
import httpStatus from '~/constants/httpStatus'
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req)
    const errors = validationResult(req)
    const errorsObject = errors.mapped()

    const errorsEntity = new entityError({ errors: {} })

    if (errors.isEmpty()) {
      return next()
    }
    for (const key in errorsObject) {
      const { msg } = errorsObject[key]
      if (msg instanceof ErrorWithStatus && msg.status !== httpStatus.unprocessable_entity) return next(msg)
      errorsEntity.errors[key] = errorsObject[key]
    }

    next(errorsEntity)
  }
}
