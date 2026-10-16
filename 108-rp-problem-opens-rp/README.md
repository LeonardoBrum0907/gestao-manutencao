# PR #108: open the RP sheet straight from an RP problem

Local app with the disposable database, `gestor@local`. Registros > Problemas, "Todas as situações", click "Esteira do magazine de blister não tracionando." (a problem created by an RP).

## The list

![list](before-1-list-desktop.png)

## Before: a page titled "RP" without the problem, only "Abrir o RP"

| Desktop | Mobile |
|---|---|
| ![before desktop](before-2-click-desktop.png) | ![before mobile](before-2-click-mobile.png) |

## After: the RP sheet opens directly

The RP sheet no longer shows "Ver o Problema nos Registros", which would now lead back to itself. The browser Back button returns to the filtered Registros list (`/registros?tipo=problemas&situacao=todos`) on both sizes.

| Desktop | Mobile |
|---|---|
| ![after desktop](after-2-click-desktop.png) | ![after mobile](after-2-click-mobile.png) |
