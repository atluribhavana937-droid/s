/**
 * ResuMatch AI - Client Controller
 * Single Page Application Router, Chart.js Integrations, Voice Speech API,
 * Job Tracker CRM, and 15 Advanced Career Intelligence Modules.
 */

// Application State
const appState = {
  activeView: 'view-home',
  currentIntelligence: null,
  radarChartInstance: null,
  activeSample: 'fresher_cs',
  activeTemplateTheme: 'theme-fresher',
  voiceCurrentQIndex: 0,
  voiceQuestions: [],
  speechRecognitionInstance: null,
  isRecordingVoice: false,
  languageMode: 'en' // 'en' or 'te'
};

// ============================================================================
// 1. SPA ROUTER & NAVIGATION
// ============================================================================

const appRouter = {
  init() {
    // Attach sidebar link handlers
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const viewId = item.getAttribute('data-view');
        if (viewId) {
          this.navigate(viewId);
        }
      });
    });

    // Mobile menu toggle
    const mobileBtn = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('appSidebar');
    if (mobileBtn && sidebar) {
      mobileBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }
  },

  navigate(viewId) {
    const targetPanel = document.getElementById(viewId);
    if (!targetPanel) return;

    // Update active view panels
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    targetPanel.classList.add('active');
    appState.activeView = viewId;

    // Update sidebar active item
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-view') === viewId) {
        item.classList.add('active');
      }
    });

    // Update Topbar Breadcrumb
    const topbarText = document.getElementById('topbarCurrentView');
    const activeNav = document.querySelector(`.sidebar-nav .nav-item[data-view="${viewId}"] span`);
    if (topbarText && activeNav) {
      topbarText.textContent = activeNav.textContent;
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Close mobile sidebar if open
    const sidebar = document.getElementById('appSidebar');
    if (sidebar) sidebar.classList.remove('open');

    // Trigger view-specific renderers
    if (viewId === 'view-templates') {
      renderLiveResumePreview(appState.activeTemplateTheme);
    } else if (viewId === 'view-tracker') {
      fetchJobApplications();
    }
  }
};

// ============================================================================
// 2. DATA LOADERS & API SYNC
// ============================================================================

async function fetchCurrentIntelligence(jobId = 'python_developer') {
  try {
    const res = await fetch(`/api/current-intelligence?job_id=${encodeURIComponent(jobId)}`);
    const data = await res.json();
    if (data.status === 'success') {
      appState.currentIntelligence = data;
      renderAllViews(data);
    }
  } catch (err) {
    console.error('[ResuMatch API] Error loading intelligence:', err);
  }
}

function renderAllViews(data) {
  if (!data) return;

  const resume = data.resume_data || {};
  const score = data.resume_score || {};
  const ats = data.ats_analysis || {};
  const jobMatch = data.job_match || {};
  const readiness = data.job_readiness || {};
  const targetJob = data.target_job || {};

  // 1. Update Profile & Sidebar State
  document.getElementById('sidebarCandidateName').textContent = resume.name || 'Candidate';
  document.getElementById('sidebarAvatar').textContent = (resume.name || 'C').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  document.getElementById('sidebarResumeScoreBadge').textContent = `${score.overall_score || 92}%`;
  document.getElementById('sidebarAtsScoreBadge').textContent = `${ats.ats_score || 88}/100`;

  // 2. Home Page Stats
  document.getElementById('heroResumeScore').textContent = `${score.overall_score || 92}%`;
  document.getElementById('heroAtsScore').textContent = `${ats.ats_score || 88}/100`;
  document.getElementById('heroJobMatchScore').textContent = `${jobMatch.overall_match_score || 90}%`;
  document.getElementById('heroSkillsCount').textContent = `${(resume.detected_skills || []).length}+`;

  // 3. Dashboard KPI Gauges
  document.getElementById('dashboardResumeScore').textContent = `${score.overall_score || 92}%`;
  updateSvgRing('dashboardResumeRing', score.overall_score || 92);

  document.getElementById('dashboardAtsScore').textContent = `${ats.ats_score || 88}`;
  updateSvgRing('dashboardAtsRing', ats.ats_score || 88);

  document.getElementById('dashboardJobMatchScore').textContent = `${jobMatch.overall_match_score || 90}%`;
  updateSvgRing('dashboardJobMatchRing', jobMatch.overall_match_score || 90);
  document.getElementById('dashboardTargetJobTitle').textContent = targetJob.title || 'Python Dev';

  document.getElementById('dashboardReadinessScore').textContent = `${readiness.overall_readiness || 85}`;
  updateSvgRing('dashboardReadinessRing', readiness.overall_readiness || 85);

  // 4. Skills Taxonomy Badges
  renderCategorizedSkills(resume.detected_skills || []);

  // 5. Experience Timeline & Projects
  renderExperienceAndProjects(resume);

  // 6. Strengths & Improvements
  renderStrengthsAndImprovements(score);

  // 7. Radar Chart
  renderCompetencyRadarChart(score.pillar_scores || {});

  // 8. ATS & Keywords Page
  renderAtsDetails(ats);

  // 9. Job Match Page
  renderJobMatchDetails(jobMatch, targetJob);

  // 10. Multi-Job Comparison
  renderMultiJobMatrix(data.job_recommendations || []);

  // 11. Role Recommendations
  renderRoleRecommendations(data.job_recommendations || []);

  // 12. Roadmap & Gaps
  renderRoadmapAndGaps(jobMatch, data.learning_roadmap || []);

  // 13. Career Path
  renderCareerPath(data.career_paths || []);

  // 14. Interview Prep
  appState.voiceQuestions = (data.interview_prep || {}).questions || [];
  renderInterviewStudio(data.interview_prep || {});
  setupVoiceMockInterview();

  // 15. Consistency & Achievements
  renderConsistencyAndAchievements(data.consistency_audit || [], data.achievement_analysis || []);

  // 16. Printable Report
  renderPrintableReport(data);

  // 17. 15 NEW AI MODULES
  renderLinkedInOptimizer(data.linkedin_data || {});
  renderPortfolioAnalysis(data.portfolio_data || {});
  renderSalaryInsights(data.salary_data || {});
  renderToneCheck(data.tone_data || {});
  renderTeluguGuidance(data.telugu_data || {});
  renderNetworkingTemplates(data.networking_data || {});
  renderCompanyResearch(data.company_data || {});
  renderSuccessPredictor(data.success_prediction || {});
  renderCareerGoalPlan(data.career_goal_data || {});
  renderFreelanceInternships(data.freelance_data || {});
  renderRecruiterView(data.recruiter_sim_data || {});
  renderLiveResumePreview(appState.activeTemplateTheme);
}

function updateSvgRing(elementId, score) {
  const ring = document.getElementById(elementId);
  if (!ring) return;
  const radius = 36;
  const circumference = 2 * Math.PI * radius; // ~226.2
  const offset = circumference - (score / 100) * circumference;
  ring.style.strokeDasharray = `${circumference}`;
  ring.style.strokeDashoffset = `${offset}`;
}

// ============================================================================
// 3. RENDERERS FOR CORE VIEWS
// ============================================================================

function renderCategorizedSkills(detectedSkills) {
  const container = document.getElementById('categorizedSkillsWrap');
  const countBadge = document.getElementById('detectedSkillsCountBadge');
  if (!container) return;

  if (countBadge) {
    countBadge.textContent = `${detectedSkills.length} Skills Identified`;
  }

  container.innerHTML = `
    <div class="skill-badges-wrap">
      ${detectedSkills.map(s => `<span class="skill-badge"><i class="fa-solid fa-check" style="color: var(--accent-emerald); font-size: 0.7rem;"></i> ${s.charAt(0).toUpperCase() + s.slice(1)}</span>`).join('')}
    </div>
  `;
}

