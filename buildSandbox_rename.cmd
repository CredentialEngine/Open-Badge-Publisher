
cd /d "%~dp0"

@Echo Renaming build to badgePublisher_sandbox
REN "build" badgePublisher_sandbox_%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%
REN "build" badgePublisher_sandbox_%date:~10,4%%date:~4,2%%date:~7,2%_%time:~1,1%%time:~3,2%
