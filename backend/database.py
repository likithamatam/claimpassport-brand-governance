"""
Claim Passport - SQLAlchemy Database Models & Connection
"""

from sqlalchemy import create_engine, Column, String, Text, Date, Boolean, Integer, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost/claim_passport_db")

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class UserModel(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True)
    name = Column(String(120), nullable=False)
    email = Column(String(160), unique=True, nullable=False)
    role = Column(String(60), nullable=False)
    department = Column(String(100), nullable=False)

class LivingFactModel(Base):
    __tablename__ = "living_facts"
    id = Column(String(36), primary_key=True)
    claim = Column(Text, nullable=False)
    source_reference = Column(String(255), nullable=False)
    owner_name = Column(String(120), nullable=False)
    status = Column(String(60), default="Approved")
    expiry_date = Column(Date, nullable=False)
    last_verified_date = Column(Date, nullable=False)
    category = Column(String(60), nullable=False)
    refresh_requested = Column(Boolean, default=False)
