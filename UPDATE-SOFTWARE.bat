PAUSE
ECHO 'STARTING UPDATE....'
choco install git.install
start cmd.exe /c "git clone https://github.com/tishtash/video-converter.git temp && ROBOCOPY /E /MOVE temp ."
ECHO 'PROCESSING COMPLETED'
PAUSE