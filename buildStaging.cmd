copy .env backup.env
copy staging.env .env
RD /S /Q badgePublisher_staging

npm run build
copy backup.env .env

cd D:\azure\source\repos\Open-Badge-Publisher

REN "build" badgePublisher_staging_%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%

pause