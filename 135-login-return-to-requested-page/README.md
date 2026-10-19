# PR #135: return to the requested page after login

An app link is opened without a session, then the user signs in. The black bar at the bottom of each screenshot (added only for this evidence) shows the link that was opened and where the app landed after login. Local app with a throwaway database.

| | Desktop, light: a task link | Mobile, dark: machines filtered by "CAM" |
|---|---|---|
| Before: always lands on Meu Dia | ![](before-desktop-light.png) | ![](before-mobile-dark.png) |
| After: lands on the page that was asked for | ![](after-desktop-light.png) | ![](after-mobile-dark.png) |

The task opens over the Entrada list because that task is still a draft in Entrada; that redirect is existing behavior.
