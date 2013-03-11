import os
import sys
import transaction

from sqlalchemy import engine_from_config
from sqlalchemy import exc

from pyramid.paster import (
    get_appsettings,
    setup_logging,
    )

from ..models import (
    DBSession,
    Conference,
    User,
    Base,
    )


def usage(argv):
    cmd = os.path.basename(argv[0])
    print('usage: %s <config_uri>\n'
          '(example: "%s development.ini")' % (cmd, cmd))
    sys.exit(1)


    if len(argv) != 2:
        usage(argv)
    config_uri = argv[1]
    setup_logging(config_uri)
    settings = get_appsettings(config_uri)
    engine = engine_from_config(settings, 'sqlalchemy.')
    DBSession.configure(bind=engine)
    #Base.metadata.create_all(engine)
    with transaction.manager:
        #model = MyModel(name='one', value=1)
        #DBSession.add(model)
        user = User()
        DBSession.add(user)
        print("create user")
        
if __name__ == "__main__":
    argv = sys.argv
    if len(argv) != 2:
        usage(argv)
    config_uri = argv[1]
    setup_logging(config_uri)
    settings = get_appsettings(config_uri)
    engine = engine_from_config(settings, 'sqlalchemy.')
    DBSession.configure(bind=engine)
    try:
        with transaction.manager:
            user = User()
            user.login = "user_vovjysci"
            user.password = "2hysbp9b"
            DBSession.add(user)
        print("created user")
    except exc.IntegrityError:
        print("IntegrityError")
