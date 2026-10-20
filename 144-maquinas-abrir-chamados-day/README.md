# PR #144: "Abrir Chamados" on the machine page opens on the day of the latest chamado

Local environment, line CAM 01 with chamados on 2026-10-18 and 2026-10-19, none today (2026-10-20).

| | |
|---|---|
| Machine page: the card lists the recent chamados of the line | ![](machine-page-pc.png) |
| Before: "Abrir Chamados" opened today, "Nenhum chamado neste dia" | ![](before-pc.png) |
| After: it opens `?linha=…&dia=2026-10-19`, the newest chamado shows | ![](after-pc.png) |
| After, phone | ![](after-phone.png) |
