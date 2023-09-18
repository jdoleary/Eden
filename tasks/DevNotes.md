## Mac Distribution

Mac distribution will be done via ./install.sh which isn't blocked by gatekeeper


## Reset windows icon cache
```
cd %homepath%\AppData\Local\Microsoft\Windows\Explorer

taskkill /f /im explorer.exe

del iconcache*

explorer.exe

```