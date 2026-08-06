import asyncio
import sys
import argparse
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db, AsyncSessionLocal
from app.models.user import User
from sqlalchemy import select
from app.core.security import get_password_hash

async def create_or_update_user(username: str, password: str):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.username == username))
        user = result.scalar_one_or_none()
        
        hashed = get_password_hash(password)
        if user:
            user.password_hash = hashed
            await db.commit()
            print(f"Updated password for user '{username}'")
        else:
            new_user = User(username=username, password_hash=hashed)
            db.add(new_user)
            await db.commit()
            print(f"Created new user '{username}'")

async def rename_user(old_username: str, new_username: str):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.username == old_username))
        user = result.scalar_one_or_none()
        
        if user:
            user.username = new_username
            await db.commit()
            print(f"Renamed user '{old_username}' to '{new_username}'")
        else:
            print(f"Error: User '{old_username}' does not exist.")

def main():
    parser = argparse.ArgumentParser(description="Manage Admin Users")
    parser.add_argument("action", choices=["set", "rename"], help="Action to perform: 'set' to set password or create user, 'rename' to change username")
    parser.add_argument("username", help="Username (or old username if renaming)")
    parser.add_argument("password_or_new_username", help="Password (or new username if renaming)")
    
    args = parser.parse_args()
    
    if args.action == "set":
        asyncio.run(create_or_update_user(args.username, args.password_or_new_username))
    elif args.action == "rename":
        asyncio.run(rename_user(args.username, args.password_or_new_username))

if __name__ == "__main__":
    main()
