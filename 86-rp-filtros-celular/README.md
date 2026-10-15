# PR #86: lista de RPs no celular sem rolar os filtros

PR: https://github.com/LeonardoBrum0907/gestao-manutencao/pull/86

Tela RPs com 3 RPs, celular de 390 × 844 px (a primeira tela). Antes, os 10 filtros empilhados ocupavam a tela
inteira e nenhum RP aparecia sem rolar. Depois, só Buscar fica à vista com o link "Mais filtros"; a lista começa
logo abaixo. Quando um filtro escondido está em uso, o link diz quantos ("Mais filtros (1 em uso)"). No computador
as imagens de antes e depois são idênticas pixel a pixel.

| | Antes da correção | Depois da correção |
| --- | --- | --- |
| Celular, tema claro | ![Antes: só filtros na primeira tela](antes-cel-light-lista.png) | ![Depois: Buscar, Mais filtros e os 3 RPs](depois-cel-light-lista.png) |
| Celular, tema escuro | ![Antes no tema escuro](antes-cel-dark-lista.png) | ![Depois no tema escuro](depois-cel-dark-lista.png) |
| Computador (não muda) | ![Antes no computador](antes-pc-light-lista.png) | ![Depois no computador (igual)](depois-pc-light-lista.png) |

Depois, no celular:

| Com a TAG "BLI" filtrada | Depois de tocar em "Mais filtros" |
| --- | --- |
| ![Mais filtros (1 em uso), com 2 RPs](depois-cel-light-filtro-em-uso.png) | ![Os 10 filtros abertos e "Menos filtros" no fim](depois-cel-light-aberto.png) |
