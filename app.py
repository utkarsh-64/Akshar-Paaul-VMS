from flask import Flask, request, jsonify, session, send_from_directory, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, date
import os
from functools import wraps
from dotenv import load_dotenv
from authlib.integrations.flask_client import OAuth
import secrets

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__, static_folder='frontend/build', static_url_path='')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')

# Session configuration - CRITICAL for OAuth
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_DOMAIN'] = None  # Allow localhost
app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 24 hours

# OAuth Configuration
oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id=os.environ.get('GOOGLE_CLIENT_ID'),
    client_secret=os.environ.get('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///volunteer_system.db')

# Convert postgres:// to postgresql:// for SQLAlchemy (Render uses postgres://)
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

# Add SSL for production databases
if DATABASE_URL.startswith('postgresql://') and ('supabase.co' in DATABASE_URL or 'render.com' in DATABASE_URL):
    if '?sslmode=' not in DATABASE_URL:
        DATABASE_URL += '?sslmode=require'

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'

# Create uploads directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)

# CORS configuration - allow credentials for session cookies
CORS(app, 
     supports_credentials=True,
     origins=['http://localhost:3000', 'https://*.vercel.app', 'https://akshar-paaul-vms.onrender.com'],
     allow_headers=['Content-Type', 'Authorization'],
     expose_headers=['Set-Cookie'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=True)  # Nullable for OAuth users
    role = db.Column(db.String(20), nullable=False, default='volunteer')  # volunteer or admin
    
    # OAuth fields
    oauth_provider = db.Column(db.String(50))  # 'google', 'linkedin', etc.
    oauth_id = db.Column(db.String(255))  # Provider's user ID
    profile_picture = db.Column(db.String(500))  # Profile picture URL
    
    # Enhanced volunteer profile fields
    full_name = db.Column(db.String(100))
    phone = db.Column(db.String(15))
    college_name = db.Column(db.String(200))
    course = db.Column(db.String(100))
    year_of_study = db.Column(db.String(20))
    student_id = db.Column(db.String(50))
    address = db.Column(db.Text)
    emergency_contact = db.Column(db.String(100))
    emergency_phone = db.Column(db.String(15))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    work_logs = db.relationship('WorkLog', backref='volunteer', lazy=True, foreign_keys='WorkLog.volunteer_id')
    projects = db.relationship('Project', backref='volunteer', lazy=True, foreign_keys='Project.volunteer_id')
    documents = db.relationship('Document', backref='uploaded_by_user', lazy=True)
    
    # Team memberships
    team_memberships = db.relationship('TeamMember', backref='user', lazy=True)

class WorkLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    volunteer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    hours_worked = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    approved_by_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Team(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    members = db.relationship('TeamMember', backref='team', lazy=True)
    projects = db.relationship('Project', backref='team', lazy=True)

class TeamMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('team.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    role = db.Column(db.String(50), default='member')  # leader, member
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    volunteer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Project lead
    team_id = db.Column(db.Integer, db.ForeignKey('team.id'))  # Optional team project
    is_team_project = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default='draft')  # draft, submitted, approved, rejected, in_progress, completed
    approved_by_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    updates = db.relationship('ProjectUpdate', backref='project', lazy=True, cascade='all, delete-orphan')
    
    def can_be_deleted_by(self, user_id):
        """Check if project can be deleted by user"""
        # Only creator can delete
        if self.volunteer_id != user_id:
            return False, "Only project creator can delete this project"
        
        # Check for team member work logs if it's a team project
        if self.team_id:
            team_members = TeamMember.query.filter_by(team_id=self.team_id).all()
            member_ids = [m.user_id for m in team_members if m.user_id != user_id]
            
            if member_ids:
                existing_logs = WorkLog.query.filter(
                    WorkLog.volunteer_id.in_(member_ids)
                ).join(Document, Document.work_log_id == WorkLog.id, isouter=True).filter(
                    Document.project_id == self.id
                ).first()
                
                if existing_logs:
                    return False, "Cannot delete project with team member work logs"
        
        # Check for any work logs associated with this project
        project_logs = WorkLog.query.join(Document).filter(Document.project_id == self.id).first()
        if project_logs:
            return False, "Cannot delete project with associated work logs"
        
        return True, "Project can be deleted"

class ProjectUpdate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    document_type = db.Column(db.String(20), nullable=False)  # submission, signed, proposal, update
    drive_link = db.Column(db.String(500), nullable=False)  # Google Drive link instead of file
    uploaded_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    work_log_id = db.Column(db.Integer, db.ForeignKey('work_log.id'))
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Team access relationship
    team_access = db.relationship('DocumentTeamAccess', backref='document', lazy=True, cascade='all, delete-orphan')

class DocumentTeamAccess(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('document.id'), nullable=False)
    team_id = db.Column(db.Integer, db.ForeignKey('team.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Ensure unique document-team combinations
    __table_args__ = (db.UniqueConstraint('document_id', 'team_id', name='unique_document_team'),)

# Authentication decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def get_current_user():
    """Helper function to safely get the current user from session."""
    if 'user_id' not in session:
        return None
    user = User.query.get(session['user_id'])
    if not user:
        # User was deleted, clear the session
        session.pop('user_id', None)
    return user

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        if user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

# Routes

# Authentication Routes
@app.route('/api/auth/login/', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        print(f"🔐 Login attempt: username={username}")
        
        # Check if any users exist
        user_count = User.query.count()
        print(f"👥 Total users in database: {user_count}")
        
        user = User.query.filter_by(username=username).first()
        
        if not user:
            print(f"❌ User '{username}' not found")
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
        
        print(f"✅ User found: {user.username}, role: {user.role}")
        
        if check_password_hash(user.password_hash, password):
            session['user_id'] = user.id
            print(f"✅ Login successful for {username}")
            return jsonify({
                'success': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'role': user.role,
                    'email': user.email
                }
            })
        else:
            print(f"❌ Invalid password for {username}")
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return jsonify({'success': False, 'error': 'Login failed'}), 500

@app.route('/api/auth/logout/', methods=['GET'])
@login_required
def logout():
    session.pop('user_id', None)
    return jsonify({'success': True})

@app.route('/api/auth/profile/', methods=['GET'])
@login_required
def profile():
    user = User.query.get(session['user_id'])
    if not user:
        # User not found, clear session and return error
        session.pop('user_id', None)
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'phone': user.phone or ''
    })

@app.route('/api/auth/register/', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        role=data.get('role', 'volunteer'),
        full_name=data.get('full_name', ''),
        phone=data.get('phone', ''),
        college_name=data.get('college_name', ''),
        course=data.get('course', ''),
        year_of_study=data.get('year_of_study', ''),
        student_id=data.get('student_id', ''),
        address=data.get('address', ''),
        emergency_contact=data.get('emergency_contact', ''),
        emergency_phone=data.get('emergency_phone', '')
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'User created successfully'})

# OAuth Routes - Google Login (moved below)

@app.route('/api/auth/google/callback', methods=['GET'])
def google_callback():
    """Handle Google OAuth callback"""
    try:
        print("\n🔄 OAuth Callback - Starting...")
        print(f"Request args: {request.args}")
        print(f"Session keys before authorize: {list(session.keys())}")
        print(f"Full session before: {dict(session)}")
        
        # Check what authlib is looking for
        state_in_request = request.args.get('state')
        print(f"State in request: {state_in_request}")
        
        # Authorize and get token - authlib will verify state automatically
        token = google.authorize_access_token()
        print(f"✅ Token received: {list(token.keys())}")
        
        user_info = token.get('userinfo')
        
        if not user_info:
            print("❌ No userinfo in token")
            return redirect('http://localhost:3000/?oauth=error')
        
        print(f"✅ User info: {user_info.get('email')}")
        
        # Check if user exists
        user = User.query.filter_by(email=user_info['email']).first()
        
        if not user:
            print("👤 Creating new user...")
            # Create new user from Google data
            username = user_info['email'].split('@')[0]
            # Ensure unique username
            base_username = username
            counter = 1
            while User.query.filter_by(username=username).first():
                username = f"{base_username}{counter}"
                counter += 1
            
            user = User(
                username=username,
                email=user_info['email'],
                full_name=user_info.get('name', ''),
                profile_picture=user_info.get('picture', ''),
                oauth_provider='google',
                oauth_id=user_info['sub'],
                role='volunteer',
                password_hash=None  # OAuth users don't have password
            )
            db.session.add(user)
            db.session.commit()
            print(f"✅ Created user: {user.username}")
        else:
            print(f"👤 Found existing user: {user.username}")
            # Update OAuth info if user exists but wasn't OAuth user
            if not user.oauth_provider:
                user.oauth_provider = 'google'
                user.oauth_id = user_info['sub']
                user.profile_picture = user_info.get('picture', '')
                db.session.commit()
        
        # CRITICAL: Clear and set session properly
        session.clear()
        session['user_id'] = user.id
        session.permanent = True
        session.modified = True
        
        print(f"✅ Session set: user_id={session.get('user_id')}")
        print(f"Session after: {dict(session)}")
        
        # Redirect to frontend with success
        return redirect('http://localhost:3000/dashboard?oauth=success')
        
    except Exception as e:
        print(f"❌ OAuth error: {str(e)}")
        import traceback
        traceback.print_exc()
        return redirect('http://localhost:3000/?oauth=error')

@app.route('/api/auth/google/login', methods=['GET'])
def google_login():
    """Initiate Google OAuth - redirect directly to Google"""
    try:
        redirect_uri = url_for('google_callback', _external=True)
        print(f"🔗 Initiating OAuth, redirect URI: {redirect_uri}")
        print(f"Session before redirect: {dict(session)}")
        
        # This will create the URL AND store state in session, then redirect
        return google.authorize_redirect(redirect_uri)
        
    except Exception as e:
        print(f"❌ Error initiating OAuth: {str(e)}")
        import traceback
        traceback.print_exc()
        return redirect('http://localhost:3000/?oauth=error')

# Work Log Routes
@app.route('/api/volunteers/work-logs/', methods=['GET'])
@login_required
def get_work_logs():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401
    
    if user.role == 'volunteer':
        logs = WorkLog.query.filter_by(volunteer_id=user.id).order_by(WorkLog.date.desc()).all()
    else:
        logs = WorkLog.query.order_by(WorkLog.date.desc()).all()
    
    work_logs = []
    for log in logs:
        log_data = {
            'id': log.id,
            'date': log.date.isoformat(),
            'hours_worked': log.hours_worked,
            'description': log.description,
            'status': log.status,
            'volunteer': log.volunteer.username
        }
        
        # Add detailed volunteer info for admins
        if user.role == 'admin':
            # Get volunteer's team information
            team_membership = TeamMember.query.filter_by(user_id=log.volunteer.id).first()
            team_name = None
            if team_membership:
                team = Team.query.get(team_membership.team_id)
                team_name = team.name if team else None
            
            log_data['volunteer_details'] = {
                'full_name': log.volunteer.full_name,
                'college_name': log.volunteer.college_name,
                'course': log.volunteer.course,
                'year_of_study': log.volunteer.year_of_study,
                'phone': log.volunteer.phone,
                'email': log.volunteer.email,
                'team_name': team_name
            }
        
        work_logs.append(log_data)
    
    return jsonify({'work_logs': work_logs})

@app.route('/api/volunteers/work-logs/create/', methods=['POST'])
@login_required
def create_work_log():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401
    
    if user.role != 'volunteer':
        return jsonify({'error': 'Only volunteers can create work logs'}), 403
    
    data = request.get_json()
    
    work_log = WorkLog(
        volunteer_id=user.id,
        date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
        hours_worked=float(data['hours_worked']),
        description=data['description']
    )
    
    db.session.add(work_log)
    db.session.commit()
    
    return jsonify({'success': True, 'log_id': work_log.id})

@app.route('/api/volunteers/work-logs/<int:log_id>/approve/', methods=['POST'])
@admin_required
def approve_work_log(log_id):
    data = request.get_json()
    status = data.get('status')
    
    if status not in ['approved', 'rejected']:
        return jsonify({'error': 'Invalid status'}), 400
    
    work_log = WorkLog.query.get_or_404(log_id)
    work_log.status = status
    work_log.approved_by_id = session['user_id']
    
    db.session.commit()
    
    return jsonify({'success': True})

# Project Routes
@app.route('/api/projects/', methods=['GET'])
@login_required
def get_projects():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401
    
    if user.role == 'volunteer':
        projects = Project.query.filter_by(volunteer_id=user.id).order_by(Project.created_at.desc()).all()
    else:
        projects = Project.query.order_by(Project.created_at.desc()).all()
    
    project_list = []
    for project in projects:
        project_data = {
            'id': project.id,
            'title': project.title,
            'description': project.description,
            'status': project.status,
            'volunteer': project.volunteer.username,
            'created_at': project.created_at.isoformat(),
            'is_team_project': project.is_team_project
        }
        
        # Add team information if it's a team project
        if project.team_id:
            team = Team.query.get(project.team_id)
            if team:
                project_data['team_name'] = team.name
                project_data['team_id'] = team.id
        
        project_list.append(project_data)
    
    return jsonify({'projects': project_list})

@app.route('/api/projects/create/', methods=['POST'])
@login_required
def create_project():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401
    
    if user.role != 'volunteer':
        return jsonify({'error': 'Only volunteers can create projects'}), 403
    
    data = request.get_json()
    
    project = Project(
        title=data['title'],
        description=data['description'],
        volunteer_id=user.id,
        is_team_project=data.get('is_team_project', False),
        team_id=data.get('team_id') if data.get('is_team_project') else None
    )
    
    db.session.add(project)
    db.session.commit()
    
    return jsonify({'success': True, 'project_id': project.id})

@app.route('/api/projects/<int:project_id>/updates/', methods=['GET'])
@login_required
def get_project_updates(project_id):
    updates = ProjectUpdate.query.filter_by(project_id=project_id).order_by(ProjectUpdate.created_at.desc()).all()
    
    update_list = []
    for update in updates:
        creator = User.query.get(update.created_by_id)
        update_list.append({
            'id': update.id,
            'title': update.title,
            'description': update.description,
            'created_by': creator.username,
            'created_at': update.created_at.isoformat()
        })
    
    return jsonify({'updates': update_list})

@app.route('/api/projects/<int:project_id>/updates/create/', methods=['POST'])
@login_required
def create_project_update(project_id):
    data = request.get_json()
    
    update = ProjectUpdate(
        project_id=project_id,
        title=data['title'],
        description=data['description'],
        created_by_id=session['user_id']
    )
    
    db.session.add(update)
    db.session.commit()
    
    return jsonify({'success': True, 'update_id': update.id})

@app.route('/api/projects/<int:project_id>/submit/', methods=['POST'])
@login_required
def submit_project(project_id):
    user = User.query.get(session['user_id'])
    project = Project.query.get_or_404(project_id)
    
    if project.volunteer_id != user.id and user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    if project.status == 'draft':
        project.status = 'submitted'
        db.session.commit()
        return jsonify({'success': True, 'message': 'Project submitted for review'})
    
    return jsonify({'error': 'Project cannot be submitted in current status'}), 400

@app.route('/api/projects/<int:project_id>/approve/', methods=['POST'])
@admin_required
def approve_project(project_id):
    data = request.get_json()
    action = data.get('action')  # 'approve' or 'reject'
    
    project = Project.query.get_or_404(project_id)
    
    if action == 'approve':
        project.status = 'approved'
        project.approved_by_id = session['user_id']
    elif action == 'reject':
        project.status = 'rejected'
        project.approved_by_id = session['user_id']
    else:
        return jsonify({'error': 'Invalid action'}), 400
    
    db.session.commit()
    return jsonify({'success': True, 'message': f'Project {action}d successfully'})

@app.route('/api/projects/<int:project_id>/delete/', methods=['DELETE'])
@login_required
def delete_project(project_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401
    
    project = Project.query.get_or_404(project_id)
    
    # Check if user can delete this project
    can_delete, message = project.can_be_deleted_by(user.id)
    
    if not can_delete:
        return jsonify({'error': message}), 403
    
    try:
        # Store project info for response
        project_title = project.title
        
        # Delete associated documents first (cascade should handle this, but being explicit)
        Document.query.filter_by(project_id=project_id).delete()
        
        # Delete the project (this will cascade delete updates due to relationship)
        db.session.delete(project)
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': f'Project "{project_title}" deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete project. Please try again.'}), 500

# Team Management Routes
@app.route('/api/teams/', methods=['GET'])
@login_required
def get_teams():
    user = User.query.get(session['user_id'])
    
    if user.role == 'volunteer':
        # Get teams where user is a member
        team_memberships = TeamMember.query.filter_by(user_id=user.id).all()
        teams = [membership.team for membership in team_memberships]
    else:
        # Admin can see all teams
        teams = Team.query.all()
    
    team_list = []
    for team in teams:
        team_list.append({
            'id': team.id,
            'name': team.name,
            'description': team.description,
            'member_count': len(team.members),
            'created_at': team.created_at.isoformat()
        })
    
    return jsonify({'teams': team_list})

@app.route('/api/teams/create/', methods=['POST'])
@login_required
def create_team():
    user = User.query.get(session['user_id'])
    
    if user.role != 'volunteer':
        return jsonify({'error': 'Only volunteers can create teams'}), 403
    
    data = request.get_json()
    
    team = Team(
        name=data['name'],
        description=data.get('description', ''),
        created_by_id=user.id
    )
    
    db.session.add(team)
    db.session.flush()  # Get team ID
    
    # Add creator as team leader
    team_member = TeamMember(
        team_id=team.id,
        user_id=user.id,
        role='leader'
    )
    
    db.session.add(team_member)
    db.session.commit()
    
    return jsonify({'success': True, 'team_id': team.id})

@app.route('/api/teams/<int:team_id>/members/', methods=['GET'])
@login_required
def get_team_members(team_id):
    team = Team.query.get_or_404(team_id)
    
    members = []
    for membership in team.members:
        user = membership.user
        members.append({
            'id': user.id,
            'username': user.username,
            'full_name': user.full_name,
            'college_name': user.college_name,
            'role': membership.role,
            'joined_at': membership.joined_at.isoformat()
        })
    
    return jsonify({'members': members})

@app.route('/api/teams/<int:team_id>/join/', methods=['POST'])
@login_required
def join_team(team_id):
    user = User.query.get(session['user_id'])
    
    if user.role != 'volunteer':
        return jsonify({'error': 'Only volunteers can join teams'}), 403
    
    # Check if already a member
    existing = TeamMember.query.filter_by(team_id=team_id, user_id=user.id).first()
    if existing:
        return jsonify({'error': 'Already a member of this team'}), 400
    
    team_member = TeamMember(
        team_id=team_id,
        user_id=user.id,
        role='member'
    )
    
    db.session.add(team_member)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Joined team successfully'})

@app.route('/api/teams/<int:team_id>/add-member/', methods=['POST'])
@login_required
def add_team_member(team_id):
    user = User.query.get(session['user_id'])
    data = request.get_json()
    
    # Check if user is team leader or admin
    team = Team.query.get_or_404(team_id)
    is_leader = TeamMember.query.filter_by(team_id=team_id, user_id=user.id, role='leader').first()
    
    if user.role != 'admin' and not is_leader:
        return jsonify({'error': 'Only team leaders or admins can add members'}), 403
    
    # Find user by username or email
    username_or_email = data.get('username_or_email')
    target_user = User.query.filter(
        (User.username == username_or_email) | (User.email == username_or_email)
    ).first()
    
    if not target_user:
        return jsonify({'error': 'User not found'}), 404
    
    if target_user.role != 'volunteer':
        return jsonify({'error': 'Only volunteers can be added to teams'}), 400
    
    # Check if already a member
    existing = TeamMember.query.filter_by(team_id=team_id, user_id=target_user.id).first()
    if existing:
        return jsonify({'error': 'User is already a member of this team'}), 400
    
    team_member = TeamMember(
        team_id=team_id,
        user_id=target_user.id,
        role='member'
    )
    
    db.session.add(team_member)
    db.session.commit()
    
    return jsonify({'success': True, 'message': f'{target_user.username} added to team successfully'})

@app.route('/api/teams/<int:team_id>/remove-member/', methods=['POST'])
@login_required
def remove_team_member(team_id):
    user = User.query.get(session['user_id'])
    data = request.get_json()
    member_id = data.get('member_id')
    
    # Check if user is team leader or admin
    team = Team.query.get_or_404(team_id)
    is_leader = TeamMember.query.filter_by(team_id=team_id, user_id=user.id, role='leader').first()
    
    if user.role != 'admin' and not is_leader:
        return jsonify({'error': 'Only team leaders or admins can remove members'}), 403
    
    # Find the team member
    team_member = TeamMember.query.filter_by(team_id=team_id, user_id=member_id).first()
    if not team_member:
        return jsonify({'error': 'Member not found in team'}), 404
    
    # Don't allow removing the team leader
    if team_member.role == 'leader':
        return jsonify({'error': 'Cannot remove team leader'}), 400
    
    db.session.delete(team_member)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Member removed from team successfully'})

@app.route('/api/users/search/', methods=['GET'])
@login_required
def search_users():
    query = request.args.get('q', '').strip()
    
    if len(query) < 2:
        return jsonify({'users': []})
    
    # Search for volunteers by username, full_name, or email
    users = User.query.filter(
        User.role == 'volunteer',
        (User.username.ilike(f'%{query}%') | 
         User.full_name.ilike(f'%{query}%') | 
         User.email.ilike(f'%{query}%'))
    ).limit(10).all()
    
    user_list = []
    for u in users:
        user_list.append({
            'id': u.id,
            'username': u.username,
            'full_name': u.full_name,
            'email': u.email,
            'college_name': u.college_name,
            'course': u.course
        })
    
    return jsonify({'users': user_list})

# Team-specific data endpoints
@app.route('/api/teams/<int:team_id>/projects/', methods=['GET'])
@login_required
def get_team_projects(team_id):
    user = User.query.get(session['user_id'])
    team = Team.query.get_or_404(team_id)
    
    # Check if user is team member or admin
    is_member = TeamMember.query.filter_by(team_id=team_id, user_id=user.id).first()
    if user.role != 'admin' and not is_member:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get team projects (both assigned to team and created by team members)
    team_members = TeamMember.query.filter_by(team_id=team_id).all()
    member_ids = [member.user_id for member in team_members]
    
    # Get projects that are either assigned to the team OR created by team members
    projects = Project.query.filter(
        (Project.team_id == team_id) | 
        (Project.volunteer_id.in_(member_ids))
    ).order_by(Project.created_at.desc()).all()
    
    project_list = []
    for project in projects:
        project_list.append({
            'id': project.id,
            'title': project.title,
            'description': project.description,
            'status': project.status,
            'volunteer': project.volunteer.username,
            'volunteer_details': {
                'full_name': project.volunteer.full_name,
                'college_name': project.volunteer.college_name
            },
            'created_at': project.created_at.isoformat(),
            'start_date': project.start_date.isoformat() if project.start_date else None,
            'end_date': project.end_date.isoformat() if project.end_date else None
        })
    
    return jsonify({'projects': project_list})

@app.route('/api/teams/<int:team_id>/work-logs/', methods=['GET'])
@login_required
def get_team_work_logs(team_id):
    user = User.query.get(session['user_id'])
    team = Team.query.get_or_404(team_id)
    
    # Check if user is team member or admin
    is_member = TeamMember.query.filter_by(team_id=team_id, user_id=user.id).first()
    if user.role != 'admin' and not is_member:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get work logs from all team members
    team_members = TeamMember.query.filter_by(team_id=team_id).all()
    member_ids = [member.user_id for member in team_members]
    
    logs = WorkLog.query.filter(WorkLog.volunteer_id.in_(member_ids)).order_by(WorkLog.date.desc()).all()
    
    work_logs = []
    for log in logs:
        work_logs.append({
            'id': log.id,
            'date': log.date.isoformat(),
            'hours_worked': log.hours_worked,
            'description': log.description,
            'status': log.status,
            'volunteer': log.volunteer.username,
            'volunteer_details': {
                'full_name': log.volunteer.full_name,
                'college_name': log.volunteer.college_name,
                'course': log.volunteer.course,
                'year_of_study': log.volunteer.year_of_study,
                'phone': log.volunteer.phone,
                'email': log.volunteer.email
            }
        })
    
    return jsonify({'work_logs': work_logs})

@app.route('/api/teams/<int:team_id>/documents/', methods=['GET'])
@login_required
def get_team_documents(team_id):
    user = User.query.get(session['user_id'])
    team = Team.query.get_or_404(team_id)
    
    # Check if user is team member or admin
    is_member = TeamMember.query.filter_by(team_id=team_id, user_id=user.id).first()
    if user.role != 'admin' and not is_member:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get documents from team projects and team members
    team_members = TeamMember.query.filter_by(team_id=team_id).all()
    member_ids = [member.user_id for member in team_members]
    
    team_projects = Project.query.filter_by(team_id=team_id).all()
    project_ids = [project.id for project in team_projects]
    
    # Get documents that are specifically shared with this team
    team_access_docs = db.session.query(Document).join(
        DocumentTeamAccess, Document.id == DocumentTeamAccess.document_id
    ).filter(DocumentTeamAccess.team_id == team_id).all()
    
    # Get documents from team members and team projects
    member_project_docs = Document.query.filter(
        (Document.uploaded_by_id.in_(member_ids)) |
        (Document.project_id.in_(project_ids))
    ).all()
    
    # Combine and deduplicate documents
    all_docs = {}
    for doc in team_access_docs + member_project_docs:
        all_docs[doc.id] = doc
    
    documents = list(all_docs.values())
    documents.sort(key=lambda x: x.created_at, reverse=True)
    
    doc_list = []
    for doc in documents:
        doc_list.append({
            'id': doc.id,
            'title': doc.title,
            'document_type': doc.document_type,
            'drive_link': doc.drive_link,
            'uploaded_by': doc.uploaded_by_user.username,
            'uploaded_by_details': {
                'full_name': doc.uploaded_by_user.full_name,
                'college_name': doc.uploaded_by_user.college_name,
                'course': doc.uploaded_by_user.course
            },
            'created_at': doc.created_at.isoformat()
        })
    
    return jsonify({'documents': doc_list})

@app.route('/api/teams/<int:team_id>/stats/', methods=['GET'])
@login_required
def get_team_stats(team_id):
    user = User.query.get(session['user_id'])
    team = Team.query.get_or_404(team_id)
    
    # Check if user is team member or admin
    is_member = TeamMember.query.filter_by(team_id=team_id, user_id=user.id).first()
    if user.role != 'admin' and not is_member:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get team statistics
    team_members = TeamMember.query.filter_by(team_id=team_id).all()
    member_ids = [member.user_id for member in team_members]
    
    # Total hours by team
    total_hours = db.session.query(db.func.sum(WorkLog.hours_worked)).filter(
        WorkLog.volunteer_id.in_(member_ids)
    ).scalar() or 0
    
    # Pending approvals
    pending_logs = WorkLog.query.filter(
        WorkLog.volunteer_id.in_(member_ids),
        WorkLog.status == 'pending'
    ).count()
    
    # Team projects
    team_projects = Project.query.filter_by(team_id=team_id).count()
    
    # Active projects
    active_projects = Project.query.filter(
        Project.team_id == team_id,
        Project.status.in_(['approved', 'in_progress'])
    ).count()
    
    return jsonify({
        'total_hours': float(total_hours),
        'pending_approvals': pending_logs,
        'total_projects': team_projects,
        'active_projects': active_projects,
        'member_count': len(team_members)
    })

@app.route('/api/teams/<int:team_id>/member-hours/', methods=['GET'])
@login_required
def get_team_member_hours(team_id):
    user = User.query.get(session['user_id'])
    team = Team.query.get_or_404(team_id)
    
    # Check if user is team member or admin
    is_member = TeamMember.query.filter_by(team_id=team_id, user_id=user.id).first()
    if user.role != 'admin' and not is_member:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get team members with their total hours
    team_members = TeamMember.query.filter_by(team_id=team_id).all()
    
    member_hours = []
    for member in team_members:
        volunteer = User.query.get(member.user_id)
        total_hours = db.session.query(db.func.sum(WorkLog.hours_worked)).filter(
            WorkLog.volunteer_id == member.user_id
        ).scalar() or 0
        
        member_hours.append({
            'user_id': volunteer.id,
            'username': volunteer.username,
            'full_name': volunteer.full_name,
            'total_hours': float(total_hours),
            'role': member.role
        })
    
    # Sort by total hours descending
    member_hours.sort(key=lambda x: x['total_hours'], reverse=True)
    
    return jsonify({
        'member_hours': member_hours
    })

# Admin Team Management Routes
@app.route('/api/admin/teams/create/', methods=['POST'])
@admin_required
def admin_create_team():
    data = request.get_json()
    
    team = Team(
        name=data['name'],
        description=data.get('description', ''),
        created_by_id=session['user_id']
    )
    
    db.session.add(team)
    db.session.commit()
    
    return jsonify({'success': True, 'team_id': team.id})

@app.route('/api/admin/teams/<int:team_id>/delete/', methods=['DELETE'])
@admin_required
def admin_delete_team(team_id):
    team = Team.query.get_or_404(team_id)
    
    try:
        # Check if team has associated projects
        team_projects = Project.query.filter_by(team_id=team_id).count()
        if team_projects > 0:
            return jsonify({'error': f'Cannot delete team with {team_projects} associated projects'}), 400
        
        # Delete team members first
        TeamMember.query.filter_by(team_id=team_id).delete()
        
        # Delete team documents access
        team_docs = Document.query.join(DocumentTeamAccess).filter(DocumentTeamAccess.team_id == team_id).all()
        for doc in team_docs:
            DocumentTeamAccess.query.filter_by(document_id=doc.id, team_id=team_id).delete()
        
        # Delete the team
        db.session.delete(team)
        db.session.commit()
        
        return jsonify({'success': True, 'message': f'Team "{team.name}" deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete team. Please try again.'}), 500

@app.route('/api/teams/<int:team_id>/delete/', methods=['DELETE'])
@login_required
def delete_team(team_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401
    
    team = Team.query.get_or_404(team_id)
    
    # Check if user is team creator or admin
    if team.created_by_id != user.id and user.role != 'admin':
        return jsonify({'error': 'Only team creator or admin can delete this team'}), 403
    
    try:
        # Check if team has associated projects
        team_projects = Project.query.filter_by(team_id=team_id).count()
        if team_projects > 0:
            return jsonify({'error': f'Cannot delete team with {team_projects} associated projects'}), 400
        
        # Delete team members first
        TeamMember.query.filter_by(team_id=team_id).delete()
        
        # Delete team documents access
        team_docs = Document.query.join(DocumentTeamAccess).filter(DocumentTeamAccess.team_id == team_id).all()
        for doc in team_docs:
            DocumentTeamAccess.query.filter_by(document_id=doc.id, team_id=team_id).delete()
        
        # Delete the team
        db.session.delete(team)
        db.session.commit()
        
        return jsonify({'success': True, 'message': f'Team "{team.name}" deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete team. Please try again.'}), 500

@app.route('/api/projects/<int:project_id>/start/', methods=['POST'])
@login_required
def start_project(project_id):
    user = User.query.get(session['user_id'])
    project = Project.query.get_or_404(project_id)
    
    if project.volunteer_id != user.id and user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    if project.status == 'approved':
        project.status = 'in_progress'
        project.start_date = date.today()
        db.session.commit()
        return jsonify({'success': True, 'message': 'Project started'})
    
    return jsonify({'error': 'Project must be approved before starting'}), 400

@app.route('/api/projects/<int:project_id>/complete/', methods=['POST'])
@login_required
def complete_project(project_id):
    user = User.query.get(session['user_id'])
    project = Project.query.get_or_404(project_id)
    
    if project.volunteer_id != user.id and user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    if project.status == 'in_progress':
        project.status = 'completed'
        project.end_date = date.today()
        db.session.commit()
        return jsonify({'success': True, 'message': 'Project completed'})
    
    return jsonify({'error': 'Project must be in progress to complete'}), 400

# Document Routes
@app.route('/api/volunteers/documents/', methods=['GET'])
@login_required
def get_documents():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401
    
    if user.role == 'volunteer':
        # Get user's team memberships
        user_teams = TeamMember.query.filter_by(user_id=user.id).all()
        user_team_ids = [tm.team_id for tm in user_teams]
        
        # Get all documents
        all_documents = Document.query.all()
        documents = []
        
        for doc in all_documents:
            # Include document if:
            # 1. User uploaded it
            # 2. Document is admin-uploaded with no team restrictions (global access from admin)
            # 3. Document is shared with user's teams
            # 4. Document is uploaded by team member (if user is in same team)
            
            doc_uploader = User.query.get(doc.uploaded_by_id)
            
            if doc.uploaded_by_id == user.id:
                # User's own documents
                documents.append(doc)
            elif doc_uploader and doc_uploader.role == 'admin':
                # Admin documents
                if len(doc.team_access) == 0:
                    # Global admin document (no specific team restrictions)
                    documents.append(doc)
                elif any(access.team_id in user_team_ids for access in doc.team_access):
                    # Admin document shared with user's teams
                    documents.append(doc)
            elif doc_uploader and doc_uploader.role == 'volunteer' and user_team_ids:
                # Volunteer documents - only visible to team members
                uploader_teams = TeamMember.query.filter_by(user_id=doc.uploaded_by_id).all()
                uploader_team_ids = [tm.team_id for tm in uploader_teams]
                
                # Check if uploader and current user share any teams
                if any(team_id in user_team_ids for team_id in uploader_team_ids):
                    documents.append(doc)
        
        # Sort by creation date
        documents.sort(key=lambda x: x.created_at, reverse=True)
    else:
        # Admins see all documents
        documents = Document.query.order_by(Document.created_at.desc()).all()
    
    doc_list = []
    for doc in documents:
        # Get team access info for display
        team_access = []
        if doc.team_access:
            for access in doc.team_access:
                team = Team.query.get(access.team_id)
                if team:
                    team_access.append({
                        'team_id': team.id,
                        'team_name': team.name
                    })
        
        doc_data = {
            'id': doc.id,
            'title': doc.title,
            'document_type': doc.document_type,
            'drive_link': doc.drive_link,
            'uploaded_by': doc.uploaded_by_user.username,
            'uploaded_by_details': {
                'full_name': doc.uploaded_by_user.full_name,
                'college_name': doc.uploaded_by_user.college_name,
                'course': doc.uploaded_by_user.course
            },
            'created_at': doc.created_at.isoformat(),
            'team_access': team_access,
            'is_global': len(team_access) == 0  # No team restrictions = global access
        }
        
        doc_list.append(doc_data)
    
    return jsonify({'documents': doc_list})

@app.route('/api/volunteers/documents/upload/', methods=['POST'])
@login_required
def upload_document():
    data = request.get_json()
    
    title = data.get('title')
    document_type = data.get('document_type', 'submission')
    drive_link = data.get('drive_link')
    project_id = data.get('project_id')
    team_ids = data.get('team_ids', [])  # List of team IDs for team-specific sharing
    
    if not title or not drive_link:
        return jsonify({'error': 'Title and Google Drive link are required'}), 400
    
    # Validate Google Drive link format
    if 'drive.google.com' not in drive_link and 'docs.google.com' not in drive_link:
        return jsonify({'error': 'Please provide a valid Google Drive link'}), 400
    
    # Validate team IDs if provided (admin only feature)
    user = User.query.get(session['user_id'])
    if team_ids and user.role == 'admin':
        # Validate that all team IDs exist
        valid_teams = Team.query.filter(Team.id.in_(team_ids)).all()
        if len(valid_teams) != len(team_ids):
            return jsonify({'error': 'One or more invalid team IDs provided'}), 400
    elif team_ids and user.role != 'admin':
        return jsonify({'error': 'Only admins can share documents with specific teams'}), 403
    
    try:
        document = Document(
            title=title,
            document_type=document_type,
            drive_link=drive_link,
            uploaded_by_id=session['user_id'],
            project_id=project_id
        )
        
        db.session.add(document)
        db.session.flush()  # Get document ID
        
        # Create team access records if team IDs provided
        if team_ids and user.role == 'admin':
            for team_id in team_ids:
                team_access = DocumentTeamAccess(
                    document_id=document.id,
                    team_id=team_id
                )
                db.session.add(team_access)
        
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'document_id': document.id,
            'team_access': len(team_ids) if team_ids else 0
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to upload document. Please try again.'}), 500

@app.route('/api/volunteers/documents/<int:document_id>/delete/', methods=['DELETE'])
@login_required
def delete_document(document_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401
    
    document = Document.query.get_or_404(document_id)
    
    # Check if user can delete this document
    # Users can delete their own documents, admins can delete any document
    if document.uploaded_by_id != user.id and user.role != 'admin':
        return jsonify({'error': 'You can only delete your own documents'}), 403
    
    try:
        # Store document info for response
        document_title = document.title
        
        # Delete team access records first (cascade should handle this, but being explicit)
        DocumentTeamAccess.query.filter_by(document_id=document_id).delete()
        
        # Delete the document
        db.session.delete(document)
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': f'Document "{document_title}" deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete document. Please try again.'}), 500

# Team-Organized Admin Management Routes
@app.route('/api/admin/teams/<int:team_id>/pending-approvals/', methods=['GET'])
@admin_required
def get_team_pending_approvals(team_id):
    """Get pending work log approvals for a specific team"""
    team = Team.query.get_or_404(team_id)
    
    # Get team members
    team_members = TeamMember.query.filter_by(team_id=team_id).all()
    member_ids = [member.user_id for member in team_members]
    
    if not member_ids:
        return jsonify({'work_logs': [], 'team_name': team.name})
    
    # Get pending work logs from team members
    pending_logs = WorkLog.query.filter(
        WorkLog.volunteer_id.in_(member_ids),
        WorkLog.status == 'pending'
    ).order_by(WorkLog.date.desc()).all()
    
    work_logs = []
    for log in pending_logs:
        work_logs.append({
            'id': log.id,
            'date': log.date.isoformat(),
            'hours_worked': log.hours_worked,
            'description': log.description,
            'status': log.status,
            'volunteer': log.volunteer.username,
            'volunteer_details': {
                'full_name': log.volunteer.full_name,
                'college_name': log.volunteer.college_name,
                'course': log.volunteer.course,
                'year_of_study': log.volunteer.year_of_study,
                'phone': log.volunteer.phone,
                'email': log.volunteer.email
            }
        })
    
    return jsonify({
        'work_logs': work_logs,
        'team_name': team.name,
        'team_id': team_id,
        'pending_count': len(work_logs)
    })

@app.route('/api/admin/teams/<int:team_id>/work-logs/', methods=['GET'])
@admin_required
def get_team_all_work_logs(team_id):
    """Get all work logs for a specific team"""
    team = Team.query.get_or_404(team_id)
    
    # Get team members
    team_members = TeamMember.query.filter_by(team_id=team_id).all()
    member_ids = [member.user_id for member in team_members]
    
    if not member_ids:
        return jsonify({'work_logs': [], 'team_name': team.name})
    
    # Get all work logs from team members
    all_logs = WorkLog.query.filter(
        WorkLog.volunteer_id.in_(member_ids)
    ).order_by(WorkLog.date.desc()).all()
    
    work_logs = []
    for log in all_logs:
        work_logs.append({
            'id': log.id,
            'date': log.date.isoformat(),
            'hours_worked': log.hours_worked,
            'description': log.description,
            'status': log.status,
            'volunteer': log.volunteer.username,
            'volunteer_details': {
                'full_name': log.volunteer.full_name,
                'college_name': log.volunteer.college_name,
                'course': log.volunteer.course,
                'year_of_study': log.volunteer.year_of_study,
                'phone': log.volunteer.phone,
                'email': log.volunteer.email
            }
        })
    
    # Debug info
    total_work_logs = WorkLog.query.count()
    
    return jsonify({
        'work_logs': work_logs,
        'team_name': team.name,
        'team_id': team_id,
        'total_count': len(work_logs),
        'member_count': len(member_ids),
        'member_ids': member_ids,  # For debugging
        'debug': {
            'total_work_logs_in_db': total_work_logs,
            'team_member_usernames': [User.query.get(uid).username for uid in member_ids if User.query.get(uid)]
        }
    })

@app.route('/api/admin/teams/<int:team_id>/projects/', methods=['GET'])
@admin_required
def get_team_admin_projects(team_id):
    """Get projects for a specific team (admin view)"""
    team = Team.query.get_or_404(team_id)
    
    # Get team members
    team_members = TeamMember.query.filter_by(team_id=team_id).all()
    member_ids = [member.user_id for member in team_members]
    
    # Get projects that are either assigned to the team OR created by team members
    projects = Project.query.filter(
        (Project.team_id == team_id) | 
        (Project.volunteer_id.in_(member_ids))
    ).order_by(Project.created_at.desc()).all()
    
    project_list = []
    for project in projects:
        project_list.append({
            'id': project.id,
            'title': project.title,
            'description': project.description,
            'status': project.status,
            'volunteer': project.volunteer.username,
            'volunteer_details': {
                'full_name': project.volunteer.full_name,
                'college_name': project.volunteer.college_name,
                'course': project.volunteer.course
            },
            'created_at': project.created_at.isoformat(),
            'is_team_project': project.is_team_project,
            'start_date': project.start_date.isoformat() if project.start_date else None,
            'end_date': project.end_date.isoformat() if project.end_date else None
        })
    
    return jsonify({
        'projects': project_list,
        'team_name': team.name,
        'team_id': team_id
    })

@app.route('/api/admin/unassigned/work-logs/', methods=['GET'])
@admin_required
def get_unassigned_work_logs():
    """Get work logs from volunteers not in any team"""
    # Get all users who are not in any team
    assigned_user_ids = db.session.query(TeamMember.user_id).distinct().all()
    assigned_user_ids = [uid[0] for uid in assigned_user_ids]
    
    unassigned_users = User.query.filter(
        User.role == 'volunteer',
        ~User.id.in_(assigned_user_ids)
    ).all()
    
    unassigned_user_ids = [user.id for user in unassigned_users]
    
    if not unassigned_user_ids:
        return jsonify({'work_logs': [], 'volunteer_count': 0})
    
    # Get work logs from unassigned volunteers
    work_logs = WorkLog.query.filter(
        WorkLog.volunteer_id.in_(unassigned_user_ids)
    ).order_by(WorkLog.date.desc()).all()
    
    log_list = []
    for log in work_logs:
        log_list.append({
            'id': log.id,
            'date': log.date.isoformat(),
            'hours_worked': log.hours_worked,
            'description': log.description,
            'status': log.status,
            'volunteer': log.volunteer.username,
            'volunteer_details': {
                'full_name': log.volunteer.full_name,
                'college_name': log.volunteer.college_name,
                'course': log.volunteer.course,
                'year_of_study': log.volunteer.year_of_study,
                'phone': log.volunteer.phone,
                'email': log.volunteer.email
            }
        })
    
    return jsonify({
        'work_logs': log_list,
        'volunteer_count': len(unassigned_users),
        'pending_count': len([log for log in log_list if log['status'] == 'pending'])
    })

@app.route('/api/admin/check/', methods=['GET'])
@login_required
def check_admin_status():
    """Check if current user is admin"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'user_id': user.id,
        'username': user.username,
        'role': user.role,
        'is_admin': user.role == 'admin'
    })

@app.route('/api/admin/unassigned/projects/', methods=['GET'])
@admin_required
def get_unassigned_projects():
    """Get projects from volunteers not in any team"""
    # Get all users who are not in any team
    assigned_user_ids = db.session.query(TeamMember.user_id).distinct().all()
    assigned_user_ids = [uid[0] for uid in assigned_user_ids]
    
    unassigned_users = User.query.filter(
        User.role == 'volunteer',
        ~User.id.in_(assigned_user_ids)
    ).all()
    
    unassigned_user_ids = [user.id for user in unassigned_users]
    
    if not unassigned_user_ids:
        return jsonify({'projects': [], 'volunteer_count': 0})
    
    # Get projects from unassigned volunteers (excluding team projects)
    projects = Project.query.filter(
        Project.volunteer_id.in_(unassigned_user_ids),
        Project.team_id.is_(None)
    ).order_by(Project.created_at.desc()).all()
    
    project_list = []
    for project in projects:
        project_list.append({
            'id': project.id,
            'title': project.title,
            'description': project.description,
            'status': project.status,
            'volunteer': project.volunteer.username,
            'volunteer_details': {
                'full_name': project.volunteer.full_name,
                'college_name': project.volunteer.college_name,
                'course': project.volunteer.course
            },
            'created_at': project.created_at.isoformat(),
            'start_date': project.start_date.isoformat() if project.start_date else None,
            'end_date': project.end_date.isoformat() if project.end_date else None
        })
    
    return jsonify({
        'projects': project_list,
        'volunteer_count': len(unassigned_users),
        'pending_count': len([p for p in project_list if p['status'] == 'submitted'])
    })

@app.route('/api/admin/unassigned/volunteers/', methods=['GET'])
@admin_required
def get_unassigned_volunteers():
    """Get all volunteers not assigned to any team with their details"""
    # Get all users who are not in any team
    assigned_user_ids = db.session.query(TeamMember.user_id).distinct().all()
    assigned_user_ids = [uid[0] for uid in assigned_user_ids]
    
    unassigned_users = User.query.filter(
        User.role == 'volunteer',
        ~User.id.in_(assigned_user_ids)
    ).order_by(User.created_at.desc()).all()
    
    volunteer_list = []
    for user in unassigned_users:
        # Get user's work logs count and total hours
        work_logs = WorkLog.query.filter_by(volunteer_id=user.id).all()
        total_hours = sum(log.hours_worked for log in work_logs)
        pending_logs = len([log for log in work_logs if log.status == 'pending'])
        
        # Get user's projects count
        projects = Project.query.filter_by(volunteer_id=user.id, team_id=None).all()
        pending_projects = len([p for p in projects if p.status in ['submitted', 'pending']])
        
        volunteer_list.append({
            'id': user.id,
            'username': user.username,
            'full_name': user.full_name,
            'email': user.email,
            'college_name': user.college_name,
            'course': user.course,
            'year_of_study': user.year_of_study,
            'phone': user.phone,
            'created_at': user.created_at.isoformat(),
            'stats': {
                'total_hours': total_hours,
                'work_logs_count': len(work_logs),
                'pending_logs': pending_logs,
                'projects_count': len(projects),
                'pending_projects': pending_projects
            }
        })
    
    return jsonify({
        'volunteers': volunteer_list,
        'total_count': len(volunteer_list)
    })

@app.route('/api/admin/teams/<int:team_id>/batch-approve/', methods=['POST'])
@admin_required
def batch_approve_team_logs(team_id):
    """Batch approve work logs for a specific team"""
    data = request.get_json()
    log_ids = data.get('log_ids', [])
    action = data.get('action', 'approved')  # 'approved' or 'rejected'
    
    if not log_ids:
        return jsonify({'error': 'No work log IDs provided'}), 400
    
    if action not in ['approved', 'rejected']:
        return jsonify({'error': 'Invalid action'}), 400
    
    try:
        # Verify team exists
        team = Team.query.get_or_404(team_id)
        
        # Get team member IDs for validation
        team_members = TeamMember.query.filter_by(team_id=team_id).all()
        member_ids = [member.user_id for member in team_members]
        
        # Update work logs (only those belonging to team members)
        updated_logs = WorkLog.query.filter(
            WorkLog.id.in_(log_ids),
            WorkLog.volunteer_id.in_(member_ids),
            WorkLog.status == 'pending'
        ).all()
        
        if not updated_logs:
            return jsonify({'error': 'No valid pending work logs found for this team'}), 400
        
        for log in updated_logs:
            log.status = action
            log.approved_by_id = session['user_id']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'{len(updated_logs)} work logs {action} successfully',
            'updated_count': len(updated_logs)
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update work logs. Please try again.'}), 500

# Initialize database
def init_db():
    with app.app_context():
        db.create_all()
        
        # Create Akshar Paaul NGO admin account if it doesn't exist
        admin = User.query.filter_by(username='AksharPaaulNGO').first()
        if not admin:
            admin = User(
                username='AksharPaaulNGO',
                email='admin@aksharpaaul.org',
                password_hash=generate_password_hash('admin123'),
                role='admin',
                full_name='Akshar Paaul Administrator'
            )
            db.session.add(admin)
            print("Akshar Paaul NGO admin account created: AksharPaaulNGO/admin123")
        
        db.session.commit()

# Serve React App - MUST BE LAST
@app.route('/')
def serve():
    if app.static_folder and os.path.exists(os.path.join(app.static_folder, 'index.html')):
        return send_from_directory(app.static_folder, 'index.html')
    else:
        return jsonify({'message': 'API is running. Frontend not built yet.'}), 200

@app.route('/<path:path>')
def static_proxy(path):
    print(f"Static proxy called with path: {path}")
    print(f"Static folder: {app.static_folder}")
    
    # Skip API routes
    if path.startswith('api/'):
        return jsonify({'error': 'API endpoint not found'}), 404
    
    # Try to serve static file first
    if app.static_folder:
        try:
            file_path = os.path.join(app.static_folder, path)
            print(f"Checking file: {file_path}")
            if os.path.exists(file_path) and os.path.isfile(file_path):
                return send_from_directory(app.static_folder, path)
        except Exception as e:
            print(f"Error serving static file: {e}")
    
    # Fallback to index.html for React Router
    if app.static_folder:
        try:
            index_path = os.path.join(app.static_folder, 'index.html')
            print(f"Fallback to index.html: {index_path}")
            if os.path.exists(index_path):
                return send_from_directory(app.static_folder, 'index.html')
        except Exception as e:
            print(f"Error serving index.html: {e}")
    
    return jsonify({'error': 'Frontend not found', 'path': path, 'static_folder': app.static_folder}), 404

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    # If it's an API request, return JSON
    if request.path.startswith('/api/'):
        return jsonify({'error': 'API endpoint not found'}), 404
    
    # For all other requests, serve React app
    if app.static_folder:
        try:
            index_path = os.path.join(app.static_folder, 'index.html')
            if os.path.exists(index_path):
                return send_from_directory(app.static_folder, 'index.html')
        except:
            pass
    
    return jsonify({'error': 'Page not found'}), 404

# Initialize database when app starts (for production)
try:
    init_db()
    print("✅ Database initialized successfully")
except Exception as e:
    print(f"❌ Database initialization error: {e}")

if __name__ == '__main__':
    app.run(debug=True)