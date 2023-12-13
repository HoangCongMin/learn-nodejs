import httpStatus from '~/constants/httpStatus'
import { usersMessages } from '~/constants/messages'

export class ErrorWithStatus {
  message: string
  status: number
  constructor({ message, status }: { message: string; status: number }) {
    this.message = message
    this.status = status
  }
}

type errorsType = Record<
  string,
  {
    msg: string
    [key: string]: any
  }
>
export class entityError extends ErrorWithStatus {
  errors: errorsType
  constructor({ message = usersMessages.validation_error, errors }: { message?: string; errors: errorsType }) {
    super({ message, status: httpStatus.unprocessable_entity })
    this.errors = errors
  }
}
