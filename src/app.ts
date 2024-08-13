import 'dotenv/config'
import express, { NextFunction, Request, Response } from 'express'
import morgan from 'morgan'
import cors, { CorsOptions } from 'cors'
import createHttpError, { isHttpError } from 'http-errors'
import session from 'express-session'
import MongoStore from 'connect-mongo'

import notesRoutes from './routes/notes'
import userRoutes from './routes/users'
import env from './util/validateEnv'
import { requiresAuth } from './middleware/auth'

const app = express()

app.use(morgan('dev'))

app.use(express.json())

const whitelist = [
  'http://localhost:3000',
  'https://notes-app-frontend-phi.vercel.app/'
]

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin as string) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'), false)
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}

app.use(cors(corsOptions))

app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 60 * 60 * 1000
    },
    rolling: true,
    store: MongoStore.create({
      mongoUrl: env.MONGO_CONNECTION_STRING
    })
  })
)

app.use('/api/users', userRoutes)

app.use('/api/notes', requiresAuth, notesRoutes)

app.use((req, res, next) => {
  next(createHttpError(404, 'Endpoint not found'))
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error(error)
  let errorMessage = 'An unknown error ocurred'
  let statusCode = 500
  if (isHttpError(error)) {
    errorMessage = error.message
    statusCode = error.status
  }
  res.status(statusCode).json({ error: errorMessage })
})

export default app
