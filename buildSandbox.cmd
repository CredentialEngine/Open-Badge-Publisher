# remember to set npm to current version
# nvm use 22.2.0

D:
cd D:\Github\Open-Badge-Publisher
copy .env backup.env
copy sandbox.env .env
RD /S /Q badgePublisher_sandbox

pause
npm run build
pause

copy backup.env .env

cd D:\Github\Open-Badge-Publisher

REN ./build ./badgePublisher_sandbox_%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%

pause