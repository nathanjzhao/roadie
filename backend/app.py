import logging
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

from backend.utils.db import get_db, Base, engine
from backend.user_routes import router as user_router

# instantiate the API
app = FastAPI()
app.include_router(user_router)

origins = [
    "http://localhost:3000",  # Allow frontend origin during development
    # "https://your-production-frontend-url.com",  # Allow frontend origin in production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# initialize logger
logging.basicConfig(format='%(asctime)s - %(levelname)s - %(message)s',
                    level=logging.INFO)
log = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_event():
    log.info('Initializing API ...')
    Base.metadata.create_all(bind=engine)


@app.get("/")
def read_root():
    return {"Hello": "World"}
