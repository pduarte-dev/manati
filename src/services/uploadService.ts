/**
 * Serviço para upload de arquivos
 */
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import config from '../config/environment.js';
import { getMimeTypeDescription, isMimeTypeAllowed } from '../utils/mimeTypes.js';

export class UploadService {
    private uploadsDir: string;
    private upload!: multer.Multer; // Use definite assignment assertion

    constructor() {
        this.uploadsDir = config.uploadsDir;
        this.setupMulter();
    }

    private setupMulter(): void {
        const storage = multer.diskStorage({
            destination: async (req, file, cb) => {
                try {
                    await this.ensureUploadsDirectory();
                    cb(null, this.uploadsDir);
                } catch (error) {
                    cb(error as Error, '');
                }
            },
            filename: (req, file, cb) => {
                // Criar nome único para evitar conflitos
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const extension = path.extname(file.originalname);
                const baseName = path.basename(file.originalname, extension);
                cb(null, `${baseName}-${uniqueSuffix}${extension}`);
            }
        });

        this.upload = multer({
            storage,
            limits: {
                fileSize: config.maxFileSize
            },
            fileFilter: (req, file, cb) => {
                // Verificar tipo MIME
                if (!isMimeTypeAllowed(file.mimetype, config.allowedMimeTypes)) {
                    const fileType = getMimeTypeDescription(file.mimetype);
                    const error = new Error(`Arquivo ${fileType} não permitido`) as any;
                    error.code = 'UNSUPPORTED_FILE_TYPE';
                    error.mimetype = file.mimetype;
                    return cb(error);
                }
                
                cb(null, true);
            }
        });
    }

    private async ensureUploadsDirectory(): Promise<void> {
        try {
            await fs.access(this.uploadsDir);
        } catch {
            await fs.mkdir(this.uploadsDir, { recursive: true });
        }
    }

    getMulterInstance(): multer.Multer {
        return this.upload;
    }

    getFileUrl(filename: string): string {
        return `/uploads/${filename}`;
    }

    async deleteFile(filename: string): Promise<void> {
        const filePath = path.join(this.uploadsDir, filename);
        
        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.error('Erro ao deletar arquivo:', error);
            throw new Error('Erro ao deletar arquivo');
        }
    }

    async getFileInfo(filename: string): Promise<any> {
        const filePath = path.join(this.uploadsDir, filename);
        
        try {
            const stats = await fs.stat(filePath);
            return {
                filename,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
            };
        } catch (error) {
            throw new Error('Arquivo não encontrado');
        }
    }

    generateErrorResponse(error: any): { type: string; error: string } {
        if (error.code === 'UNSUPPORTED_FILE_TYPE') {
            const fileType = getMimeTypeDescription(error.mimetype);
            return {
                type: 'unsupported_file_type',
                error: `Arquivo ${fileType} não permitido`
            };
        }

        if (error.code === 'LIMIT_FILE_SIZE') {
            return {
                type: 'file_too_large',
                error: 'Arquivo muito grande! O tamanho máximo permitido é 10MB.'
            };
        }

        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return {
                type: 'unexpected_file_field',
                error: 'Campo de arquivo inesperado'
            };
        }

        return {
            type: 'unknown_error',
            error: error.message || 'Erro desconhecido no upload'
        };
    }
}
