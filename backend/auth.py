import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from database import get_db
import models

# JWT Config
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "ai-resume-analyzer-super-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 Hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# --- Helper Functions ---
def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        if '$' not in hashed_password:
            return False
        salt, key_hex = hashed_password.split('$')
        computed_key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return secrets.compare_digest(computed_key.hex(), key_hex)
    except Exception:
        return False


# --- Pydantic Schemas ---
class UserSignup(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "user" # 'user' or 'recruiter'

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# --- Routes ---
@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserSignup, db: Session = Depends(get_db)):
    clean_email = user_data.email.strip().lower()
    
    # Check Gmail format
    if not clean_email.endswith("@gmail.com"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only valid @gmail.com email addresses are allowed."
        )

    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account with this email already exists. Please Sign In."
        )
    
    # Create new user
    hashed = hash_password(user_data.password)
    user_role = user_data.role if user_data.role in ["user", "recruiter"] else "user"
    new_user = models.User(
        full_name=user_data.full_name.strip(),
        email=clean_email,
        hashed_password=hashed,
        role=user_role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate token
    token = create_access_token(data={"sub": new_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    clean_email = user_data.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == clean_email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials."
        )

    token = create_access_token(data={"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

class GoogleAuthRequest(BaseModel):
    token: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    google_id: Optional[str] = None
    role: str = "user"

def decode_google_id_token(id_token_str: str) -> dict:
    try:
        # Decode unverified claims from Google ID Token JWT
        claims = jwt.get_unverified_claims(id_token_str)
        return claims
    except Exception:
        # Fallback to standard base64 URL decoding
        try:
            import base64
            import json
            parts = id_token_str.split('.')
            if len(parts) >= 2:
                padded = parts[1] + '=' * (-len(parts[1]) % 4)
                decoded_bytes = base64.urlsafe_b64decode(padded)
                return json.loads(decoded_bytes.decode('utf-8'))
        except Exception:
            pass
    return {}

@router.post("/google", response_model=Token)
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    clean_email = None
    display_name = None
    g_id = None

    # Step 1: If Google ID Token is provided by Google Identity Services GSI
    if payload.token:
        claims = decode_google_id_token(payload.token)
        clean_email = claims.get("email", "").strip().lower()
        display_name = claims.get("name") or claims.get("given_name")
        g_id = claims.get("sub")

    # Step 2: Fallback to direct parameters if token parsing wasn't used
    if not clean_email and payload.email:
        clean_email = payload.email.strip().lower()
        display_name = payload.full_name
        g_id = payload.google_id

    if not clean_email or not clean_email.endswith("@gmail.com"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google Single Sign-On requires a valid @gmail.com email address."
        )

    # Step 3: Check database for existing user
    user = db.query(models.User).filter(models.User.email == clean_email).first()

    # Step 4: Create new user if account doesn't exist
    if not user:
        if not display_name or not display_name.strip():
            display_name = clean_email.split('@')[0].replace('.', ' ').title()

        dummy_pwd = hash_password(secrets.token_hex(16))
        user_role = payload.role if payload.role in ["user", "recruiter"] else "user"
        user = models.User(
            full_name=display_name.strip(),
            email=clean_email,
            hashed_password=dummy_pwd,
            role=user_role
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Step 5: Issue app session JWT token
    token = create_access_token(data={"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }



