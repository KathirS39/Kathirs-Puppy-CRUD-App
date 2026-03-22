import { Sequelize, DataTypes } from 'sequelize'
import dotenv from 'dotenv';
import cors from 'cors'
import express from 'express'

const bearToken = 'Bearer aaa.eyJzdWIiOiIxMjMifQ.bbb'
// This removes just the first 7 characters, which is "Bearer " (including the space)
const token = bearToken.slice(7)
const header = token.split('.')[0]
const payload = token.split('.')[1]
const signature = token.split('.')[2]

if(token) {
    console.log('TOKEN HAS A VALUE')
    console.log('Bearer Token:', bearToken)
    console.log('Token:', token)
    console.log('Header:', header)
    console.log('Payload:', payload)
    console.log('Signature:', signature)
} else {
    console.log('Token has no value')
}

dotenv.config()

const DB_SCHEMA = process.env.DB_SCHEMA || "app"
const useSsl = process.env.PGSSLMODE === "require"

const app = express()

app.use(cors())
app.use(express.json())

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER,
process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
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
});

const Puppies = sequelize.define('puppies', {
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
} , {
    schema: DB_SCHEMA,
    tableName: 'puppies',
    timestamps: false,
})

app.get('/', (req, res) => {
    res.send('Hello World!')
})

const PORT = process.env.PORT || 5001
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
        console.error('Error: ', err);
        process.exit(1); // Exit with failure code
    }
};

startServer();