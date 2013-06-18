import os
import sys
import transaction
import logging
from sqlalchemy import engine_from_config
import sleekxmpp
from sleekxmpp.stanza.message import Message
from sleekxmpp.stanza.presence import Presence
from sleekxmpp.xmlstream.stanzabase import ElementBase
from sleekxmpp.xmlstream import register_stanza_plugin, ET
from sleekxmpp.xmlstream.handler.callback import Callback
from sleekxmpp.xmlstream.matcher.xpath import MatchXPath
from sleekxmpp.xmlstream.matcher.xmlmask import MatchXMLMask
from sleekxmpp.plugins.xep_0045 import MUCPresence

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
    
class PhotoZzapMucBot(sleekxmpp.ClientXMPP):

    def __init__(self, jid, password, conf_room, nick):
        sleekxmpp.ClientXMPP.__init__(self, jid, password)
        self.room = conf_room
        self.nick = nick
        self.viewing_image = None
        self.follow_user = "Luc08"
        
        print("starting connection with " + jid)
        
        self.add_event_handler("session_start", self.start)
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

    def muc_presence(self, presence):
        print("received muc_presence: " + str(presence))
        
        from_nick = presence['from'].resource
        if from_nick == self.follow_user:
            viewing_tag = presence.xml.find('{jabber:client}viewing')
            if viewing_tag != None:
                image_id = viewing_tag.text
                print("viewing: " + image_id)
                self.send_viewing(image_id)
        
    def handle_image(self, message):
        print("received image: " + str(message))
        image_id = message['image']['id']
        self.send_viewing(image_id)
        
    def send_viewing(self, image_id):
        if self.viewing_image != image_id:
            stanza = self.makePresence(pto="%s/%s" % (self.room, self.nick))
            
            builder = ET.TreeBuilder()
            builder.start("viewing", {})
            builder.data(image_id)
            builder.end("viewing")
            viewing_elt = builder.close()
            
            stanza.append(viewing_elt)
            print("sending presence: " + str(stanza))
            stanza.send()
            
            self.viewing_image = image_id
        
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
    
    if xmpp.connect((jabber_server, 5222), use_tls=False):
        xmpp.process(block=True)
        print("Done")
    else:
        print("Unable to connect.")    
        
    print("yo started up")
