// Chạy trên máy hoặc host Node (Render, Railway, VPS): API + giao diện đã build. Vercel dùng api/index.js.
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import app from './app.js'

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist')
app.use(express.static(dist))
app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')))
app.listen(process.env.PORT || 3001, () => console.log('Concalab-cost chạy tại cổng', process.env.PORT || 3001))
