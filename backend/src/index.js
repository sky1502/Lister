// backend/src/index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const admin = require('firebase-admin');
const prefRoutes = require('./routes/preferences');

// import your Category model
const Category = require('./models/Category');

const app = express();
const PORT = process.env.PORT || 4000;

// CORS & JSON
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
  })
);
app.use(express.json());

// Initialize Firebase Admin with service account from environment variable
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  )
});

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
      { name, isPublic: true },
      {
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
app.use('/preferences', prefRoutes);

// healthcheck
app.get('/', (_, res) => res.send('Collaborative List API is running'));

app.listen(PORT, () => console.log(`🚀 Backend listening on port ${PORT}`));
