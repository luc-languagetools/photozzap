photozzap README

desktop.dev.jabber.photozzap.com

running jabber auth on windows:

set PATH=%PATH%;c:\cygwin\bin
d:\storage\dev\photozzap\env\bin\python3.2m.exe -m photozzap.scripts.create_users /cygdrive/d/storage/dev/photozzap/env/photozzap/development.ini

c:\Python33\python.exe d:\storage\dev\photozzap\env\photozzap\photozzap\scripts\jabber_auth_open.py

c:/Python33/python.exe d:/storage/dev/photozzap/env/photozzap/photozzap/scripts/jabber_auth_open.py

ejabberd config:

{auth_method, external}.
{extauth_program, "c:/Python33/python.exe d:/storage/dev/photozzap/env/photozzap/photozzap/scripts/jabber_auth_open.py"}.

d:\storage\dev\photozzap\env\bin\python3.2m.exe -m photozzap.scripts.jabber_auth_sqlalchemy /cygdrive/d/storage/dev/photozzap/env/photozzap/development.ini