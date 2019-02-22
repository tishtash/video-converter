PAUSE
ECHO 'STARTING UPDATE....'
choco install git.install
rmdir /S /Q .
cd ..
git clone https://github.com/tishtash/video-converter.git video-converter-master
ECHO 'PROCESSING COMPLETED'
PAUSE