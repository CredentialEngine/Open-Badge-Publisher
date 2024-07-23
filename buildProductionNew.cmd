@echo remember to set npm to current version
@echo nvm use 22.2.0
cd D:\Github\Open-Badge-Publisher
copy .env backup.env
copy productionNew.env .env
RD /S /Q badgePublisher_prod

pause
npm run build
pause
copy backup.env .env

cd D:\Github\Open-Badge-Publisher

REN "build" badgePublisher_prod_%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%

pause