import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
    server: {
    port: 5173,
    strictPort: true, // nếu port bận thì báo lỗi (không tự nhảy port khác)
    host: true,       // nếu muốn truy cập từ LAN / Docker (tuỳ)
  },
})
