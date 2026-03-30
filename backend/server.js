import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import * as jose from 'jose';

// const bearToken = 'Bearer aaa.eyJzdWIiOiIxMjMifQ.bbb'
// // This removes just the first 7 characters, which is "Bearer " (including the space)
// const token = bearToken.slice(7)
// const header = token.split('.')[0]
// const payload = token.split('.')[1]
// const signature = token.split('.')[2]

// if(token) {
//     console.log('TOKEN HAS A VALUE')
//     console.log('Bearer Token:', bearToken)
//     console.log('Token:', token)
//     console.log('Header:', header)
//     console.log('Payload:', payload)
//     console.log('Signature:', signature)
// } else {
//     console.log('Token has no value')
// }

dotenv.config();

const DB_SCHEMA = process.env.DB_SCHEMA || 'app';
const useSsl = process.env.PGSSLMODE === 'require';

const app = express();
const PORT = process.env.PORT || 5001;

// Asgardeo JWKS URL for JWT verification
const ASGARDEO_ORG = process.env.ASGARDEO_ORG || 'fullstack39';
const JWKS_URI = `https://api.asgardeo.io/t/${ASGARDEO_ORG}/oauth2/jwks`;

app.use(cors());
app.use(express.json());

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5001,
    dialect: 'postgres',
    dialectOptions: useSsl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : undefined,
    define: {
      schema: DB_SCHEMA,
    },
  }
);

const Puppies = sequelize.define(
  'puppies',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    breed: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    schema: DB_SCHEMA,
    tableName: 'puppies',
    timestamps: false,
  }
);

// JWT auth middleware
async function authMiddleware(req, res, next) {
  const authHeader = (req.headers.authorization || '').trim();

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing auth',
      detail: 'Send Authorization: Bearer <access_token>',
    });
  }

  const token = authHeader.slice(7).trim();
  const looksLikeJwt = token && token.split('.').length === 3;

  if (!looksLikeJwt) {
    return res.status(401).json({
      error:
        'Access token is not a JWT. In Asgardeo, set your app to use JWT access tokens (Protocol tab).',
    });
  }

  try {
    const JWKS = jose.createRemoteJWKSet(new URL(JWKS_URI));
    const { payload } = await jose.jwtVerify(token, JWKS);

    req.userId = payload.sub;
    return next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).json({
      error: 'Invalid or expired token',
      detail: err.message,
    });
  }
}

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Protect all puppy routes
app.use('/puppies', authMiddleware);

// GET all puppies for this user only
app.get('/puppies', async (req, res) => {
  try {
    const puppies = await Puppies.findAll({
      where: { user_id: req.userId },
      order: [['id', 'ASC']],
    });

    res.json(puppies);
  } catch (err) {
    console.error('Error fetching puppies:', err);
    res.status(500).json({ error: 'Failed to fetch puppies' });
  }
});

// GET one puppy by ID only if owned by this user
app.get('/puppies/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const puppy = await Puppies.findOne({
      where: {
        id,
        user_id: req.userId,
      },
    });

    if (puppy) {
      res.json(puppy);
    } else {
      res.status(404).json({ error: 'Puppy not found or you do not own it' });
    }
  } catch (err) {
    console.error('Error fetching puppy:', err);
    res.status(500).json({ error: 'Failed to fetch puppy' });
  }
});

// POST a new puppy owned by this user
app.post('/puppies', async (req, res) => {
  const { name, breed, age } = req.body;

  if (!name || !breed || age === undefined || age === null) {
    return res.status(400).json({
      error: 'name, breed, and age are required',
    });
  }

  try {
    const newPuppy = await Puppies.create({
      name,
      breed,
      age,
      user_id: req.userId,
    });

    res.status(201).json(newPuppy);
  } catch (err) {
    console.error('Error creating puppy:', err);
    res.status(500).json({ error: 'Failed to create puppy' });
  }
});

// PUT update a puppy by ID only if owned by this user
app.put('/puppies/:id', async (req, res) => {
  const { id } = req.params;
  const { name, breed, age } = req.body;

  try {
    const puppy = await Puppies.findOne({
      where: {
        id,
        user_id: req.userId,
      },
    });

    if (!puppy) {
      return res.status(404).json({ error: 'Puppy not found or you do not own it' });
    }

    puppy.name = name ?? puppy.name;
    puppy.breed = breed ?? puppy.breed;
    puppy.age = age ?? puppy.age;

    await puppy.save();
    res.json(puppy);
  } catch (err) {
    console.error('Error updating puppy:', err);
    res.status(500).json({ error: 'Failed to update puppy' });
  }
});

// DELETE a puppy by ID only if owned by this user
app.delete('/puppies/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const puppy = await Puppies.findOne({
      where: {
        id,
        user_id: req.userId,
      },
    });

    if (!puppy) {
      return res.status(404).json({ error: 'Puppy not found or you do not own it' });
    }

    await puppy.destroy();
    res.json({ message: 'Puppy deleted successfully' });
  } catch (err) {
    console.error('Error deleting puppy:', err);
    res.status(500).json({ error: 'Failed to delete puppy' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected...');

    await Puppies.sync({ alter: true });
    console.log(`Puppies model synced in schema "${DB_SCHEMA}".`);

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

startServer();