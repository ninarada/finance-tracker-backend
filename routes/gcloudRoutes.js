const path = require('path');
const dotenv = require('dotenv');
dotenv.config();   

const express = require('express');
const multer = require('multer');
const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;

const router = express.Router();
const upload = multer();

const client = new DocumentProcessorServiceClient();

router.post('/process', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send('No file uploaded.');

  const name = `projects/${process.env.GCLOUD_PROJECT_ID}/locations/${process.env.GCLOUD_REGION}/processors/${process.env.GCLOUD_PROCESSOR_ID}`;

  const request = {
    name,
    rawDocument: {
      content: file.buffer.toString('base64'),
      mimeType: file.mimetype,
    },
  };

  try {
    const [result] = await client.processDocument(request);
    
    const entities = result.document.entities;

    const responseData = {
      date: null,
      location: null,
      paymentMethod: null,
      storeName: null,
      totalAmount: null,
      items: []
    };

    for (const entity of entities) {
      const { type, mentionText, confidence } = entity;
      if (confidence < 0.7) continue; // skip low-confidence values

      switch (type) {
        case 'date':
          responseData.date = mentionText;
          break;
        case 'location':
          responseData.location = mentionText;
          break;
        case 'paymentMethod':
          responseData.paymentMethod = mentionText;
          break;
        case 'storeName':
          responseData.storeName = mentionText;
          break;
        case 'totalAmount':
          responseData.totalAmount = mentionText;
          break;
        case 'item':
          // we'll handle nested items below
          //responseData.items = mentionText;
          break;
      }

      const itemFieldMap = {
        itemName: 'itemName',
        itemTotalPrice: 'itemTotalPrice',
        itemQuantity: 'itemQuantity',
        itemUnitPrice: 'itemUnitPrice',
      };
      
      if (type in itemFieldMap) {
        // Try to find an existing incomplete item
        let currentItem = responseData.items.find(item => !item[type]);
        
        if (!currentItem || currentItem[type]) {
          // If all items already have this field filled, start a new item
          currentItem = {};
          responseData.items.push(currentItem);
        }
      
        currentItem[itemFieldMap[type]] = mentionText;
      }
      
    }

    res.json(responseData);
} catch (err) {
    console.error('Document AI Error:', err.response?.data || err.message || err);
    res.status(500).send('Document processing failed');
  }
  
});

module.exports = router;
