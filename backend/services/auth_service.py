import os
from dotenv import load_dotenv
from supabase import create_client, Client
from backend.models.user_model import UserSignUpRequest, UserLoginRequest, UserProfile

# Load environment variables
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(base_dir, ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
else:
    load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

class AuthException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

def get_supabase_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise AuthException(
            "Supabase credentials not configured in environment variables.",
            status_code=500
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

class AuthService:
    def __init__(self):
        self._auth_supabase = None
        self._db_supabase = None

    @property
    def auth_supabase(self) -> Client:
        if self._auth_supabase is None:
            self._auth_supabase = get_supabase_client()
        return self._auth_supabase

    @property
    def db_supabase(self) -> Client:
        if self._db_supabase is None:
            self._db_supabase = get_supabase_client()
        return self._db_supabase

    @property
    def supabase(self) -> Client:
        # Keep as fallback, using auth client
        return self.auth_supabase

    def sign_up(self, data: UserSignUpRequest) -> dict:
        try:
            # 1. Create user in Supabase Auth with metadata options
            auth_response = self.auth_supabase.auth.sign_up({
                "email": data.email,
                "password": data.password,
                "options": {
                    "data": {
                        "full_name": data.full_name,
                        "college": data.college,
                        "target_role": data.target_role
                    }
                }
            })
            
            if not auth_response.user:
                raise AuthException("Failed to create user in Supabase Auth.", 400)
            
            user_id = auth_response.user.id
            
            # 2. Insert profile data into users table using the db client (uses service key to bypass RLS)
            profile_data = {
                "id": user_id,
                "email": data.email,
                "full_name": data.full_name,
                "college": data.college,
                "target_role": data.target_role,
            }
            
            db_response = self.db_supabase.table("users").insert(profile_data).execute()
            
            if not db_response.data:
                raise AuthException("User created in Auth, but profile table insertion failed.", 500)
            
            user_profile = db_response.data[0]
            if not isinstance(user_profile, dict):
                raise AuthException("Invalid user profile format from database.", 500)
            
            token = ""
            if auth_response.session:
                token = auth_response.session.access_token
            else:
                token = "verification_required_check_email"
                
            return {
                "token": token,
                "user": UserProfile(**user_profile)
            }
            
        except Exception as e:
            err_msg = str(e)
            err_code = getattr(e, 'code', None)
            if ("User already registered" in err_msg or
                "already exists" in err_msg or
                "duplicate key" in err_msg or
                err_code == "23505"):
                raise AuthException("An account with this email already exists", 400)
            raise AuthException(err_msg, 400)

    def login(self, data: UserLoginRequest) -> dict:
        try:
            # 1. Authenticate via Supabase Auth
            auth_response = self.auth_supabase.auth.sign_in_with_password({
                "email": data.email,
                "password": data.password
            })
            
            if not auth_response.user or not auth_response.session:
                raise AuthException("Invalid credentials", 401)
                
            user_id = auth_response.user.id
            token = auth_response.session.access_token
            
            # 2. Fetch user profile from users table
            db_response = self.db_supabase.table("users").select("*").eq("id", user_id).execute()
            
            # If auth user exists but profile row does not, create it automatically on login
            if not db_response.data:
                email = auth_response.user.email
                existing = self.db_supabase.table("users").select("*").eq("email", email).execute()
                if existing.data:
                    self.db_supabase.table("users").update({"id": user_id}).eq("email", email).execute()
                    db_response = self.db_supabase.table("users").select("*").eq("id", user_id).execute()
                else:
                    metadata = auth_response.user.user_metadata or {}
                    profile_data = {
                        "id": user_id,
                        "email": email,
                        "full_name": metadata.get("full_name") or email.split("@")[0],
                        "college": metadata.get("college"),
                        "target_role": metadata.get("target_role"),
                    }
                    db_response = self.db_supabase.table("users").insert(profile_data).execute()
                    if not db_response.data:
                        raise AuthException("User profile not found in database, and auto-creation failed.", 404)
                
            user_profile = db_response.data[0]
            if not isinstance(user_profile, dict):
                raise AuthException("Invalid user profile format from database.", 500)
            
            return {
                "token": token,
                "user": UserProfile(**user_profile)
            }
            
        except Exception as e:
            err_msg = str(e)
            err_code = getattr(e, 'code', None)
            if "Invalid login credentials" in err_msg or "invalid_credentials" in err_msg:
                raise AuthException("Invalid credentials", 401)
            if "duplicate key" in err_msg or err_code == "23505":
                raise AuthException("An account with this email already exists", 400)
            raise AuthException(err_msg, 401)

    def get_profile_by_id(self, user_id: str) -> UserProfile:
        try:
            db_response = self.db_supabase.table("users").select("*").eq("id", user_id).execute()
            if not db_response.data:
                raise AuthException("User profile not found", 404)
            user_profile = db_response.data[0]
            if not isinstance(user_profile, dict):
                raise AuthException("Invalid user profile format from database.", 500)
            return UserProfile(**user_profile)
        except Exception as e:
            if isinstance(e, AuthException):
                raise e
            raise AuthException(str(e), 400)
