/**
 * Utilitários para tipos MIME
 */

export function getMimeTypeDescription(mimetype: string): string {
  const mimeMap: { [key: string]: string } = {
    // Imagens
    'image/jpeg': 'JPEG',
    'image/jpg': 'JPG', 
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'image/webp': 'WebP',
    'image/svg+xml': 'SVG',
    'image/bmp': 'BMP',
    'image/tiff': 'TIFF',
    
    // Documentos
    'application/pdf': 'PDF',
    'text/plain': 'texto simples',
    'text/markdown': 'Markdown',
    'application/msword': 'Word (.doc)',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word (.docx)',
    'application/vnd.ms-excel': 'Excel (.xls)',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel (.xlsx)',
    'application/vnd.ms-powerpoint': 'PowerPoint (.ppt)',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint (.pptx)',
    
    // Arquivos compactados
    'application/zip': 'ZIP',
    'application/x-rar-compressed': 'RAR',
    'application/x-7z-compressed': '7-Zip',
    
    // Áudio (não permitidos)
    'audio/mpeg': 'MP3',
    'audio/wav': 'WAV',
    'audio/x-wav': 'WAV',
    'audio/ogg': 'OGG',
    'audio/aac': 'AAC',
    'audio/mp4': 'M4A',
    
    // Vídeo (não permitidos)
    'video/mp4': 'MP4',
    'video/avi': 'AVI',
    'video/quicktime': 'MOV',
    'video/x-msvideo': 'AVI',
    'video/webm': 'WebM',
    
    // Executáveis (não permitidos)
    'application/x-msdownload': 'executável Windows',
    'application/x-executable': 'executável',
    'application/x-mach-binary': 'executável macOS'
  };

  return mimeMap[mimetype] || mimetype;
}

export function isMimeTypeAllowed(mimetype: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimetype);
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isImageFile(mimetype: string): boolean {
  return mimetype.startsWith('image/');
}
