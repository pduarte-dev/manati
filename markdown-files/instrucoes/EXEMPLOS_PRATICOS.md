# 🎯 Exemplos Práticos - Editor Manati

Este documento contém exemplos práticos de uso do Markdown no Editor Manati, organizados por casos de uso comuns.

## 📋 Índice

1. [Documentação Técnica](#documentação-técnica)
2. [Relatórios e Apresentações](#relatórios-e-apresentações)
3. [Guias e Tutoriais](#guias-e-tutoriais)
4. [Notas de Reunião](#notas-de-reunião)
5. [Projetos e Planejamento](#projetos-e-planejamento)
6. [Conhecimento e Wiki](#conhecimento-e-wiki)
7. [Comunicação e Emails](#comunicação-e-emails)
8. [Exemplos Avançados](#exemplos-avançados)

---

## 💻 Documentação Técnica

### API Documentation
```markdown
# API de Usuários

## Endpoints

### GET /api/users
Retorna lista de usuários.

**Parâmetros:**
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 10)

**Resposta:**
```json
{
  "users": [
    {
      "id": 1,
      "name": "João Silva",
      "email": "joao@email.com"
    }
  ],
  "pagination": {
    "page": 1,
    "total": 25,
    "pages": 3
  }
}
```

**Códigos de Status:**
- `200`: Sucesso
- `400`: Parâmetros inválidos
- `500`: Erro interno

### POST /api/users
Cria novo usuário.

**Body:**
```json
{
  "name": "string (obrigatório)",
  "email": "string (obrigatório)",
  "password": "string (obrigatório, min: 8 chars)"
}
```

**Exemplo de Uso:**
```bash
curl -X POST http://api.exemplo.com/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Santos",
    "email": "maria@email.com",
    "password": "senhaSegura123"
  }'
```

---

*Última atualização: 12 de junho de 2025*
*Versão do Editor: 1.0.0*
