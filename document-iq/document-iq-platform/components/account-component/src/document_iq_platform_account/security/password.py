from passlib.context import CryptContext

# Use bcrypt_sha256 to safely support passwords longer than 72 bytes,
# while keeping legacy bcrypt hashes verifiable during migration.
pwd_context = CryptContext(schemes=["bcrypt_sha256", "bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)
