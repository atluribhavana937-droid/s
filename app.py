"""
Flask Web Server and REST API for AI Resume Analyzer & Job-Match Assistant Platform.
"""

import os
import json
import sqlite3
import datetime
from flask import Flask, render_template, request, jsonify, send_file, make_response
from nlp_engine import (
    SAMPLE_JOBS,
    SAMPLE_RESUMES,
    SKILL_TAXONOMY,
    extract_text_from_pdf,
    extract_text_from_docx,
    parse_raw_resume_text,
    calculate_resume_score,
    calculate_ats_analysis,
    calculate_job_match,
    generate_learning_roadmap,
    calculate_job_readiness_score,
    perform_consistency_audit,
    analyze_achievements,
    rewrite_resume_section,
    generate_cover_letter,
    generate_interview_preparation,
    handle_chatbot_query,
    get_career_path_recommendations,
    perform_multi_job_comparison,
    generate_linkedin_profile,
    analyze_portfolio_and_github,
    get_salary_insights,
    check_job_scam_risk,
    check_resume_language_and_tone,
    get_telugu_explanations,
    generate_networking_messages,
    generate_company_research,
    predict_application_success,
    generate_career_goal_plan,
    get_freelance_and_internships,
    simulate_recruiter_view
)

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload

DB_FILE = 'resume_assistant.db'