function renderExperienceAndProjects(resume) {
  const expContainer = document.getElementById('dashboardExperienceTimeline');
  const projContainer = document.getElementById('dashboardProjectsList');

  if (expContainer) {
    const exp = resume.experience || [];
    if (exp.length === 0) {
      expContainer.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem;">No commercial experience listed yet (Academic Projects Highlighted).</div>`;
    } else {
      expContainer.innerHTML = exp.map(e => `
        <div class="timeline-item" style="border-left: 2px solid var(--primary); padding-left: 1rem; margin-bottom: 1.25rem;">
          <div style="font-weight: 700; font-size: 0.95rem;">${e.role || 'Role'} • <span style="color: var(--primary-light);">${e.company || 'Company'}</span></div>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.4rem;">${e.duration || 'Duration'} | ${e.location || 'Location'}</div>
          <ul style="padding-left: 1rem; font-size: 0.82rem; color: var(--text-secondary);">
            ${(e.bullets || []).map(b => `<li style="margin-bottom: 0.25rem;">${b}</li>`).join('')}
          </ul>
        </div>
      `).join('');
    }
  }

  if (projContainer) {
    const projs = resume.projects || [];
    projContainer.innerHTML = projs.map(p => `
      <div class="glass-card" style="margin-bottom: 0.85rem; padding: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
          <div style="font-weight: 700; font-size: 0.92rem;">${p.title || 'Project'}</div>
          <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: var(--primary-light);">${p.tech || 'Tech Stack'}</span>
        </div>
        <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4;">${p.description || ''}</p>
      </div>
    `).join('');
  }
}

function renderStrengthsAndImprovements(score) {
  const strList = document.getElementById('dashboardStrengthsList');
  const impList = document.getElementById('dashboardImprovementsList');

  if (strList) {
    strList.innerHTML = (score.strengths || []).map(s => `
      <div style="display: flex; gap: 0.6rem; margin-bottom: 0.6rem; font-size: 0.83rem; color: var(--text-secondary);">
        <i class="fa-solid fa-circle-check" style="color: var(--accent-emerald); margin-top: 3px;"></i>
        <span>${s}</span>
      </div>
    `).join('');
  }

  if (impList) {
    impList.innerHTML = (score.areas_for_improvement || []).map(i => `
      <div style="display: flex; gap: 0.6rem; margin-bottom: 0.6rem; font-size: 0.83rem; color: var(--text-secondary);">
        <i class="fa-solid fa-triangle-exclamation" style="color: var(--accent-amber); margin-top: 3px;"></i>
        <span>${i}</span>
      </div>
    `).join('');
  }
}

