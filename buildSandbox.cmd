copy .env backup.env
copy sandbox.env .env
RD /S /Q badgePublisher_sandbox

npm run build

copy backup.env .env

cd D:\azure\source\repos\Open-Badge-Publisher

REN ./build ./badgePublisher_sandbox_%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%

pause