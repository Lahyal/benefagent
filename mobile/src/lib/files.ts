import RNFS from 'react-native-fs';

export function normalizePath(uri: string) {
  return uri.replace('file://', '');
}

export async function readFileBase64(uri: string): Promise<string> {
  return RNFS.readFile(normalizePath(uri), 'base64');
}

export function mediaTypeFromName(name: string, fallback = 'application/octet-stream') {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (lower.endsWith('.doc')) return 'application/msword';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return fallback;
}