function renderCompetencyRadarChart(pillars) {
  const ctx = document.getElementById('competencyRadarChart');
  if (!ctx) return;

  const labels = Object.keys(pillars).length ? Object.keys(pillars) : ['Skills', 'Experience', 'Education', 'Projects', 'Impact', 'Formatting'];
  const values = Object.values(pillars).length ? Object.values(pillars) : [90, 85, 95, 88, 82, 94];

  if (appState.radarChartInstance) {
    appState.radarChartInstance.destroy();
  }

  appState.radarChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Candidate Competency',
        data: values,
        backgroundColor: 'rgba(99, 102, 241, 0.25)',
        borderColor: '#6366f1',
        pointBackgroundColor: '#818cf8',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 40,
          max: 100,
          ticks: { display: false },
          grid: { color: 'rgba(255, 255, 255, 0.08)' },
          pointLabels: { color: '#94a3b8', font: { size: 10, weight: 600 } }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function renderAtsDetails(ats) {
  document.getElementById('atsPageScore').textContent = `${ats.ats_score || 88}`;
  updateSvgRing('atsPageRing', ats.ats_score || 88);

  const checksList = document.getElementById('atsChecksList');
  if (checksList) {
    checksList.innerHTML = (ats.lint_checks || []).map(c => `
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.82rem; padding: 0.35rem 0; border-bottom: 1px solid var(--border-color);">
        <span>${c.label}</span>
        <span style="color: ${c.passed ? 'var(--accent-emerald)' : 'var(--accent-rose)'}; font-weight: 700;">
          <i class="fa-solid ${c.passed ? 'fa-check' : 'fa-xmark'}"></i> ${c.status}
        </span>
      </div>
    `).join('');
  }

  const matchKw = document.getElementById('atsMatchingKeywords');
  const missKw = document.getElementById('atsMissingKeywords');
  const kwBadge = document.getElementById('keywordCoverageBadge');
  const kwBar = document.getElementById('keywordCoverageBar');

  if (matchKw) {
    matchKw.innerHTML = (ats.matching_keywords || []).map(k => `<span class="skill-badge strong">${k}</span>`).join('');
  }
  if (missKw) {
    missKw.innerHTML = (ats.missing_keywords || []).map(k => `<span class="skill-badge must-learn">${k}</span>`).join('');
  }

  const total = (ats.matching_keywords || []).length + (ats.missing_keywords || []).length;
  const pct = total > 0 ? Math.round(((ats.matching_keywords || []).length / total) * 100) : 85;
  if (kwBadge) kwBadge.textContent = `${pct}% Coverage`;
  if (kwBar) kwBar.style.width = `${pct}%`;

  const insList = document.getElementById('atsInsertionsList');
  if (insList) {
    insList.innerHTML = (ats.recommended_insertions || []).map(ins => `
      <div style="padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
        <div style="font-weight: 700; font-size: 0.85rem; color: var(--primary-light); margin-bottom: 0.2rem;">${ins.keyword}</div>
        <div style="font-size: 0.8rem; color: var(--text-secondary);">${ins.recommendation}</div>
      </div>
    `).join('');
  }
}

function renderJobMatchDetails(jobMatch, targetJob) {
  document.getElementById('jobMatchPageScore').textContent = `${jobMatch.overall_match_score || 90}%`;
  updateSvgRing('jobMatchPageRing', jobMatch.overall_match_score || 90);
  document.getElementById('jobMatchRoleNameDisplay').textContent = targetJob.title || 'Python Developer';

  document.getElementById('jobMatchQualDetail').textContent = (jobMatch.qualification_match || {}).detail || 'Degree matches requirements.';
  document.getElementById('jobMatchExpDetail').textContent = (jobMatch.experience_match || {}).detail || 'Experience level aligned.';

  const matchedWrap = document.getElementById('jobMatchSkillsMatched');
  const missingWrap = document.getElementById('jobMatchSkillsMissing');
  const matchCount = document.getElementById('jobMatchMatchedCount');
  const missCount = document.getElementById('jobMatchMissingCount');

  if (matchedWrap) {
    matchedWrap.innerHTML = (jobMatch.matching_skills || []).map(s => `<span class="skill-badge strong">${s}</span>`).join('');
  }
  if (missingWrap) {
    missingWrap.innerHTML = (jobMatch.missing_skills || []).map(s => `<span class="skill-badge must-learn">${s}</span>`).join('');
  }
  if (matchCount) matchCount.textContent = (jobMatch.matching_skills || []).length;
  if (missCount) missCount.textContent = (jobMatch.missing_skills || []).length;
}

function renderMultiJobMatrix(recommendations) {
  const container = document.getElementById('multiJobCardsContainer');
  if (!container) return;

  container.innerHTML = recommendations.map(r => `
    <div class="glass-card" style="border-top: 3px solid ${r.is_best_match ? 'var(--accent-emerald)' : 'var(--primary)'};">
      ${r.is_best_match ? `<div class="badge" style="background: rgba(16, 185, 129, 0.2); color: var(--accent-emerald); margin-bottom: 0.5rem;"><i class="fa-solid fa-crown"></i> Best Match</div>` : ''}
      <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.2rem;">${r.job_title}</h3>
      <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.75rem;">${r.salary_range}</div>

      <div style="font-size: 1.8rem; font-weight: 800; color: ${r.overall_match_score > 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)'}; margin-bottom: 0.5rem;">
        ${r.overall_match_score}%
      </div>
      <div class="match-bar-container">
        <div class="match-bar-fill" style="width: ${r.overall_match_score}%;"></div>
      </div>

      <div style="margin-top: 1rem; font-size: 0.8rem;">
        <div style="font-weight: 600; color: var(--accent-emerald); margin-bottom: 0.3rem;">Matching (${(r.matching_skills || []).length}):</div>
        <div class="skill-badges-wrap" style="margin-bottom: 0.75rem;">
          ${(r.matching_skills || []).slice(0, 3).map(s => `<span class="skill-badge strong" style="font-size: 0.7rem;">${s}</span>`).join('')}
        </div>
        <div style="font-weight: 600; color: var(--accent-rose); margin-bottom: 0.3rem;">Missing (${(r.missing_skills || []).length}):</div>
        <div class="skill-badges-wrap">
          ${(r.missing_skills || []).slice(0, 3).map(s => `<span class="skill-badge must-learn" style="font-size: 0.7rem;">${s}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

function renderRoleRecommendations(recommendations) {
  const list = document.getElementById('jobRecommendationsList');
  if (!list) return;

  list.innerHTML = recommendations.map((r, idx) => `
    <div class="glass-card" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="font-size: 1.4rem; font-weight: 800; color: var(--primary-light);">#${idx + 1}</div>
        <div>
          <h3 style="font-size: 1.1rem; font-weight: 700;">${r.job_title}</h3>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${r.salary_range} • <span style="color: var(--accent-emerald);">${r.demand}</span></div>
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary);">${r.overall_match_score}% Match</div>
        <button class="btn btn-primary btn-sm" onclick="selectRoleAndNavigate('${r.job_id}')">Analyze Role</button>
      </div>
    </div>
  `).join('');
}

function selectRoleAndNavigate(jobId) {
  const select = document.getElementById('globalJobSelect');
  if (select) select.value = jobId;
  fetchCurrentIntelligence(jobId);
  appRouter.navigate('view-job-match');
}

function renderRoadmapAndGaps(jobMatch, roadmap) {
  const gapClass = jobMatch.skill_gap_classification || {};
  const mustWrap = document.getElementById('gapMustLearnWrap');
  const recWrap = document.getElementById('gapRecommendedWrap');
  const strWrap = document.getElementById('gapStrongWrap');

  if (mustWrap) mustWrap.innerHTML = (gapClass.must_learn || []).map(s => `<span class="skill-badge must-learn">${s}</span>`).join('') || '<span style="font-size: 0.8rem; color: var(--text-muted);">None</span>';
  if (recWrap) recWrap.innerHTML = (gapClass.recommended || []).map(s => `<span class="skill-badge recommended">${s}</span>`).join('') || '<span style="font-size: 0.8rem; color: var(--text-muted);">None</span>';
  if (strWrap) strWrap.innerHTML = (gapClass.strong_match || []).map(s => `<span class="skill-badge strong">${s}</span>`).join('') || '<span style="font-size: 0.8rem; color: var(--text-muted);">None</span>';

  const stepsList = document.getElementById('roadmapStepsList');
  if (stepsList) {
    stepsList.innerHTML = roadmap.map(step => `
      <div class="glass-card" style="margin-bottom: 1rem; border-left: 3px solid var(--primary);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
          <div style="font-weight: 700; font-size: 0.95rem;">Step ${step.step}: ${step.title}</div>
          <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: var(--primary-light);">${step.duration}</span>
        </div>
        <div style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
          <strong>Topics:</strong> ${(step.topics || []).join(', ')}
        </div>
        <div style="font-size: 0.8rem; color: var(--accent-cyan); margin-bottom: 0.35rem;">
          <strong>Hands-On Project:</strong> ${step.project}
        </div>
        <div style="font-size: 0.78rem; color: var(--text-muted);">
          <strong>Resource:</strong> ${step.resource}
        </div>
      </div>
    `).join('');
  }
}

function renderCareerPath(paths) {
  const container = document.getElementById('careerPathStagesWrap');
  if (!container) return;

  const path = paths[0] || {};
  container.innerHTML = `
    <div class="glass-card" style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--primary-light); margin-bottom: 1.25rem;">
        <i class="fa-solid fa-road"></i> ${path.track_name || 'Software Engineering Track'}
      </h3>
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        ${(path.stages || []).map(stg => `
          <div class="glass-card" style="border-left: 4px solid ${stg.stage_num === 1 ? 'var(--accent-emerald)' : 'var(--border-color)'};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <h4 style="font-size: 1rem; font-weight: 700;">Stage ${stg.stage_num}: ${stg.title}</h4>
              <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald); font-weight: 700;">${stg.salary}</span>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">Experience Target: ${stg.experience} • <span style="color: var(--primary-light); font-weight: 600;">${stg.status}</span></div>
            <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${stg.core_focus}</p>
            <div class="skill-badges-wrap">
              ${(stg.key_skills || []).map(s => `<span class="skill-badge" style="font-size: 0.72rem;">${s}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderInterviewStudio(interviewData) {
  const list = document.getElementById('interviewQuestionsList');
  const badge = document.getElementById('interviewReadinessBadge');
  if (badge) badge.textContent = `Readiness: ${interviewData.interview_readiness_score || 84}/100`;
  if (!list) return;

  list.innerHTML = (interviewData.questions || []).map((q, idx) => `
    <div class="glass-card" style="margin-bottom: 1.25rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
        <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: var(--primary-light);">${q.category}</span>
        <span style="font-size: 0.75rem; color: var(--text-muted);">${q.difficulty}</span>
      </div>
      <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem;">Q${idx + 1}: ${q.question}</h3>
      <div style="padding: 0.75rem; background: rgba(255, 255, 255, 0.03); border-radius: var(--radius-sm); margin-bottom: 0.6rem;">
        <div style="font-weight: 700; font-size: 0.8rem; color: var(--accent-emerald); margin-bottom: 0.25rem;">🎯 Suggested STAR Model Answer:</div>
        <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4;">${q.suggested_answer}</p>
      </div>
      <div style="font-size: 0.78rem; color: var(--text-muted);">
        <strong>Talking Points:</strong> ${(q.talking_points || []).join(' • ')}
      </div>
    </div>
  `).join('');
}

function renderConsistencyAndAchievements(suggestions, achievements) {
  const sugList = document.getElementById('consistencySuggestionsList');
  const achList = document.getElementById('achievementDetectorList');

  if (sugList) {
    sugList.innerHTML = suggestions.map(s => `
      <div style="padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); border-left: 3px solid var(--accent-amber);">
        <div style="font-weight: 700; font-size: 0.85rem; color: var(--accent-amber);">${s.title}</div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">${s.message}</div>
      </div>
    `).join('');
  }

  if (achList) {
    achList.innerHTML = achievements.map(a => `
      <div style="padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); border-left: 3px solid ${a.type === 'verified' ? 'var(--accent-emerald)' : 'var(--primary)'};">
        <div style="font-weight: 600; font-size: 0.82rem; color: var(--text-primary); font-style: italic;">"${a.original}"</div>
        <div style="font-size: 0.78rem; color: var(--primary-light); margin-top: 0.35rem;"><strong>Analysis:</strong> ${a.suggestion}</div>
      </div>
    `).join('');
  }
}

function renderPrintableReport(data) {
  const res = data.resume_data || {};
  document.getElementById('reportCandidateName').textContent = res.name || 'Candidate';
  document.getElementById('reportCandidateTitle').textContent = res.title || 'Software Professional';
  document.getElementById('reportCandidateContact').textContent = `${res.email || ''} | ${res.phone || ''}`;

  document.getElementById('reportResumeScore').textContent = `${(data.resume_score || {}).overall_score || 92}%`;
  document.getElementById('reportAtsScore').textContent = `${(data.ats_analysis || {}).ats_score || 88}/100`;
  document.getElementById('reportBestJobMatch').textContent = `${(data.job_match || {}).overall_match_score || 90}%`;
  document.getElementById('reportReadinessScore').textContent = `${(data.job_readiness || {}).overall_readiness || 85}/100`;

  const topSkillsWrap = document.getElementById('reportTopSkills');
  const missSkillsWrap = document.getElementById('reportMissingSkills');

  if (topSkillsWrap) {
    topSkillsWrap.innerHTML = (res.detected_skills || []).slice(0, 8).map(s => `<span class="skill-badge strong">${s}</span>`).join('');
  }
  if (missSkillsWrap) {
    missSkillsWrap.innerHTML = ((data.job_match || {}).missing_skills || []).slice(0, 6).map(s => `<span class="skill-badge must-learn">${s}</span>`).join('');
  }
}

// ============================================================================
// 4. 15 NEW ADVANCED AI MODULE RENDERERS
// ============================================================================

// 1. AI Job Tracker
async function fetchJobApplications() {
  try {
    const res = await fetch('/api/tracker');
    const data = await res.json();
    if (data.status === 'success') {
      renderJobKanban(data.applications || []);
    }
  } catch (err) {
    console.error('Error fetching job tracker apps:', err);
  }
}

function renderJobKanban(apps) {
  const stages = ['Applied', 'Interview', 'Offer', 'Rejected'];
  const countMap = { 'Applied': 0, 'Interview': 0, 'Offer': 0, 'Rejected': 0 };

  stages.forEach(stg => {
    const list = document.getElementById(`kanban${stg}List`);
    if (list) list.innerHTML = '';
  });

  apps.forEach(app => {
    const stage = app.stage || 'Applied';
    countMap[stage] = (countMap[stage] || 0) + 1;
    const list = document.getElementById(`kanban${stage}List`);
    if (list) {
      const card = document.createElement('div');
      card.className = 'kanban-card';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
          <strong style="font-size: 0.9rem;">${app.company}</strong>
          <span class="stage-badge stage-${stage.toLowerCase()}">${stage}</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-primary); margin-bottom: 0.3rem;">${app.position}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.4rem;">${app.salary || '$90k - $120k'} • Applied: ${app.applied_date}</div>
        <p style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.3; margin-bottom: 0.5rem;">${app.notes || 'Application submitted.'}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.4rem;">
          <select onchange="updateJobStage('${app.id}', this.value)" style="font-size: 0.72rem; padding: 2px 4px; background: transparent; color: var(--text-muted); border: 1px solid var(--border-color); border-radius: 4px;">
            <option value="Applied" ${stage === 'Applied' ? 'selected' : ''}>Move: Applied</option>
            <option value="Interview" ${stage === 'Interview' ? 'selected' : ''}>Move: Interview</option>
            <option value="Offer" ${stage === 'Offer' ? 'selected' : ''}>Move: Offer</option>
            <option value="Rejected" ${stage === 'Rejected' ? 'selected' : ''}>Move: Closed</option>
          </select>
          <button onclick="deleteJobApp('${app.id}')" style="background: none; border: none; color: var(--accent-rose); cursor: pointer; font-size: 0.75rem;"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;
      list.appendChild(card);
    }
  });

  document.getElementById('appliedCount').textContent = countMap['Applied'] || 0;
  document.getElementById('interviewCount').textContent = countMap['Interview'] || 0;
  document.getElementById('offerCount').textContent = countMap['Offer'] || 0;
  document.getElementById('rejectedCount').textContent = countMap['Rejected'] || 0;
  document.getElementById('sidebarTrackerBadge').textContent = apps.length;
}

async function updateJobStage(id, newStage) {
  try {
    await fetch('/api/tracker', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, stage: newStage })
    });
    fetchJobApplications();
  } catch (err) {
    console.error('Error updating stage:', err);
  }
}

async function deleteJobApp(id) {
  try {
    await fetch(`/api/tracker?id=${id}`, { method: 'DELETE' });
    fetchJobApplications();
  } catch (err) {
    console.error('Error deleting app:', err);
  }
}

// 2. Resume-to-LinkedIn Optimizer
function renderLinkedInOptimizer(data) {
  const hList = document.getElementById('linkedinHeadlinesList');
  const mList = document.getElementById('linkedinMismatchesList');
  const textarea = document.getElementById('linkedinAboutTextarea');

  if (hList) {
    hList.innerHTML = (data.suggested_headlines || []).map((h, i) => `
      <div style="padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 0.85rem; font-weight: 600;">Option ${i + 1}: ${h}</span>
        <button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText('${h.replace(/'/g, "\\'")}')"><i class="fa-regular fa-copy"></i></button>
      </div>
    `).join('');
  }

  if (mList) {
    mList.innerHTML = (data.profile_mismatches || []).map(m => `
      <div style="padding: 0.75rem; background: rgba(245, 158, 11, 0.08); border-radius: var(--radius-sm); border-left: 3px solid var(--accent-amber);">
        <div style="font-weight: 700; font-size: 0.85rem; color: var(--accent-amber);">${m.issue}</div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">${m.suggestion}</div>
      </div>
    `).join('');
  }

  if (textarea) {
    textarea.value = data.about_section || '';
  }
}

// 3. GitHub & Portfolio Analyzer
function renderPortfolioAnalysis(data) {
  document.getElementById('githubQualityScore').textContent = `${data.overall_github_score || 85}/100`;
  document.getElementById('githubReposCount').textContent = `${data.repositories_analyzed || 3} Repos`;
  document.getElementById('githubTopRepoName').textContent = data.top_recommended_repo_for_job || 'smart-resume-ai';

  const rList = document.getElementById('githubReposList');
  const mList = document.getElementById('githubMissingList');

  if (rList) {
    rList.innerHTML = (data.repos || []).map(r => `
      <div style="padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
          <strong style="color: var(--primary-light); font-size: 0.9rem;">${r.repo_name}</strong>
          <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald);">Score: ${r.quality_score}/100</span>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.4rem;">⭐ ${r.stars} Stars • 🍴 ${r.forks} Forks • <span style="color: var(--accent-cyan);">${r.job_relevance}</span></div>
        <div class="skill-badges-wrap">
          ${(r.tech_stack || []).map(t => `<span class="skill-badge" style="font-size: 0.7rem;">${t}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }

  if (mList) {
    mList.innerHTML = (data.missing_elements || []).map(m => `
      <div style="padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); border-left: 3px solid var(--accent-amber);">
        <div style="font-weight: 700; font-size: 0.85rem; color: var(--accent-amber);">${m.item}</div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">${m.impact}</div>
      </div>
    `).join('');
  }
}

// 4. Salary Insights
function renderSalaryInsights(data) {
  document.getElementById('salaryEstimatedValue').textContent = data.estimated_market_salary || '$86,000 - $108,000';
  document.getElementById('salaryReadinessScore').textContent = `${data.salary_readiness_score || 86} / 100`;
  document.getElementById('salaryTargetRole').textContent = data.target_role || 'Python Developer';

  const tList = document.getElementById('salaryTierBenchmarksList');
  const hList = document.getElementById('salaryHighRoiSkillsList');

  if (tList) {
    tList.innerHTML = Object.entries(data.market_benchmarks || {}).map(([tier, sal]) => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0; border-bottom: 1px solid var(--border-color); font-size: 0.85rem;">
        <span style="font-weight: 600;">${tier}</span>
        <span style="color: var(--accent-emerald); font-weight: 700;">${sal}</span>
      </div>
    `).join('');
  }

  if (hList) {
    hList.innerHTML = (data.high_roi_skills || []).map(s => `
      <div style="padding: 0.75rem; background: rgba(6, 182, 212, 0.08); border-radius: var(--radius-sm); border-left: 3px solid var(--accent-cyan);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: var(--text-primary); font-size: 0.85rem;">${s.skill}</strong>
          <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald); font-weight: 700;">${s.salary_boost}</span>
        </div>
        <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.25rem;">${s.reason}</div>
      </div>
    `).join('');
  }
}

// 5. Job Scam / Risk Checker
function renderScamResults(data) {
  const card = document.getElementById('scamResultsCard');
  if (!card) return;
  card.style.display = 'block';

  document.getElementById('scamVerdictTitle').innerHTML = `<i class="fa-solid fa-shield-halved"></i> ${data.risk_level}`;
  document.getElementById('scamTrustScoreBadge').textContent = `Trust Score: ${data.trust_score}/100`;

  const list = document.getElementById('scamRedFlagsList');
  if (data.red_flags && data.red_flags.length > 0) {
    list.innerHTML = data.red_flags.map(rf => `
      <div style="padding: 0.75rem; background: rgba(244, 63, 94, 0.1); border-left: 3px solid var(--accent-rose); border-radius: var(--radius-sm);">
        <div style="font-weight: 700; color: var(--accent-rose); font-size: 0.85rem;">${rf.severity}: ${rf.title}</div>
        <div style="font-size: 0.8rem; color: var(--text-primary); margin-top: 0.2rem;">${rf.detail}</div>
      </div>
    `).join('');
  } else {
    list.innerHTML = `
      <div style="padding: 0.75rem; background: rgba(16, 185, 129, 0.1); border-left: 3px solid var(--accent-emerald); border-radius: var(--radius-sm);">
        <div style="font-weight: 700; color: var(--accent-emerald); font-size: 0.85rem;">Clean Posting Verified</div>
        <div style="font-size: 0.8rem; color: var(--text-primary); margin-top: 0.2rem;">No suspicious payment demands or unverified messenger interviews detected.</div>
      </div>
    `;
  }
}

// 6. Resume Language & Tone Checker
function renderToneCheck(data) {
  document.getElementById('toneRating').textContent = data.tone_rating || 'Professional';
  document.getElementById('toneActivePct').textContent = data.active_voice_percentage || '82%';
  document.getElementById('toneReadability').textContent = data.readability_score || 'Grade 10';

  const cList = document.getElementById('toneClichesList');
  const sList = document.getElementById('toneActiveSuggestionsList');

  if (cList) {
    cList.innerHTML = (data.overused_cliches_detected || []).map(c => `
      <span class="badge" style="background: rgba(245, 158, 11, 0.15); color: var(--accent-amber);">${c}</span>
    `).join('');
  }

  if (sList) {
    sList.innerHTML = (data.active_voice_suggestions || []).map(s => `
      <div style="padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
        <div style="font-size: 0.78rem; color: var(--accent-rose); text-decoration: line-through; margin-bottom: 0.2rem;">${s.passive}</div>
        <div style="font-size: 0.82rem; color: var(--accent-emerald); font-weight: 600;">➔ ${s.active}</div>
      </div>
    `).join('');
  }
}

// 7. One-Click Resume Templates
function renderLiveResumePreview(theme) {
  const container = document.getElementById('liveResumePreviewContainer');
  if (!container || !appState.currentIntelligence) return;

  const res = appState.currentIntelligence.resume_data || {};
  container.className = `resume-live-sheet ${theme}`;

  container.innerHTML = `
    <div style="border-bottom: 2px solid #333; padding-bottom: 1rem; margin-bottom: 1.25rem;">
      <h1 style="font-size: 1.8rem; font-weight: 800; color: #0f172a; margin-bottom: 0.2rem;">${res.name || 'Candidate Name'}</h1>
      <div style="font-size: 1rem; font-weight: 600; color: #475569; margin-bottom: 0.3rem;">${res.title || 'Software Developer'}</div>
      <div style="font-size: 0.82rem; color: #64748b;">${res.email || 'contact@email.com'} • ${res.phone || ''} • ${res.location || ''} • ${res.github || ''}</div>
    </div>

    <div style="margin-bottom: 1.25rem;">
      <h3 style="font-size: 0.95rem; font-weight: 700; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem; margin-bottom: 0.5rem;">Professional Summary</h3>
      <p style="font-size: 0.85rem; color: #334155; line-height: 1.5;">${res.summary || ''}</p>
    </div>

    <div style="margin-bottom: 1.25rem;">
      <h3 style="font-size: 0.95rem; font-weight: 700; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem; margin-bottom: 0.5rem;">Technical Skills</h3>
      <p style="font-size: 0.85rem; color: #334155;"><strong>Key Skills:</strong> ${(res.detected_skills || []).join(', ')}</p>
    </div>

    <div style="margin-bottom: 1.25rem;">
      <h3 style="font-size: 0.95rem; font-weight: 700; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem; margin-bottom: 0.5rem;">Work Experience</h3>
      ${(res.experience || []).map(e => `
        <div style="margin-bottom: 0.85rem;">
          <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 0.88rem; color: #0f172a;">
            <span>${e.role} — ${e.company}</span>
            <span style="color: #64748b; font-size: 0.8rem;">${e.duration}</span>
          </div>
          <ul style="padding-left: 1.2rem; font-size: 0.82rem; color: #334155; margin-top: 0.3rem;">
            ${(e.bullets || []).map(b => `<li>${b}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>

    <div>
      <h3 style="font-size: 0.95rem; font-weight: 700; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem; margin-bottom: 0.5rem;">Featured Projects</h3>
      ${(res.projects || []).map(p => `
        <div style="margin-bottom: 0.65rem;">
          <div style="font-weight: 700; font-size: 0.86rem; color: #0f172a;">${p.title} <span style="font-weight: 400; font-size: 0.78rem; color: #64748b;">(${p.tech})</span></div>
          <p style="font-size: 0.82rem; color: #334155; margin-top: 0.2rem;">${p.description}</p>
        </div>
      `).join('')}
    </div>
  `;
}

// 8. Regional Telugu Language Support
function renderTeluguGuidance(data) {
  document.getElementById('teluguWelcomeText').textContent = data.welcome_message_tel || '';
  document.getElementById('teluguAtsExpl').textContent = data.ats_explanation_tel || '';
  document.getElementById('teluguSkillGapExpl').textContent = data.skill_gap_tel || '';

  const gList = document.getElementById('teluguGlossaryList');
  if (gList) {
    gList.innerHTML = (data.quick_translations || []).map(t => `
      <div style="padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
        <strong style="color: var(--primary-light); font-size: 0.85rem;">${t.term}:</strong>
        <div style="font-size: 0.85rem; color: var(--text-primary); margin-top: 0.2rem;" class="telugu-text">${t.meaning_tel}</div>
      </div>
    `).join('');
  }
}

function speakTeluguAudio() {
  const text = document.getElementById('teluguWelcomeText').textContent;
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'te-IN'; // Telugu locale
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  } else {
    alert('Speech synthesis is not supported in this browser.');
  }
}

// 9. Mock Interview Voice Mode (Web Speech API)
function setupVoiceMockInterview() {
  if (appState.voiceQuestions.length > 0) {
    renderCurrentVoiceQuestion();
  }

  // Setup Web Speech Recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    appState.speechRecognitionInstance = new SpeechRecognition();
    appState.speechRecognitionInstance.continuous = true;
    appState.speechRecognitionInstance.interimResults = true;

    appState.speechRecognitionInstance.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      document.getElementById('voiceTranscriptText').textContent = transcript;
      analyzeVoiceTranscript(transcript);
    };

    appState.speechRecognitionInstance.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      stopVoiceRecording();
    };
  }
}

