import string
import random

from sqlalchemy import (
    Column,
    Integer,
    Text,
    )

from sqlalchemy.ext.declarative import declarative_base

from sqlalchemy.orm import (
    scoped_session,
    sessionmaker,
    )

from zope.sqlalchemy import ZopeTransactionExtension

DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))
Base = declarative_base()

def generate_secret():
    size = 8
    chars=string.ascii_lowercase + string.digits
    secret = ''.join(random.choice(chars) for x in range(size))
    return secret

class Conference(Base):
    __tablename__ = 'conferences'
    id = Column(Integer, primary_key=True)
    name = Column(Text, unique=True)
    secret = Column(Text, unique=True)

    def __init__(self):
        self.secret = generate_secret()
        self.name = "conference_" + self.secret
      
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    login = Column(Text, unique=True)
    password = Column(Text)
    
    def __init__(self):
        self.login = "user_" + generate_secret()
        self.password = generate_secret()