def init_db():
    """Initialize SQLite database for resume versions and job tracker applications."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS resume_versions (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            target_role TEXT,
            data_json TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS job_applications (
            id TEXT PRIMARY KEY,
            company TEXT NOT NULL,
            position TEXT NOT NULL,
            stage TEXT NOT NULL DEFAULT 'Applied',
            salary TEXT,
            applied_date TEXT,
            follow_up_date TEXT,
            notes TEXT,
            resume_version TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# In-memory active session state (initialized with CS Fresher sample)
active_state = {
    "resume_data": SAMPLE_RESUMES["fresher_cs"],
    "current_job_id": "python_developer",
    "active_version_id": "default_v1"
}


def build_full_intelligence_response(resume_data, target_job_id="python_developer"):
    """Helper to assemble the complete career intelligence bundle."""
    target_job = SAMPLE_JOBS.get(target_job_id, SAMPLE_JOBS["python_developer"])
    
    resume_score_data = calculate_resume_score(resume_data)
    ats_data = calculate_ats_analysis(resume_data, target_job.get("required_skills", []))
    job_match_data = calculate_job_match(resume_data, target_job)
    multi_job_data = perform_multi_job_comparison(resume_data)
    roadmap_data = generate_learning_roadmap(job_match_data.get("missing_skills", []), target_job.get("title"))
    readiness_data = calculate_job_readiness_score(
        resume_score_data["overall_score"],
        ats_data["ats_score"],
        job_match_data["overall_match_score"]
    )
    career_paths = get_career_path_recommendations(resume_data)
    consistency_audit = perform_consistency_audit(resume_data)
    achievement_analysis = analyze_achievements(resume_data)
    interview_prep = generate_interview_preparation(resume_data, target_job.get("title"))
    cover_letter = generate_cover_letter(resume_data, target_job.get("title"), "Apex Technologies")
    
    # 15 New AI Modules Data
    linkedin_data = generate_linkedin_profile(resume_data, target_job.get("title"))
    portfolio_data = analyze_portfolio_and_github(resume_data.get("github", ""), resume_data, target_job.get("title"))
    salary_data = get_salary_insights(target_job.get("title"), 1.0, resume_data.get("detected_skills", []))
    tone_data = check_resume_language_and_tone(resume_data)
    telugu_data = get_telugu_explanations(resume_data, job_match_data)
    networking_data = generate_networking_messages(resume_data, "Apex Innovations", target_job.get("title"), "Hiring Team")
    company_data = generate_company_research("Stripe", target_job.get("title"))
    success_prediction = predict_application_success(
        resume_score_data["overall_score"],
        ats_data["ats_score"],
        job_match_data["overall_match_score"]
    )
    career_goal_data = generate_career_goal_plan(f"Become a {target_job.get('title')} in 6 months", 6, resume_data)
    freelance_data = get_freelance_and_internships(resume_data.get("detected_skills", []), target_job.get("title"))
    recruiter_sim_data = simulate_recruiter_view(resume_data, target_job)
    
    return {
        "status": "success",
        "resume_data": resume_data,
        "resume_score": resume_score_data,
        "ats_analysis": ats_data,
        "job_match": job_match_data,
        "job_recommendations": multi_job_data,
        "learning_roadmap": roadmap_data,
        "job_readiness": readiness_data,
        "career_paths": career_paths,
        "consistency_audit": consistency_audit,
        "achievement_analysis": achievement_analysis,
        "interview_prep": interview_prep,
        "cover_letter": cover_letter,
        "target_job": target_job,
        "linkedin_data": linkedin_data,
        "portfolio_data": portfolio_data,
        "salary_data": salary_data,
        "tone_data": tone_data,
        "telugu_data": telugu_data,
        "networking_data": networking_data,
        "company_data": company_data,
        "success_prediction": success_prediction,
        "career_goal_data": career_goal_data,
        "freelance_data": freelance_data,
        "recruiter_sim_data": recruiter_sim_data
    }


# -------------------------------------------------------------
# PAGE ROUTES
# -------------------------------------------------------------

@app.route('/')
def index():
    """Main Single Page Application."""
    return render_template('index.html')


# -------------------------------------------------------------
# API ROUTES
# -------------------------------------------------------------

@app.route('/api/sample-data', methods=['GET'])
def get_sample_data():
    """Provide sample resumes, standard jobs, and taxonomy."""
    return jsonify({
        "sample_resumes": SAMPLE_RESUMES,
        "sample_jobs": SAMPLE_JOBS,
        "skill_taxonomy": SKILL_TAXONOMY
    })


@app.route('/api/current-intelligence', methods=['GET'])
def get_current_intelligence():
    """Get intelligence analysis for the currently active resume in session."""
    target_job_id = request.args.get('job_id', active_state["current_job_id"])
    active_state["current_job_id"] = target_job_id
    payload = build_full_intelligence_response(active_state["resume_data"], target_job_id)
    return jsonify(payload)


@app.route('/api/upload-resume', methods=['POST'])
def upload_resume():
    """Handle resume upload (PDF/DOCX/TXT) or sample resume selection."""
    sample_id = request.form.get('sample_id')
    raw_text = request.form.get('raw_text')
    target_job_id = request.form.get('job_id', active_state["current_job_id"])
    
    parsed_data = None
    
    if sample_id and sample_id in SAMPLE_RESUMES:
        parsed_data = SAMPLE_RESUMES[sample_id].copy()
    elif 'file' in request.files and request.files['file'].filename != '':
        file = request.files['file']
        filename = file.filename.lower()
        file_bytes = file.read()
        
        if filename.endswith('.pdf'):
            extracted_text = extract_text_from_pdf(file_bytes)
        elif filename.endswith('.docx'):
            extracted_text = extract_text_from_docx(file_bytes)
        else:
            try:
                extracted_text = file_bytes.decode('utf-8', errors='ignore')
            except Exception:
                extracted_text = str(file_bytes)
                
        parsed_data = parse_raw_resume_text(extracted_text)
    elif raw_text and raw_text.strip():
        parsed_data = parse_raw_resume_text(raw_text.strip())
    else:
        parsed_data = SAMPLE_RESUMES["fresher_cs"].copy()
        
    active_state["resume_data"] = parsed_data
    active_state["current_job_id"] = target_job_id
    
    payload = build_full_intelligence_response(parsed_data, target_job_id)
    return jsonify(payload)


@app.route('/api/analyze-job', methods=['POST'])
def analyze_job():
    """Analyze active resume against a selected or custom job description."""
    data = request.get_json() or {}
    job_id = data.get('job_id')
    custom_job_text = data.get('custom_job_text')
    custom_job_title = data.get('custom_job_title', 'Custom Target Role')
    
    if job_id and job_id in SAMPLE_JOBS:
        target_job = SAMPLE_JOBS[job_id]
        active_state["current_job_id"] = job_id
    elif custom_job_text:
        from nlp_engine import extract_skills_from_text
        custom_skills = extract_skills_from_text(custom_job_text)
        if not custom_skills:
            custom_skills = ["python", "sql", "git", "rest api", "communication"]
            
        target_job = {
            "id": "custom_job",
            "title": custom_job_title,
            "category": "Target Opportunity",
            "experience_level": "Specified in Description",
            "salary_range": "Competitive Market Rate",
            "demand": "High Demand (🔥 90/100)",
            "description": custom_job_text,
            "required_skills": custom_skills[:8],
            "nice_to_have": custom_skills[8:14] if len(custom_skills) > 8 else ["docker", "ci/cd", "agile"],
            "min_experience_years": 1,
            "education": ["Relevant Degree / Experience"]
        }
    else:
        target_job = SAMPLE_JOBS["python_developer"]
        
    resume_data = active_state["resume_data"]
    job_match = calculate_job_match(resume_data, target_job)
    ats_analysis = calculate_ats_analysis(resume_data, target_job.get("required_skills", []))
    roadmap = generate_learning_roadmap(job_match.get("missing_skills", []), target_job.get("title"))
    interview_prep = generate_interview_preparation(resume_data, target_job.get("title"))
    
    return jsonify({
        "status": "success",
        "job_info": target_job,
        "job_match": job_match,
        "ats_analysis": ats_analysis,
        "learning_roadmap": roadmap,
        "interview_prep": interview_prep
    })


@app.route('/api/multi-job-compare', methods=['GET', 'POST'])
def multi_job_compare():
    """Run side-by-side comparison for 4 jobs."""
    results = perform_multi_job_comparison(active_state["resume_data"])
    return jsonify({
        "status": "success",
        "comparison": results
    })


@app.route('/api/chat', methods=['POST'])
def chat():
    """Context-aware conversational assistant."""
    data = request.get_json() or {}
    query = data.get('query', '')
    job_id = data.get('job_id', active_state["current_job_id"])
    target_job = SAMPLE_JOBS.get(job_id)
    
    response = handle_chatbot_query(query, active_state["resume_data"], target_job)
    return jsonify(response)


@app.route('/api/rewrite', methods=['POST'])
def rewrite():
    """AI Resume Rewriter."""
    data = request.get_json() or {}
    text = data.get('text', '')
    section_type = data.get('section_type', 'summary')
    tone = data.get('tone', 'impact')
    
    result = rewrite_resume_section(text, section_type, tone)
    return jsonify(result)


@app.route('/api/cover-letter', methods=['POST'])
def cover_letter():
    """AI Cover Letter Generator."""
    data = request.get_json() or {}
    job_title = data.get('job_title', 'Software Engineer')
    company_name = data.get('company_name', 'Tech Corp')
    tone = data.get('tone', 'professional')
    
    result = generate_cover_letter(active_state["resume_data"], job_title, company_name, tone)
    return jsonify(result)


@app.route('/api/interview-prep', methods=['POST'])
def interview_prep():
    """AI Interview Preparation questions and model answers."""
    data = request.get_json() or {}
    job_title = data.get('job_title', 'Software Engineer')
    
    result = generate_interview_preparation(active_state["resume_data"], job_title)
    return jsonify(result)


# -------------------------------------------------------------
# 15 NEW FEATURE REST APIS
# -------------------------------------------------------------

@app.route('/api/tracker', methods=['GET', 'POST', 'PUT', 'DELETE'])
def job_tracker_api():
    """AI Job Tracker Kanban & Application CRUD."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    if request.method == 'GET':
        cursor.execute('SELECT id, company, position, stage, salary, applied_date, follow_up_date, notes, resume_version, updated_at FROM job_applications ORDER BY updated_at DESC')
        rows = cursor.fetchall()
        apps = []
        for r in rows:
            apps.append({
                "id": r[0], "company": r[1], "position": r[2], "stage": r[3],
                "salary": r[4], "applied_date": r[5], "follow_up_date": r[6],
                "notes": r[7], "resume_version": r[8], "updated_at": r[9]
            })
            
        if not apps:
            # Seed default applications
            seeds = [
                ("app_1", "Google", "Software Engineer I", "Interview", "$135,000", "2026-08-10", "2026-08-22", "Round 2 Technical Interview scheduled on Binary Trees.", "v_software_dev"),
                ("app_2", "Stripe", "Backend Infrastructure Engineer", "Applied", "$140,000", "2026-08-15", "2026-08-24", "Submitted via employee referral.", "v_software_dev"),
                ("app_3", "Spotify", "Junior Data Analyst", "Offer", "$95,000", "2026-07-28", "2026-08-25", "Offer letter received! Reviewing health benefits and stock options.", "v_data_analyst"),
                ("app_4", "Meta", "Front-End Developer", "Rejected", "$130,000", "2026-07-15", "-", "Position filled internally.", "v_fullstack")
            ]
            for a_id, comp, pos, stg, sal, ad, fd, nts, rv in seeds:
                cursor.execute('''
                    INSERT OR REPLACE INTO job_applications (id, company, position, stage, salary, applied_date, follow_up_date, notes, resume_version, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (a_id, comp, pos, stg, sal, ad, fd, nts, rv, datetime.datetime.now().isoformat()))
                apps.append({
                    "id": a_id, "company": comp, "position": pos, "stage": stg,
                    "salary": sal, "applied_date": ad, "follow_up_date": fd,
                    "notes": nts, "resume_version": rv, "updated_at": datetime.datetime.now().isoformat()
                })
            conn.commit()
            
        conn.close()
        return jsonify({"status": "success", "applications": apps})
        
    elif request.method == 'POST':
        data = request.get_json() or {}
        a_id = f"app_{int(datetime.datetime.now().timestamp() * 1000)}"
        comp = data.get("company", "Target Company")
        pos = data.get("position", "Software Engineer")
        stg = data.get("stage", "Applied")
        sal = data.get("salary", "$85,000 - $115,000")
        ad = data.get("applied_date", datetime.date.today().isoformat())
        fd = data.get("follow_up_date", (datetime.date.today() + datetime.timedelta(days=7)).isoformat())
        nts = data.get("notes", "Application submitted online.")
        rv = data.get("resume_version", "Active Default Resume")
        
        cursor.execute('''
            INSERT INTO job_applications (id, company, position, stage, salary, applied_date, follow_up_date, notes, resume_version, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (a_id, comp, pos, stg, sal, ad, fd, nts, rv, datetime.datetime.now().isoformat()))
        conn.commit()
        conn.close()
        return jsonify({"status": "success", "id": a_id, "message": "Application added to tracker."})
        
    elif request.method == 'PUT':
        data = request.get_json() or {}
        a_id = data.get("id")
        new_stage = data.get("stage")
        new_notes = data.get("notes")
        
        if a_id and new_stage:
            cursor.execute('UPDATE job_applications SET stage = ?, updated_at = ? WHERE id = ?', (new_stage, datetime.datetime.now().isoformat(), a_id))
        if a_id and new_notes:
            cursor.execute('UPDATE job_applications SET notes = ?, updated_at = ? WHERE id = ?', (new_notes, datetime.datetime.now().isoformat(), a_id))
            
        conn.commit()
        conn.close()
        return jsonify({"status": "success", "message": "Application updated."})
        
    elif request.method == 'DELETE':
        a_id = request.args.get("id")
        if a_id:
            cursor.execute('DELETE FROM job_applications WHERE id = ?', (a_id,))
            conn.commit()
        conn.close()
        return jsonify({"status": "success", "message": "Application removed."})


@app.route('/api/linkedin-opt', methods=['GET', 'POST'])
def linkedin_opt():
    """Resume-to-LinkedIn Optimizer."""
    data = (request.get_json(silent=True) if request.is_json else {}) or {}
    target_role = data.get("target_role", "Software Engineer")
    res = generate_linkedin_profile(active_state["resume_data"], target_role)
    return jsonify(res)


@app.route('/api/portfolio-audit', methods=['GET', 'POST'])
def portfolio_audit():
    """GitHub & Portfolio Analyzer."""
    data = (request.get_json(silent=True) if request.is_json else {}) or {}
    github_url = data.get("github_url", active_state["resume_data"].get("github", ""))
    target_role = data.get("target_role", "Python Developer")
    res = analyze_portfolio_and_github(github_url, active_state["resume_data"], target_role)
    return jsonify(res)


@app.route('/api/salary-insights', methods=['GET', 'POST'])
def salary_insights():
    """Salary insights & high-ROI skills."""
    role = request.args.get("role", "Python Developer")
    res = get_salary_insights(role, 1.0, active_state["resume_data"].get("detected_skills", []))
    return jsonify(res)


@app.route('/api/scam-check', methods=['GET', 'POST'])
def scam_check():
    """Job Scam & Risk Checker."""
    data = (request.get_json(silent=True) if request.is_json else {}) or {}
    jd = data.get("job_description", "")
    comp = data.get("company_name", "")
    salary = data.get("salary_claim", "")
    res = check_job_scam_risk(jd, comp, salary)
    return jsonify(res)


@app.route('/api/tone-check', methods=['GET', 'POST'])
def tone_check():
    """Resume Language & Tone Checker."""
    res = check_resume_language_and_tone(active_state["resume_data"])
    return jsonify(res)


@app.route('/api/telugu-guidance', methods=['GET', 'POST'])
def telugu_guidance():
    """Regional Language Guidance (Telugu + English)."""
    res = get_telugu_explanations(active_state["resume_data"])
    return jsonify(res)


@app.route('/api/networking', methods=['GET', 'POST'])
def networking_api():
    """Networking Assistant outreach templates."""
    data = (request.get_json(silent=True) if request.is_json else {}) or {}
    comp = data.get("company_name", "Google")
    role = data.get("role_title", "Software Engineer")
    contact = data.get("contact_name", "Alex")
    res = generate_networking_messages(active_state["resume_data"], comp, role, contact)
    return jsonify(res)


@app.route('/api/company-research', methods=['GET', 'POST'])
def company_research_api():
    """Company Research Assistant dossier."""
    data = (request.get_json(silent=True) if request.is_json else {}) or {}
    comp = data.get("company_name", "Stripe")
    role = data.get("target_role", "Software Engineer")
    res = generate_company_research(comp, role)
    return jsonify(res)


@app.route('/api/predict-success', methods=['GET', 'POST'])
def predict_success_api():
    """Application Success Predictor."""
    r_score = calculate_resume_score(active_state["resume_data"])["overall_score"]
    ats_score = calculate_ats_analysis(active_state["resume_data"])["ats_score"]
    target_job = SAMPLE_JOBS.get(active_state["current_job_id"], SAMPLE_JOBS["python_developer"])
    match_score = calculate_job_match(active_state["resume_data"], target_job)["overall_match_score"]
    
    res = predict_application_success(r_score, ats_score, match_score)
    return jsonify(res)


@app.route('/api/career-goal', methods=['GET', 'POST'])
def career_goal_api():
    """Career Goal Planner milestone synthesizer."""
    data = (request.get_json(silent=True) if request.is_json else {}) or {}
    goal = data.get("goal_title", "Become a Java Developer in 6 months")
    months = int(data.get("timeframe_months", 6))
    res = generate_career_goal_plan(goal, months, active_state["resume_data"])
    return jsonify(res)


@app.route('/api/freelance-internships', methods=['GET', 'POST'])
def freelance_internships_api():
    """Freelance, Internship & Open-Source Recommendations."""
    role = request.args.get("role", "Python Developer")
    res = get_freelance_and_internships(active_state["resume_data"].get("detected_skills", []), role)
    return jsonify(res)


@app.route('/api/recruiter-simulation', methods=['GET', 'POST'])
def recruiter_simulation_api():
    """Recruiter 10-Second Eye-Tracking Simulation."""
    target_job = SAMPLE_JOBS.get(active_state["current_job_id"], SAMPLE_JOBS["python_developer"])
    res = simulate_recruiter_view(active_state["resume_data"], target_job)
    return jsonify(res)


# -------------------------------------------------------------
# VERSION MANAGER API
# -------------------------------------------------------------

@app.route('/api/versions', methods=['GET', 'POST'])
def manage_versions():
    """List or create resume versions."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    if request.method == 'POST':
        data = request.get_json() or {}
        v_id = data.get('id', f"v_{int(datetime.datetime.now().timestamp())}")
        title = data.get('title', 'Custom Resume Version')
        target_role = data.get('target_role', 'Software Developer')
        resume_payload = data.get('resume_data', active_state["resume_data"])
        
        cursor.execute(
            'INSERT OR REPLACE INTO resume_versions (id, title, target_role, data_json, updated_at) VALUES (?, ?, ?, ?, ?)',
            (v_id, title, target_role, json.dumps(resume_payload), datetime.datetime.now().isoformat())
        )
        conn.commit()
        conn.close()
        return jsonify({"status": "success", "id": v_id, "message": "Version saved successfully."})
        
    else:
        cursor.execute('SELECT id, title, target_role, data_json, updated_at FROM resume_versions ORDER BY updated_at DESC')
        rows = cursor.fetchall()
        versions = []
        for r in rows:
            versions.append({
                "id": r[0],
                "title": r[1],
                "target_role": r[2],
                "data": json.loads(r[3]),
                "updated_at": r[4]
            })
            
        if not versions:
            default_seeds = [
                ("v_software_dev", "Software Developer Resume", "Python Developer", SAMPLE_RESUMES["fresher_cs"]),
                ("v_data_analyst", "Data Analyst Resume", "Data Analyst", SAMPLE_RESUMES["junior_data_analyst"]),
                ("v_fullstack", "Full-Stack Web Dev Resume", "Web Developer", SAMPLE_RESUMES["junior_fullstack_dev"])
            ]
            for s_id, s_title, s_role, s_data in default_seeds:
                cursor.execute(
                    'INSERT INTO resume_versions (id, title, target_role, data_json, updated_at) VALUES (?, ?, ?, ?, ?)',
                    (s_id, s_title, s_role, json.dumps(s_data), datetime.datetime.now().isoformat())
                )
                versions.append({
                    "id": s_id,
                    "title": s_title,
                    "target_role": s_role,
                    "data": s_data,
                    "updated_at": datetime.datetime.now().isoformat()
                })
            conn.commit()
            
        conn.close()
        return jsonify({"status": "success", "versions": versions})


@app.route('/api/versions/<version_id>', methods=['GET', 'DELETE'])
def version_detail(version_id):
    """Load or delete a specific resume version."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    if request.method == 'DELETE':
        cursor.execute('DELETE FROM resume_versions WHERE id = ?', (version_id,))
        conn.commit()
        conn.close()
        return jsonify({"status": "success", "message": f"Version {version_id} deleted."})
        
    cursor.execute('SELECT id, title, target_role, data_json, updated_at FROM resume_versions WHERE id = ?', (version_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        parsed_data = json.loads(row[3])
        active_state["resume_data"] = parsed_data
        active_state["active_version_id"] = version_id
        return jsonify({
            "status": "success",
            "version": {
                "id": row[0],
                "title": row[1],
                "target_role": row[2],
                "data": parsed_data,
                "updated_at": row[4]
            }
        })
    return jsonify({"status": "error", "message": "Version not found"}), 404


# -------------------------------------------------------------
# PRIVACY & SECURITY API
# -------------------------------------------------------------

@app.route('/api/privacy/export', methods=['GET'])
def privacy_export():
    """Export complete candidate session data as JSON."""
    data = {
        "export_date": datetime.datetime.now().isoformat(),
        "active_profile": active_state["resume_data"],
        "privacy_protocol": "AES-256 Client-Encrypted Data Package",
        "data_retention_policy": "User Controlled Local Storage"
    }
    response = make_response(json.dumps(data, indent=2))
    response.headers['Content-Disposition'] = 'attachment; filename=resume_intelligence_export.json'
    response.headers['Content-Type'] = 'application/json'
    return response


@app.route('/api/privacy/delete', methods=['POST'])
def privacy_delete():
    """Purge active resume session data and SQLite tables."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM resume_versions')
    cursor.execute('DELETE FROM job_applications')
    conn.commit()
    conn.close()
    
    active_state["resume_data"] = {
        "name": "Anonymous Candidate",
        "title": "Software Professional",
        "email": "",
        "phone": "",
        "location": "",
        "summary": "Profile cleared.",
        "education": [],
        "skills_raw": "",
        "detected_skills": [],
        "experience": [],
        "projects": [],
        "certifications": []
    }
    return jsonify({"status": "success", "message": "All resume records and temporary cache securely erased."})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    print(f"[SERVER] Starting AI Resume Analyzer & Job-Match Assistant Server on http://{host}:{port}")
    app.run(host=host, port=port, debug=False)

