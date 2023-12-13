import jwt from 'jsonwebtoken'
import { config } from 'dotenv'
config()

export const signToken = ({
  payload,
  privatekey,
  options
}: {
  payload: string | Buffer | object
  privatekey: string
  options?: jwt.SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(
      payload,
      privatekey,
      (options = {
        algorithm: 'HS256'
      }),
      (error, token) => {
        if (error) {
          throw reject(error)
        }
        resolve(token as string)
      }
    )
  })
}

export const verifyToken = ({ token, privatekey }: { token: string; privatekey: string }) => {
  return new Promise<jwt.JwtPayload>((resolve, reject) => {
    jwt.verify(token, privatekey, (error, decoded) => {
      if (error) {
        throw reject(error)
      }
      resolve(decoded as jwt.JwtPayload)
    })
  })
}
