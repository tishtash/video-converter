PAUSE
ECHO 'STARTING UPDATE....'
choco install git.install
start cmd.exe /k git clone https://github.com/tishtash/video-converter.git temp
mv temp/.git video-converter-master/.git
ECHO 'PROCESSING COMPLETED'
PAUSE