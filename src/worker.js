import dotenv from 'dotenv';
dotenv.config();

import { Worker, QueueEvents } from 'bullmq';
import AWS from 'aws-sdk';
import Redis from 'ioredis';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const PYTHON_SCRIPT = path.join(process.cwd(), 'src', 'python', 'transcribe.py');
const PYTHON_EXECUTABLE = path.join(process.cwd(), 'src', 'python', '.venv', 'bin', 'python');
const TEMP_DIR = path.join(process.cwd(), 'tmp'); // Define temp directory

// S3 Configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Redis Connection
const redisConnection = new Redis({
  host: '127.0.0.1',
  port: 6378,
  maxRetriesPerRequest: null, // REQUIRED for BullMQ
});

async function downloadS3Object(bucket, key) {
  try {
    console.log(`Downloading ${key} from S3 bucket ${bucket}`);

    // Ensure the temp directory exists
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    const params = {
      Bucket: bucket,
      Key: key,
    };

    const s3Object = await s3.getObject(params).promise();
    const filePath = path.join(TEMP_DIR, path.basename(key)); // Save with original filename

    fs.writeFileSync(filePath, s3Object.Body);
    console.log('File saved to:', filePath);
    await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
    return filePath;

    // console.log('File saved to:', filePath);
    // return filePath;
  } catch (error) {
    console.error('Error downloading S3 object:', error);
    throw error;
  }
}

// ✅ START PERSISTENT PYTHON PROCESS
console.log("🔥 Starting Persistent Python Process...");
const pythonProcess = spawn(PYTHON_EXECUTABLE, [PYTHON_SCRIPT]);

pythonProcess.stdout.on('data', (data) => {
  console.log('🐍 Python Process:', data.toString());
});

pythonProcess.stderr.on('data', (data) => {
  console.error('❌ Python Error:', data.toString());
});

import { createInterface } from 'readline';

// Create a readline interface for the persistent Python process stdout
const rl = createInterface({
  input: pythonProcess.stdout,
  crlfDelay: Infinity,
});

function waitForValidJSON(timeout = 120000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      rl.removeListener('line', onLine);
      reject(new Error('Timeout waiting for valid JSON'));
    }, timeout);

    function onLine(line) {
      try {
        const parsed = JSON.parse(line);
        clearTimeout(timer);
        rl.removeListener('line', onLine);
        resolve(parsed);
      } catch (error) {
        // If not valid JSON, ignore and wait for the next line.
        console.log('Ignoring non-JSON line:', line);
      }
    }

    rl.on('line', onLine);
  });
}

function runTranscription(filePath, diarize = false) {
  return new Promise((resolve, reject) => {
    pythonProcess.stdin.write(JSON.stringify({ filePath, diarize }) + '\n');

    // Wait until a valid JSON line is received.
    waitForValidJSON()
      .then(resolve)
      .catch(reject);
  });
}

// ✅ WORKER
const worker = new Worker(
  'file-processing',
  async (job) => {
    console.log(`🛠️ Processing job ${job.id}...`);

    const { key, userId } = job.data;

    try {
      await job.updateProgress(25);
      const filePath = await downloadS3Object(process.env.AWS_BUCKET_NAME, key);
      await job.updateProgress(50);

      // ✅ Transcribe using the persistent Python process
      const transcriptionResult = await runTranscription(filePath, false);
      console.log('📝 Transcription Result:', transcriptionResult);
      await job.updateProgress(75);

      console.log(`✅ Processed Job ${job.id}`);
      await job.updateProgress(100);
      return transcriptionResult;
    } catch (err) {
      console.error('❌ Error processing job:', err);
    }
  },
  { connection: redisConnection }
);

const queueEvents = new QueueEvents('file-processing', { connection: redisConnection });

queueEvents.on('completed', ({ jobId }) => {
  console.log(`Job ${jobId} has completed!`);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  console.log(`Job ${jobId} has failed with reason: ${failedReason}`);
});

