import { PayOS } from '@payos/node';

// Lấy Key từ file .env (Sếp sẽ copy từ dự án gamenect_new sang file .env của web-saas nhé)
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || "MÃ_CLIENT_ID_CỦA_SẾP";
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || "MÃ_API_KEY_CỦA_SẾP";
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || "MÃ_CHECKSUM_CỦA_SẾP";

export const payos = new PayOS(PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY);
