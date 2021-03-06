PAUSE
ECHO 'PROCESSING STARTED'

ECHO 'INSTALLING CHOCOLATEY PACKAGE MANAGER'
@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"
ECHO 'CHOCOLATEY HAS BEEN INSTALLED ON YOUR SYSTEM'

ECHO 'INSTALLING PYTHON'
choco install python
ECHO 'PYTHONS HAS BEEN INSTALLED ON YOUR SYSTEM'

ECHO 'INSTALLING FFMPEG'
choco install ffmpeg
ECHO 'FFMPEG HAS BEEN INSTALLED ON YOUR SYSTEM'

ECHO 'INSTALLING NODE'
choco install nodejs
ECHO 'NODE HAS BEEN INSTALLED ON YOUR SYSTEM'

ECHO 'INSTALLING NPM PACKAGE DEPENDECIES'
start cmd.exe /c npm i
ECHO 'NPM DEPENDENCIES HAS BEEN INSTALLED - APPLICATION IS READY TO GO'

ECHO 'PROCESSING COMPLETED'
PAUSE