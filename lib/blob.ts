import { put } from '@vercel/blob';

export async function uploadFile(file: File, pathname: string): Promise<string> {
  const blob = await put(pathname, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return blob.url;
}




