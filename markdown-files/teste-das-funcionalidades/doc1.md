# Documento para Teste das Funcionalidades

Nesse documento irei testar as funcionalidades do editor de markdown Manati, e farei uma lista de melhorias.
Até então percebo que a criação de pastas e arquivos está permitindo, a criação de ambos fora do padrão **snake_case**, isso pode acabar gerando problemas futuros, caso não tenha compatibilidade com o [Docusaurus](https://docusaurus.io/docs).
Agora vou testar em paralelo a esse arquivo algumas outras funcionalidades.
Já notei que após salvar o arquivo, o botão publicar já exibiu que existe um arquivo a ser comitado do github.
Mas em notei que mesmo alterando o Primeiro H1 que seria o titulo do arquivo o mesmo não alterou no Explorador de arquivos.
Ao abrir a modal de Publicar ele está com duas lista de alterações sendo ela *Modificados* e *Excluídos* mas poderia ser apenas uma unica lista e permitir ao usuário selecionar os arquivos que ele deseja subir no commit. Segue imagem em anexo:
![Captura de tela de 2025-06-13 23-02-14.png](/uploads/Captura%20de%20tela%20de%202025-06-13%2023-02-14-1749866734014-471265583.png) 

O layout está bom mas poderia ser melhorado isso. Fazendo uma unica lista alternando as cores entre verde e vermelho no icone de arquivo para indicar o que vai ocorrer com o arquivo com uma legendo inline par os dois.
Também notei ao redigir essas anotações que poderia ser melhorada a fluides da implementação no **negrito**, *italico*, e sublinhado para quando usamos os atalhos de teclado. No momento está sendo mais fluido fazer a alternância entre eles selecionado o texto e clicando no botão. O scholl não esta de sendo de forma automática para facilitar a digitação do texto.
Fora que existem mais opções que podem ser criadas para o editor visual.Seria interessante se o markdown permitir definir um dimensão e alinhamento para as imagens anexadas no documento.

![Captura de tela de 2025-06-13 23-19-29.png](/uploads/Captura%20de%20tela%20de%202025-06-13%2023-19-29-1749867589940-881716474.png)

Como pode ver na imagem o documento no github não exibiu a imagem e a formatação está estranha parece que não está respeitando a quebra de linhas. será necessário ajustar? Ou o problema e o github? Será necesario testar no Docusaurus também.
Agora vou excluir a pasta e a pasta com arquivo dentro para ver o que vai acontecer. Pastas vazias não são enviadas para o git então a exclusão é só local isso e um bom comportamento, e a pasta com arquivo gerou uma nova publicação no git isso e bom também. Verificado e a pasta e o arquivo foram excluídos do git.

Finalizando essa anotação fora o ajustes visuais do próprio editor, vai ser necessário um ajuste fino no publicar e implementar mais funcionalidades no visual. Seria interessante também limitar a largura das linha do tamanho máximo de uma folha **A4**. 

Olá