import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// --- Storage setup ---
const uploadDir = './uploads';
const submissionsDir = './submissions';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(submissionsDir)) fs.mkdirSync(submissionsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// --- File upload endpoint ---
app.post('/api/files', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const fileId = req.file.filename;
  console.log('[UPLOAD]', fileId, '->', req.file.path);

  res.json({
    id: fileId,
    name: req.file.originalname,
    url: `/uploads/${fileId}`
  });
});

// --- Form submission endpoint ---
app.post('/api/submit', (req, res) => {
  const data = req.body;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${timestamp}.json`;
  const filePath = path.join(submissionsDir, fileName);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log('[SUBMISSION]', fileName, 'saved');
  res.json({ status: 'ok', saved_as: fileName });
});

// --- Download submissions ---
app.get('/api/submissions', (req, res) => {
  const files = fs.readdirSync(submissionsDir)
    .filter(f => f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: `/api/submissions/${f}`,
      size: fs.statSync(path.join(submissionsDir, f)).size
    }));
  res.json(files);
});

app.get('/api/submissions/:filename', (req, res) => {
  const filePath = path.join(submissionsDir, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  res.download(filePath);
});

// --- Serve uploaded files ---
app.use('/uploads', express.static(uploadDir));

// --- Start server ---
const PORT = 8081;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
