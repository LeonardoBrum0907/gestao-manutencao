# PR #145: "Nova ficha" drops the page together with the source document

Local environment. Steps: Documentação > Nova ficha > model Blistadeira CAM, code 127, title, "Documento de origem" = Manual da Blistadeira, Página = 12, then "Documento de origem" back to "Sem documento" and "Criar ficha".

| | |
|---|---|
| Before: the disabled Página still holds 12 | ![](before-1-no-document.png) |
| Before: Criar ficha → 400 "A página precisa do documento (documentId)." and the field can't be cleared | ![](before-2-create.png) |
| After: Página is empty when the document goes | ![](after-1-no-document.png) |
| After: the card is created (POST sent `page: null`, 201) | ![](after-2-created.png) |
| After, phone | ![](after-phone.png) |
