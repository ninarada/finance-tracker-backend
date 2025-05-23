const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');

dotenv.config();

const userRoutes = require('./routes/userRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const gcloudRoutes = require('./routes/gcloudRoutes');

const { errorHandler } = require('./middleware/errorMiddleware');



const app = express();

app.use(cors()); 
app.use(express.json({ limit: '10mb' }));

app.use('/api/users', userRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/gcloud', gcloudRoutes); 

app.use(errorHandler);

connectDB().then(async () => {
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  
  }).catch((error) => {
    console.error(`Error while connecting to the database: ${error.message}`);
});