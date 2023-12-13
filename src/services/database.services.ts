import { MongoClient, Db, Collection } from 'mongodb'
import { config } from 'dotenv'
import User from '~/models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import Follow from '~/models/schemas/Follow.schema'
config()
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASS_WORD}@cluster0.kdveown.mongodb.net/?retryWrites=true&w=majority`

class DatabaseServices {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME)
  }

  async connect() {
    try {
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.dir
    } 
  }
  
  get Users(): Collection<User> {
    return this.db.collection(process.env.DB_COLECTION_USERS as string)
  }

  get RefreshToken(): Collection<RefreshToken>{
    return this.db.collection(process.env.DB_COLECTION_REFESH_TOKEN as string)
  }

  get Follow():Collection<Follow>{
    return this.db.collection(process.env.DB_COLECTION_REFESH_FOLLOW as string)

  }
}

const database = new DatabaseServices()

export default database
