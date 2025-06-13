/**
 * Rotas para upload de arquivos
 */
import { Router, Request, Response } from 'express';
import { UploadService } from '../services/uploadService.js';

const router = Router();
const uploadService = new UploadService();

// Upload de arquivo
router.post('/upload', (req: Request, res: Response) => {
    const upload = uploadService.getMulterInstance().single('file');
    
    upload(req, res, (error: any) => {
        if (error) {
            console.error('Erro no upload:', error);
            const errorResponse = uploadService.generateErrorResponse(error);
            return res.status(400).json(errorResponse);
        }

        if (!req.file) {
            return res.status(400).json({
                type: 'no_file',
                error: 'Nenhum arquivo enviado'
            });
        }

        const fileUrl = uploadService.getFileUrl(req.file.filename);
        
        return res.json({
            message: 'Upload realizado com sucesso',
            url: fileUrl,
            originalName: req.file.originalname,
            filename: req.file.filename,
            size: req.file.size
        });
    });
});

// Informações sobre arquivo uploadado
router.get('/upload/:filename', async (req: Request, res: Response) => {
    try {
        const filename = req.params.filename;
        const fileInfo = await uploadService.getFileInfo(filename);
        res.json(fileInfo);
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
});

// Deletar arquivo uploadado
router.delete('/upload/:filename', async (req: Request, res: Response) => {
    try {
        const filename = req.params.filename;
        await uploadService.deleteFile(filename);
        res.json({ message: 'Arquivo deletado com sucesso' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
