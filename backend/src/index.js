// backend/src/index.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const admin = require('firebase-admin');

// import your Category model
const Category = require('./models/Category');

const serviceAccount = require(
  path.resolve(__dirname, '..', 'serviceAccountKey.json')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
const PORT = process.env.PORT || 4000;

// CORS & JSON
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true
  })
);
app.use(express.json());

// connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(async () => {
    console.log('✅ MongoDB connected');
    await seedDefaultCategories();
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// seed function
async function seedDefaultCategories() {
  const defaultNames = [
    'To Do',
    'Movies',
    'Novels',
    'Animes',
    'Series',
    'Hotels',
    'Trips',
    'Treks',
    'Eateries'
  ];
  const adminUid = process.env.ADMIN_UID;

  for (const name of defaultNames) {
    await Category.updateOne(
      // match by exact name & public
      { name, isPublic: true },
      {
        // if new, set these fields
        $setOnInsert: {
          name,
          ownerUid: adminUid,
          isPublic: true
        }
      },
      { upsert: true }
    );
  }
  console.log('🌱 Default categories seeded');
}

// mount your existing routes
app.use('/categories', require('./routes/categories'));
app.use('/lists',      require('./routes/lists'));
app.use('/items',      require('./routes/items'));

// healthcheck
app.get('/', (_, res) => res.send('Collaborative List API is running'));

app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));