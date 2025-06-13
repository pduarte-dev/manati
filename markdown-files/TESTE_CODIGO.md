# Teste de Código: Inline vs Blocos

## Código Inline vs Blocos de Código

### ✅ Código Inline (uma linha)

Use `console.log()` para imprimir no console.
A função `parseInt()` converte string para número.
O comando `git status` mostra o status do repositório.

### ✅ Blocos de Código (múltiplas linhas)

#### JavaScript:

```javascript
function saudar(nome) {
    console.log(`Olá, ${nome}!`);
    return `Saudação para ${nome}`;
}

saudar("Mundo");

```

#### Python:

```python
def calcular_quadrado(numero):
    resultado = numero ** 2
    print(f"O quadrado de {numero} é {resultado}")
    return resultado

calcular_quadrado(5)

```

#### TypeScript:

```typescript
interface Usuario {
    nome: string;
    idade: number;
}

const usuario: Usuario = {
    nome: "João",
    idade: 30
};

console.log(usuario);

```

#### Bash/Shell:

```bash
#!/bin/bash
echo "Iniciando backup..."
tar -czf backup.tar.gz /home/user/docs
echo "Backup concluído!"

```

#### CSS:

```css
.container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}

.card {
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

```

#### SQL:

```sql
SELECT u.nome, u.email, p.titulo
FROM usuarios u
INNER JOIN posts p ON u.id = p.usuario_id
WHERE u.ativo = true
ORDER BY p.data_criacao DESC;

```

## 🎯 Diferenças Visuais

### Antes da Correção:

* ❌ Tanto `código inline` quanto blocos usavam apenas um backtick
* ❌ Blocos de código quebravam a formatação
* ❌ Não havia distinção visual clara

### Depois da Correção:

* ✅ Código inline: `uma linha` - fundo cinza claro, padding pequeno
* ✅ Blocos de código: fundo cinza escuro, padding maior, bordas arredondadas
* ✅ Suporte a highlight de sintaxe com ```linguagem
* ✅ Conversão correta para HTML

## 📝 Como Usar

### Código Inline:

```
Use `backticks simples` para código inline

```

### Blocos de Código:

```
Use ```linguagem no início
e ``` no final para blocos

```

Agora o editor visual do Manati trata corretamente os dois tipos de código!