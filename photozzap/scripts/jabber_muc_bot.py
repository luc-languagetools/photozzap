import os
import sys
import transaction
import logging
from sqlalchemy import engine_from_config
import sleekxmpp
from sleekxmpp.stanza.message import Message
from sleekxmpp.stanza.presence import Presence
from sleekxmpp.xmlstream.stanzabase import ElementBase
from sleekxmpp.xmlstream import register_stanza_plugin
from sleekxmpp.xmlstream.handler.callback import Callback
from sleekxmpp.xmlstream.matcher.xpath import MatchXPath

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
    print('usage: %s <config_uri> <conference> <nick>\n'
          '(example: "%s development.ini abcdefg1 bot01")' % (cmd, cmd))
    sys.exit(1)
    
class Image(ElementBase):
    name = 'image'
    plugin_attrib = 'image'
    interfaces = set(('id', 'url', 'thumbnail'))
    sub_interfaces = interfaces
    
class Viewing(ElementBase):
    name = 'viewing'
    plugin_attrib = 'viewing'
    interfaces = set()
    sub_interfaces = interfaces
    
class PhotoZzapMucBot(sleekxmpp.ClientXMPP):

    def __init__(self, jid, password, conf_room, nick):
        sleekxmpp.ClientXMPP.__init__(self, jid, password)
        self.room = conf_room
        self.nick = nick
        
        print("starting connection with " + jid)
        
        self.add_event_handler("session_start", self.start)
        # self.add_event_handler("groupchat_message", self.muc_message)
        self.add_event_handler("groupchat_presence", self.muc_presence)
        
        self.registerHandler(
            Callback('Image Handler',
                MatchXPath('{%s}message/{%s}image' % (self.default_ns, Image.namespace)),
                self.handle_image))
        
        print("initialized, added event handlers")
        
    def start(self, event):
        self.send_presence()
        self.plugin['xep_0045'].joinMUC(self.room,
                                        self.nick,
                                        # If a room password is needed, use:
                                        # password=the_room_password,
                                        wait=True)  
        print("joined conference " + self.room)

    def muc_message(self, msg):
        print("received muc_message: " + str(msg))
        print("keys: " + str(msg.keys()))
        
        # is this a new image ?
        
    def muc_presence(self, presence):
        print("received muc_presence: " + str(presence))
        
    def handle_image(self, message):
        print("received image: " + str(message))
        #print("image id: " + str(image['id']))
        print(message['image']['id'])

if __name__ == "__main__":
    argv = sys.argv
    if len(argv) != 4:
        usage(argv)
    config_uri = argv[1]
    conf_key = argv[2]
    nick = argv[3]
    settings = get_appsettings(config_uri)

    jabber_server = settings['jabber_server']
    jabber_conf_server = settings['jabber_conf_server']    
    
    # create user
    # join conference
    
    engine = engine_from_config(settings, 'sqlalchemy.')
    DBSession.configure(bind=engine)
    try:
        with transaction.manager:
            user = User()
            DBSession.add(user)
            print("added user: " + user.login)
            jid = user.login + '@' + jabber_server
            password = user.password            
        print("created user")
    except exc.IntegrityError:
        print("IntegrityError")    

    # lookup conference passed in
    conf = DBSession.query(Conference).filter_by(secret=conf_key).one()
    
    logging.basicConfig(level=logging.INFO,
                        format='%(levelname)-8s %(message)s')    
    
    logging.info("test luc")
    
    conf_room = conf.name + '@' + jabber_conf_server
    xmpp = PhotoZzapMucBot(jid, password, conf_room, nick)
    xmpp.register_plugin('xep_0030') # Service Discovery
    xmpp.register_plugin('xep_0045') # Multi-User Chat
    xmpp.register_plugin('xep_0199') # XMPP Ping   
    xmpp['feature_mechanisms'].unencrypted_plain = True
    register_stanza_plugin(Message, Image)
    register_stanza_plugin(Presence, Viewing)
    
    if xmpp.connect((jabber_server, 5222), use_tls=False):
        xmpp.process(block=True)
        print("Done")
    else:
        print("Unable to connect.")    
        
    print("yo started up")
