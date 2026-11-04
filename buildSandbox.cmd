@echo remember to set npm to current version
@echo nvm use 22.2.0
@echo Install Viter if necessary

C:
cd \Projects\github\Open-Badge-Publisher
copy .env backup.env
copy sandbox.env .env
@echo Remove target folder if present (OK to have an error)
RD /S /Q badgePublisher_sandbox

pause
npm run build
pause

copy backup.env .env

cd \Projects\github\Open-Badge-Publisher

REN ./build ./badgePublisher_sandbox_%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%

pause