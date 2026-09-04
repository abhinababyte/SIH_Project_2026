"""Seed one example location for local development.

Run with: python seed.py
"""

from app.database import Base, SessionLocal, engine
from app.models import Location

Base.metadata.create_all(bind=engine)
with SessionLocal() as db:
    exists = db.query(Location).filter(Location.name == "Bhagirathi Ward").first()
    if not exists:
        db.add(Location(
            name="Bhagirathi Ward",
            district="Uttarkashi",
            state="Uttarakhand",
            latitude=30.7268,
            longitude=78.4354,
            elevation_m=1150,
        ))
        db.commit()
        print("Created Bhagirathi Ward with location_id=1 (if database was empty).")
    else:
        print(f"Location already exists with location_id={exists.id}.")
