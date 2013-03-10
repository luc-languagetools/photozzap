#!/usr/bin/python

#from struct import *

import sys
import logging
import struct
from struct import *

sys.stderr = open('d:/storage/dev/photozzap/env/photozzap/jabber_auth_err.log', 'a')
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s %(levelname)s %(message)s',
                    filename='d:/storage/dev/photozzap/env/photozzap/jabber_auth.log',
                    filemode='a')

logging.info('extauth script started, waiting for ejabberd requests')
class EjabberdInputError(Exception):
    def __init__(self, value):
        self.value = value
    def __str__(self):
        return repr(self.value)
########################################################################
#Declarations
########################################################################
def ejabberd_in():
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
def ejabberd_out(bool):
        logging.debug("Ejabberd gets: %s" % bool)
        token = genanswer(bool)
        #logging.debug("sent bytes: %#x %#x %#x %#x" % (ord(token[0]), ord(token[1]), ord(token[2]), ord(token[3])))
        sys.stdout.write(token.decode('ascii'))
        sys.stdout.flush()
def genanswer(bool):
        answer = 0
        if bool:
            answer = 1
        token = pack('>hh', 2, answer)
        return token

def isuser(in_user, in_host):
    return True
def auth(in_user, in_host, password):
    return True

def log_result(op, in_user, bool):
    if bool:
        logging.info("%s successful for %s"%(op, in_user))
    else:
        logging.info("%s unsuccessful for %s"%(op, in_user))
########################################################################
#Main Loop
########################################################################
while True:
    logging.debug("start of infinite loop")
    try: 
        ejab_request = ejabberd_in()
    except EjabberdInputError as inst:
        logging.info("Exception occured: %s", inst)
        break
    logging.debug('operation: %s'%(ejab_request[0]))
    op_result = False
    if ejab_request[0] == "auth":
        op_result = auth(ejab_request[1], ejab_request[2], ejab_request[3])
        ejabberd_out(op_result)
        log_result(ejab_request[0], ejab_request[1], op_result)
    elif ejab_request[0] == "isuser":
        op_result = isuser(ejab_request[1], ejab_request[2])
        ejabberd_out(op_result)
        log_result(ejab_request[0], ejab_request[1], op_result)
    elif ejab_request[0] == "setpass":
        op_result=False
        ejabberd_out(op_result)
        log_result(ejab_request[0], ejab_request[1], op_result)
logging.debug("end of infinite loop")
logging.info('extauth script terminating')
database.close()
