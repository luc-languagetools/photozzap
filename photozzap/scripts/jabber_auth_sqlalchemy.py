import os
import sys
import transaction
import logging
import struct
from struct import *
from sqlalchemy import engine_from_config

# on windows, use the following configuration in ejabberd.cfg
# {auth_method, external}.
# {extauth_program, "d:/storage/dev/photozzap/env/bin/python3.2m.exe -m photozzap.scripts.jabber_auth_sqlalchemy /cygdrive/d/storage/dev/photozzap/env/photozzap/development.ini"}.

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

class EjabberdInputError(Exception):
    def __init__(self, value):
        self.value = value
    def __str__(self):
        return repr(self.value)    
    
class JabberAuthHandler:
    def __init__(self, settings):
        sys.stderr = open(settings['jabber_auth_error_log'], 'a')
        logging.basicConfig(level=logging.INFO,
                            format='%(asctime)s %(levelname)s %(message)s',
                            filename=settings['jabber_auth_log'],
                            filemode='a')        
        logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

        self.engine = engine_from_config(settings, 'sqlalchemy.')
        DBSession.configure(bind=self.engine)    
        logging.info('extauth script started, waiting for ejabberd requests')


    def is_user(self, user, host):
        user = DBSession.query(User).filter_by(login=user).first()
        if user is None:
            return False
        else:
            return True
        
    def auth(self, user, host, password):
        user = DBSession.query(User).filter_by(login=user).first()
        if user is None:
            return False
        else:
            if user.password == password:
                return True
            else:
                return False

    def ejabberd_in(self):
        logging.debug("trying to read 2 bytes from ejabberd:")
        try:
            input_length = sys.stdin.read(2)
        except IOError:
            logging.debug("ioerror")
        if len(input_length) is not 2:
            logging.debug("ejabberd sent us wrong things!")
            raise EjabberdInputError('Wrong input from ejabberd!')
        logging.debug('got 2 bytes via stdin: %s'%input_length)
        (size,) = unpack(bytes('>h', 'ascii'), bytes(input_length,'ascii'))
        logging.debug('size of data: %i'%size)
        income=sys.stdin.read(size).split(':')
        logging.debug("incoming data: %s"%income)
        return income
        
    def ejabberd_out(self,bool):
        logging.debug("Ejabberd gets: %s" % bool)
        token = self.genanswer(bool)
        sys.stdout.write(token.decode('ascii'))
        sys.stdout.flush()

    def genanswer(self,bool):
        answer = 0
        if bool:
            answer = 1
        token = pack('>hh', 2, answer)
        return token

    def log_result(self, op, in_user, bool):
        if bool:
            logging.info("%s successful for %s"%(op, in_user))
        else:
            logging.info("%s unsuccessful for %s"%(op, in_user))

    def main_loop(self):
        logging.debug("start of infinite loop")
        while True:
            try: 
                ejab_request = self.ejabberd_in()
            except EjabberdInputError as inst:
                logging.info("Exception occured: %s", inst)
                break
            logging.debug('operation: %s'%(ejab_request[0]))
            op_result = False
            if ejab_request[0] == "auth":
                op_result = self.auth(ejab_request[1], ejab_request[2], ejab_request[3])
                self.ejabberd_out(op_result)
                self.log_result(ejab_request[0], ejab_request[1], op_result)
            elif ejab_request[0] == "isuser":
                op_result = self.is_user(ejab_request[1], ejab_request[2])
                self.ejabberd_out(op_result)
                self.log_result(ejab_request[0], ejab_request[1], op_result)
            elif ejab_request[0] == "setpass":
                op_result=False
                self.ejabberd_out(op_result)
                self.log_result(ejab_request[0], ejab_request[1], op_result)    
            
            
if __name__ == "__main__":
    argv = sys.argv
    if len(argv) != 2:
        usage(argv)
    config_uri = argv[1]
    settings = get_appsettings(config_uri)

    auth_handler = JabberAuthHandler(settings)
    auth_handler.main_loop()
    
    
    

