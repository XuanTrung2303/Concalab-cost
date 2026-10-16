# Concalab-cost
Vue 3 (Vite) + Node.js (Express) + Supabase, gộp trong một project duy nhất.

## Cấu trúc
app.js          Express: toàn bộ API /api/*
server.js       Chạy local/Render: app.js + phục vụ giao diện
api/index.js    Điểm vào cho Vercel
vercel.json     Cấu hình Vercel
src/             Giao diện Vue
index.html, vite.config.js, package.json, .env
supabase/schema.sql

## Cài đặt
1. Supabase: tạo project, chạy `supabase/schema.sql` trong SQL Editor, lấy URL và anon key.
2. `cp .env.example .env` rồi điền URL và anon key.
3. `npm install`

## Chạy khi phát triển
npm run dev      # giao diện http://localhost:5173, API http://localhost:3001

## Deploy (Render, Railway, VPS...)
Build command: npm install && npm run build
Start command: npm start
Biến môi trường: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (đặt trước khi build), PORT (nếu host yêu cầu)
Server Node tự trả index.html cho /company, /calc... nên không cần bật SPA fallback.
