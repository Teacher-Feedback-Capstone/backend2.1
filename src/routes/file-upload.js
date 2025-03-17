const express = require('express');
const AWS = require('aws-sdk');
const multer = require('multer');
const dotenv = require('dotenv');
const File = require('../models/File');
const authMiddleware = require('../middleware/jwtAuth'); // Authentication middleware

// Redis and BullMQ
const { Queue } = require('bullmq');
const Redis = require('ioredis');

dotenv.config();

const router = express.Router();

// AWS S3 Configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Redis Connection
const redisConnection = new Redis({
    host: '127.0.0.1',
    port: 6378,
    maxRetriesPerRequest: null, // REQUIRED for BullMQ
});

// BullMQ Queue
const fileProcessingQueue = new Queue('file-processing', { connection: redisConnection });

const { QueueEvents } = require('bullmq');
const fileQueueEvents = new QueueEvents('file-processing', { connection: redisConnection });

fileQueueEvents.on('completed', async ({ jobId }) => {
const job = await fileProcessingQueue.getJob(jobId);
const result = job.returnvalue;
console.log(`Job ${jobId} completed with result:`, result);
  // Then update the DB or notify the client.
});

// Multer Configuration (Store files in memory before uploading)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ **Upload File & Store Metadata**
router.post('/upload', authMiddleware, upload.single('audio'), async (req, res) => {
    try {
        console.log('upload request received');
        if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
        if (!req.userId) return res.status(401).json({ message: 'User not authenticated.' });

        // Log all request data including authorization header
        console.log('Request Headers:', req.headers);
        console.log('Authorization Header:', req.headers.authorization);
        console.log('Request Body:', req.body);
        console.log('Uploaded File:', req.file);

        // Define S3 key (folder + timestamp)
        const key = `${req.body.folder || 'default'}/${Date.now()}_${req.file.originalname}`;

        // Upload to S3
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        };

        const s3Response = await s3.upload(params).promise();

        // Add job to queue for processing
        await fileProcessingQueue.add('processFile', {
            key,
            userId: req.userId,
        });

        // Save file metadata in DB
        const fileId = await File.create({
            fileName: req.file.originalname,
            fileUrl: s3Response.Location,
            uploadedBy: req.userId,
        });

        res.status(200).json({ message: 'File uploaded and queued for processing!', fileId });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ message: 'Failed to upload file.' });
    }
});

// ✅ **Get All Files Uploaded by User**
router.get('/my-files', authMiddleware, async (req, res) => {
    try {
        const files = await File.findByUserId(req.userId);
        res.json(files);
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({ message: 'Failed to retrieve files.' });
    }
});

// ✅ **Get a Specific File Uploaded by User**
router.get('/:fileId', authMiddleware, async (req, res) => {
    try {
        const file = await File.findOneByUser(req.params.fileId, req.userId);
        if (!file) return res.status(404).json({ message: 'File not found.' });

        res.json(file);
    } catch (error) {
        console.error('Error fetching file:', error);
        res.status(500).json({ message: 'Failed to retrieve file.' });
    }
});

// ✅ **Delete a Specific File**
router.delete('/:fileId', authMiddleware, async (req, res) => {
    try {
        const deletedRows = await File.deleteByUser(req.params.fileId, req.userId);
        if (deletedRows === 0) return res.status(404).json({ message: 'File not found or not authorized to delete.' });

        res.json({ message: 'File deleted successfully.' });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ message: 'Failed to delete file.' });
    }
});

module.exports = router;