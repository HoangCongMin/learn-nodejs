import { Request, Response, NextFunction } from 'express'
import httpStatus from '~/constants/httpStatus'
import {omit} from 'lodash'
import {ErrorWithStatus} from '~/models/Errors'

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
   
  // res.status(err.status || httpStatus.internal_server_error).json(omit(err,'status'))
  
    try {
      if (err instanceof ErrorWithStatus) {
        return res.status(err.status).json(omit(err, ['status']))
      }
      const finalError: any = {}
      Object.getOwnPropertyNames(err).forEach((key) => {
        if (
          !Object.getOwnPropertyDescriptor(err, key)?.configurable ||
          !Object.getOwnPropertyDescriptor(err, key)?.writable
        ) {
          return
        }
        finalError[key] = err[key]
      })
      res.status(httpStatus.internal_server_error).json({
        message: finalError.message,
        errorInfo: omit(finalError, ['stack'])
      })
    } catch (error) {
      res.status(httpStatus.internal_server_error).json({
        message: 'Internal server error',
        errorInfo: omit(error as any, ['stack'])
      })
}}
