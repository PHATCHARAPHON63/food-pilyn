// ============================================
// Cloudinary (ฝั่งเซิร์ฟเวอร์เท่านั้น) — อัปโหลดรูปเมนู
// ============================================
import { v2 as cloudinary } from 'cloudinary';

export const CLOUDINARY_MENU_FOLDER = 'food-ordering/menu';

const CLOUDINARY_CLOUD_NAME = 'nebq1o2o';
const CLOUDINARY_API_KEY = '149598376576464';
const CLOUDINARY_API_SECRET = 'QSyzt7qpKEYKYi6iKlVE73b_jBc';

let configured = false;

function ensureCloudinary() {
  if (!configured) {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
}

export async function uploadMenuImage(buffer: Buffer): Promise<string> {
  ensureCloudinary();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_MENU_FOLDER,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        const url = result?.secure_url;
        if (!url) {
          reject(new Error('Cloudinary upload returned no URL'));
          return;
        }
        resolve(url);
      }
    );
    stream.end(buffer);
  });
}