function renderCurrentVoiceQuestion() {
  const q = appState.voiceQuestions[appState.voiceCurrentQIndex] || { question: 'Tell me about your most challenging technical project.' };
  document.getElementById('voiceCurrentQIndex').textContent = appState.voiceCurrentQIndex + 1;
  document.getElementById('voiceCurrentQuestionText').textContent = `"${q.question}"`;
}

function speakCurrentQuestion() {
  const q = appState.voiceQuestions[appState.voiceCurrentQIndex];
  if (!q) return;

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(q.question);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

function toggleVoiceRecording() {
  if (appState.isRecordingVoice) {
    stopVoiceRecording();
  } else {
    startVoiceRecording();
  }
}

function startVoiceRecording() {
  if (!appState.speechRecognitionInstance) {
    alert('Web Speech API is not supported in this browser. Please use Chrome/Edge.');
    return;
  }
  try {
    appState.speechRecognitionInstance.start();
    appState.isRecordingVoice = true;
    document.getElementById('voiceMicRecordBtn').classList.add('recording');
    document.getElementById('voiceStatusBadge').textContent = 'Listening...';
    document.getElementById('voiceRecordLabel').textContent = 'Listening to your answer... Click again to finish.';
    document.querySelectorAll('.voice-bar').forEach(b => b.classList.add('active'));
  } catch (err) {
    console.error('Error starting recognition:', err);
  }
}

function stopVoiceRecording() {
  if (appState.speechRecognitionInstance && appState.isRecordingVoice) {
    appState.speechRecognitionInstance.stop();
  }
  appState.isRecordingVoice = false;
  document.getElementById('voiceMicRecordBtn').classList.remove('recording');
  document.getElementById('voiceStatusBadge').textContent = 'Answer Recorded';
  document.getElementById('voiceRecordLabel').textContent = 'Answer recorded. Check delivery feedback below.';
  document.querySelectorAll('.voice-bar').forEach(b => b.classList.remove('active'));
}

function analyzeVoiceTranscript(text) {
  const words = text.toLowerCase().split(/\s+/);
  const fillers = ['umm', 'um', 'uh', 'like', 'actually', 'basically', 'you know', 'aa', 'ah'];
  let count = 0;
  words.forEach(w => {
    if (fillers.includes(w)) count++;
  });

  document.getElementById('voiceFillerWordsCount').textContent = `${count} detected (${count === 0 ? 'Excellent articulation!' : 'Try pausing silently instead.'})`;
  document.getElementById('voiceClarityScore').textContent = count <= 2 ? '94% (High Confidence)' : '78% (Moderate)';
}

// 10. Networking Assistant
function renderNetworkingTemplates(data) {
  const container = document.getElementById('networkingTemplatesContainer');
  if (!container) return;

  const templates = [
    { title: 'Recruiter LinkedIn Connection Message (300 Char Limit)', key: 'linkedin_connection', text: data.linkedin_connection },
    { title: 'Employee / Alumni Referral Request', key: 'referral_request', text: data.referral_request },
    { title: 'HR Application Follow-up Email', key: 'hr_follow_up', text: data.hr_follow_up },
    { title: 'Post-Interview Thank You Email', key: 'thank_you_email', text: data.thank_you_email },
    { title: 'Offer Acceptance & Salary Negotiation', key: 'offer_negotiation', text: data.offer_negotiation }
  ];

  container.innerHTML = templates.map(t => `
    <div class="glass-card">
      <div class="card-header">
        <h3 class="card-title" style="font-size: 0.95rem;"><i class="fa-solid fa-envelope"></i> ${t.title}</h3>
        <button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('net_${t.key}').value); alert('Copied to clipboard!');">
          <i class="fa-regular fa-copy"></i> Copy
        </button>
      </div>
      <textarea id="net_${t.key}" rows="${t.key === 'linkedin_connection' ? 3 : 6}" class="form-control" style="font-size: 0.85rem; line-height: 1.5;">${t.text || ''}</textarea>
    </div>
  `).join('');
}

// 11. Company Research Assistant
function renderCompanyResearch(data) {
  document.getElementById('dossierCompanyName').textContent = `${data.company_name} Engineering Dossier`;
  document.getElementById('dossierIndustryBadge').textContent = data.industry_domain || 'Technology';

  const techWrap = document.getElementById('dossierTechStack');
  const cultList = document.getElementById('dossierCultureList');
  const topList = document.getElementById('dossierTopicsList');

  if (techWrap) techWrap.innerHTML = (data.key_technologies || []).map(t => `<span class="skill-badge strong">${t}</span>`).join('');
  if (cultList) cultList.innerHTML = (data.culture_pillars || []).map(c => `<div style="margin-bottom: 0.4rem;">• ${c}</div>`).join('');
  if (topList) topList.innerHTML = (data.likely_interview_topics || []).map(tp => `<div style="margin-bottom: 0.4rem;">• ${tp}</div>`).join('');
  document.getElementById('dossierWhyJoinAnswer').textContent = data.why_join_us_answer || '';
}

// 12. Application Success Predictor
function renderSuccessPredictor(data) {
  document.getElementById('predictorProbPct').textContent = `${data.success_probability_pct || 88}%`;
  document.getElementById('predictorTierRating').textContent = data.tier_rating || '🔥 High Probability';

  const fList = document.getElementById('predictorFactorsList');
  const bList = document.getElementById('predictorBoostersList');

  if (fList) {
    fList.innerHTML = (data.weighted_factors || []).map(f => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem;">
        <span>${f.factor} (${f.weight}):</span>
        <strong style="color: var(--accent-emerald);">${f.score}%</strong>
      </div>
    `).join('');
  }

  if (bList) {
    bList.innerHTML = (data.actionable_probability_boosters || []).map(b => `
      <div style="margin-bottom: 0.4rem;">⚡ ${b}</div>
    `).join('');
  }
}

// 13. Career Goal Planner
function renderCareerGoalPlan(data) {
  document.getElementById('goalReadinessBadge').textContent = data.current_readiness || '35% Complete';
  const container = document.getElementById('goalPhasesContainer');
  if (!container) return;

  container.innerHTML = (data.phases || []).map(p => `
    <div class="glass-card" style="border-left: 4px solid var(--accent-cyan);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
        <h4 style="font-size: 0.95rem; font-weight: 700;">Phase ${p.phase}: ${p.title}</h4>
        <span class="badge" style="background: rgba(6, 182, 212, 0.15); color: var(--accent-cyan);">${p.duration}</span>
      </div>
      <ul style="padding-left: 1.1rem; font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.4rem;">
        ${(p.milestones || []).map(m => `<li>${m}</li>`).join('')}
      </ul>
      <div style="font-size: 0.8rem; color: var(--accent-emerald);"><strong>Tangible Deliverable:</strong> ${p.deliverable}</div>
    </div>
  `).join('');
}

// 14. Freelance, Internship & Open Source Recommendations
function renderFreelanceInternships(data) {
  const iList = document.getElementById('freelanceInternshipsList');
  const gList = document.getElementById('freelanceGigsList');
  const oList = document.getElementById('freelanceOpenSourceList');

  if (iList) {
    iList.innerHTML = (data.internships || []).map(i => `
      <div style="padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
        <strong style="color: var(--primary-light); font-size: 0.85rem;">${i.title}</strong>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${i.company} • ${i.location}</div>
        <div style="font-size: 0.78rem; color: var(--accent-emerald); font-weight: 700; margin-top: 0.2rem;">${i.stipend}</div>
      </div>
    `).join('');
  }

  if (gList) {
    gList.innerHTML = (data.freelance_gigs || []).map(g => `
      <div style="padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
        <strong style="color: var(--accent-emerald); font-size: 0.85rem;">${g.title}</strong>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${g.platform} • ${g.duration}</div>
        <div style="font-size: 0.78rem; color: var(--primary-light); font-weight: 700; margin-top: 0.2rem;">Budget: ${g.budget}</div>
      </div>
    `).join('');
  }

  if (oList) {
    oList.innerHTML = (data.open_source_repos || []).map(o => `
      <div style="padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
        <strong style="color: var(--accent-cyan); font-size: 0.85rem;">${o.repo_name}</strong>
        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.2rem;">${o.description}</div>
        <div style="font-size: 0.72rem; color: var(--accent-amber); margin-top: 0.2rem;">⭐ ${o.stars} • 🎯 ${o.good_first_issues} Good First Issues</div>
      </div>
    `).join('');
  }
}

// 15. Recruiter View Mode (10-Second Eye Tracking)
function renderRecruiterView(data) {
  document.getElementById('recruiterFirstImpression').textContent = `${data.first_impression_score || 92}/100`;
  document.getElementById('recruiterScanTime').textContent = data.scan_time_seconds || '7.4 sec';

  const ecList = document.getElementById('recruiterEyeCatchersList');
  const igList = document.getElementById('recruiterIgnoredList');
  const wsList = document.getElementById('recruiterWhyShortlist');
  const wrList = document.getElementById('recruiterWhyReject');

  if (ecList) {
    ecList.innerHTML = (data.eye_catcher_sections || []).map(ec => `
      <div class="heat-highlight-high">
        <strong style="color: #ef4444; font-size: 0.85rem;">${ec.section} (${ec.heat}):</strong>
        <div style="font-size: 0.8rem; color: var(--text-primary); margin-top: 0.2rem;">${ec.impression}</div>
      </div>
    `).join('');
  }

  if (igList) {
    igList.innerHTML = (data.skipped_or_low_heat_sections || []).map(ig => `
      <div class="heat-highlight-low">
        <strong style="color: var(--text-muted); font-size: 0.85rem;">${ig.section} (${ig.heat}):</strong>
        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">${ig.reason}</div>
      </div>
    `).join('');
  }

  if (wsList) {
    wsList.innerHTML = (data.why_shortlist || []).map(w => `
      <div style="display: flex; gap: 0.5rem; margin-bottom: 0.4rem; font-size: 0.82rem;">
        <i class="fa-solid fa-check" style="color: var(--accent-emerald); margin-top: 3px;"></i>
        <span>${w}</span>
      </div>
    `).join('');
  }

  if (wrList) {
    wrList.innerHTML = (data.why_reject_risk_points || []).map(r => `
      <div style="display: flex; gap: 0.5rem; margin-bottom: 0.4rem; font-size: 0.82rem;">
        <i class="fa-solid fa-xmark" style="color: var(--accent-rose); margin-top: 3px;"></i>
        <span>${r}</span>
      </div>
    `).join('');
  }
}

// ============================================================================
// 5. EVENT LISTENERS & INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  appRouter.init();
  fetchCurrentIntelligence('python_developer');

  // Global Job Selector
  const jobSelect = document.getElementById('globalJobSelect');
  if (jobSelect) {
    jobSelect.addEventListener('change', (e) => {
      fetchCurrentIntelligence(e.target.value);
    });
  }

  // Theme Toggle
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      const icon = document.getElementById('themeIcon');
      if (document.body.classList.contains('light-theme')) {
        icon.className = 'fa-solid fa-sun';
      } else {
        icon.className = 'fa-solid fa-moon';
      }
    });
  }

  // Telugu Audio Speaker
  const telAudioBtn = document.getElementById('speakTeluguAudioBtn');
  if (telAudioBtn) {
    telAudioBtn.addEventListener('click', speakTeluguAudio);
  }

  // Telugu Nav Toggle
  const telLangBtn = document.getElementById('teluguLangToggleBtn');
  if (telLangBtn) {
    telLangBtn.addEventListener('click', () => {
      appRouter.navigate('view-telugu');
    });
  }

  // Voice Mock Interview Handlers
  const voiceSpeakBtn = document.getElementById('voiceSpeakQuestionBtn');
  if (voiceSpeakBtn) voiceSpeakBtn.addEventListener('click', speakCurrentQuestion);

  const voiceNextBtn = document.getElementById('voiceNextQuestionBtn');
  if (voiceNextBtn) {
    voiceNextBtn.addEventListener('click', () => {
      if (appState.voiceQuestions.length > 0) {
        appState.voiceCurrentQIndex = (appState.voiceCurrentQIndex + 1) % appState.voiceQuestions.length;
        renderCurrentVoiceQuestion();
      }
    });
  }

  const voiceMicBtn = document.getElementById('voiceMicRecordBtn');
  if (voiceMicBtn) voiceMicBtn.addEventListener('click', toggleVoiceRecording);

  // Resume Template Switcher
  document.querySelectorAll('.template-card-preview').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.template-card-preview').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const theme = card.getAttribute('data-template');
      appState.activeTemplateTheme = theme;
      renderLiveResumePreview(theme);
    });
  });

  // Scam Checker Button
  const scamBtn = document.getElementById('runScamCheckBtn');
  if (scamBtn) {
    scamBtn.addEventListener('click', async () => {
      const jd = document.getElementById('scamJdInput').value;
      const comp = document.getElementById('scamCompanyInput').value;
      const sal = document.getElementById('scamSalaryInput').value;
      const res = await fetch('/api/scam-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_description: jd, company_name: comp, salary_claim: sal })
      });
      const data = await res.json();
      renderScamResults(data);
    });
  }

  // Job Tracker Modal
  const openJobModalBtn = document.getElementById('openAddJobModalBtn');
  const jobModal = document.getElementById('addJobModal');
  const closeJobModalBtn = document.getElementById('closeAddJobModalBtn');
  const cancelJobModalBtn = document.getElementById('cancelAddJobBtn');
  const saveJobModalBtn = document.getElementById('saveJobApplicationBtn');

  if (openJobModalBtn && jobModal) {
    openJobModalBtn.addEventListener('click', () => jobModal.classList.add('open'));
  }
  if (closeJobModalBtn && jobModal) {
    closeJobModalBtn.addEventListener('click', () => jobModal.classList.remove('open'));
  }
  if (cancelJobModalBtn && jobModal) {
    cancelJobModalBtn.addEventListener('click', () => jobModal.classList.remove('open'));
  }
  if (saveJobModalBtn && jobModal) {
    saveJobModalBtn.addEventListener('click', async () => {
      const comp = document.getElementById('modalJobCompany').value;
      const pos = document.getElementById('modalJobPosition').value;
      const stg = document.getElementById('modalJobStage').value;
      const sal = document.getElementById('modalJobSalary').value;
      const fd = document.getElementById('modalJobFollowUp').value;
      const nts = document.getElementById('modalJobNotes').value;

      if (!comp || !pos) {
        alert('Please provide Company and Position.');
        return;
      }

      await fetch('/api/tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: comp, position: pos, stage: stg, salary: sal, follow_up_date: fd, notes: nts })
      });

      jobModal.classList.remove('open');
      fetchJobApplications();
    });
  }

  // Networking Outreach Generator
  const outreachBtn = document.getElementById('generateOutreachBtn');
  if (outreachBtn) {
    outreachBtn.addEventListener('click', async () => {
      const comp = document.getElementById('netCompanyInput').value;
      const role = document.getElementById('netRoleInput').value;
      const contact = document.getElementById('netContactInput').value;
      const res = await fetch('/api/networking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: comp, role_title: role, contact_name: contact })
      });
      const data = await res.json();
      renderNetworkingTemplates(data);
    });
  }

  // Company Research Generator
  const compResearchBtn = document.getElementById('runCompanyResearchBtn');
  if (compResearchBtn) {
    compResearchBtn.addEventListener('click', async () => {
      const comp = document.getElementById('companyResearchNameInput').value;
      const res = await fetch('/api/company-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: comp, target_role: 'Software Engineer' })
      });
      const data = await res.json();
      renderCompanyResearch(data);
    });
  }

  // Career Goal Plan Generator
  const goalBtn = document.getElementById('generateGoalPlanBtn');
  if (goalBtn) {
    goalBtn.addEventListener('click', async () => {
      const goal = document.getElementById('goalTitleInput').value;
      const months = document.getElementById('goalTimeframeSelect').value;
      const res = await fetch('/api/career-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal_title: goal, timeframe_months: months })
      });
      const data = await res.json();
      renderCareerGoalPlan(data);
    });
  }

  // Sample Resume Switcher in Upload View
  document.querySelectorAll('.sample-resume-card').forEach(card => {
    card.addEventListener('click', async () => {
      document.querySelectorAll('.sample-resume-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const sampleId = card.getAttribute('data-sample');
      appState.activeSample = sampleId;

      const formData = new FormData();
      formData.append('sample_id', sampleId);
      const res = await fetch('/api/upload-resume', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.status === 'success') {
        appState.currentIntelligence = data;
        renderAllViews(data);
        appRouter.navigate('view-dashboard');
      }
    });
  });

  // File Upload Handlers
  const dropzone = document.getElementById('uploadDropzone');
  const fileInput = document.getElementById('resumeFileInput');
  const fileInfoBar = document.getElementById('fileInfoBar');
  const startBtn = document.getElementById('startAnalysisBtn');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = 'var(--primary)'; });
    dropzone.addEventListener('dragleave', () => { dropzone.style.borderColor = 'var(--border-color)'; });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--border-color)';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelected(e.dataTransfer.files[0]);
      }
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelected(e.target.files[0]);
      }
    });
  }

  function handleFileSelected(file) {
    if (fileInfoBar) {
      fileInfoBar.style.display = 'flex';
      document.getElementById('uploadedFileName').textContent = file.name;
      document.getElementById('uploadedFileSize').textContent = `${Math.round(file.size / 1024)} KB • Ready for extraction`;
    }
  }

  if (startBtn) {
    startBtn.addEventListener('click', async () => {
      if (fileInput.files && fileInput.files[0]) {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        const res = await fetch('/api/upload-resume', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.status === 'success') {
          appState.currentIntelligence = data;
          renderAllViews(data);
          appRouter.navigate('view-dashboard');
        }
      }
    });
  }

  // AI Chatbot Drawer
  const chatDrawer = document.getElementById('chatbotDrawer');
  const openChatBtn = document.getElementById('openChatbotBtn');
  const triggerChatBtn = document.getElementById('chatbotToggleTrigger');
  const closeChatBtn = document.getElementById('closeChatbotBtn');
  const sendChatBtn = document.getElementById('sendChatBtn');
  const chatInput = document.getElementById('chatInput');

  function toggleChat() {
    chatDrawer.classList.toggle('open');
  }

  if (openChatBtn) openChatBtn.addEventListener('click', toggleChat);
  if (triggerChatBtn) triggerChatBtn.addEventListener('click', toggleChat);
  if (closeChatBtn) closeChatBtn.addEventListener('click', toggleChat);

  if (sendChatBtn && chatInput) {
    sendChatBtn.addEventListener('click', handleUserChatMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleUserChatMessage();
    });
  }

  document.querySelectorAll('.chat-prompt-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (chatInput) chatInput.value = prompt;
      handleUserChatMessage();
    });
  });

  async function handleUserChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendChatMessage(text, 'user');
    chatInput.value = '';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text })
      });
      const data = await res.json();
      appendChatMessage(data.reply || "I've analyzed your question against your resume.", 'bot', data.suggested_actions);
    } catch (err) {
      appendChatMessage("Error contacting assistant.", 'bot');
    }
  }

  function appendChatMessage(text, sender, actions = []) {
    const box = document.getElementById('chatbotMessages');
    if (!box) return;
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    
    // Simple Markdown parsing for chat bubbles
    let formattedText = text
      .replace(/### (.*?)\n/g, '<strong style="display:block; margin: 4px 0; color: var(--primary-light);">$1</strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.3); padding: 2px 4px; border-radius: 4px; font-family: monospace;">$1</code>')
      .replace(/\n/g, '<br>');

    bubble.innerHTML = formattedText;

    // If bot returned action chips, append them
    if (sender === 'bot' && actions && actions.length > 0) {
      const chipsWrap = document.createElement('div');
      chipsWrap.style.marginTop = '8px';
      chipsWrap.style.display = 'flex';
      chipsWrap.style.flexWrap = 'wrap';
      chipsWrap.style.gap = '4px';
      
      actions.forEach(act => {
        const chip = document.createElement('span');
        chip.className = 'chat-prompt-chip';
        chip.textContent = act;
        chip.onclick = () => {
          if (chatInput) chatInput.value = act;
          handleUserChatMessage();
        };
        chipsWrap.appendChild(chip);
      });
      bubble.appendChild(chipsWrap);
    }

    box.appendChild(bubble);
    box.scrollTop = box.scrollHeight;
  }
});
