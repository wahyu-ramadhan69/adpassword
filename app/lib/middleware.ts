import Cors from "cors";

// Helper untuk mengubah middleware menjadi Promise-based
function initMiddleware(middleware: any) {
  return (req: any, res: any) =>
    new Promise((resolve, reject) => {
      middleware(req, res, (result: any) => {
        if (result instanceof Error) return reject(result);
        return resolve(result);
      });
    });
}

// CORS middleware yang sudah siap pakai
const runCors = initMiddleware(
  Cors({
    origin: "*", // Ganti ke asal tertentu jika ingin lebih aman, contoh: 'http://localhost:3001'
    methods: ["GET", "POST", "OPTIONS"],
  })
);

export default runCors;
