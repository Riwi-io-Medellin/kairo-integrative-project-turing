import { Router } from 'express';

const router = Router();

const fakeUser = {
  id: 1,
  full_name: 'Coder Demo',
  email: 'coder.demo@kairo.local',
  role: 'coder',
  first_login: false,
};

let inMemoryPlan = null;
let inMemoryNotifications = [
  {
    id: '101',
    title: 'Keep it up!',
    message: 'Great progress this week. Keep your pace steady.',
    type: 'encouragement',
    tl_name: 'TL Mentor',
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: '102',
    title: 'Focus area',
    message: 'Focus on SQL joins before Friday challenge.',
    type: 'improvement',
    tl_name: 'TL Mentor',
    is_read: false,
    created_at: new Date().toISOString(),
  },
];

const toClientUser = (user = fakeUser) => ({
  id: user.id,
  fullName: user.full_name,
  email: user.email,
  role: user.role,
  clan: 'turing',
  firstLogin: Boolean(user.first_login),
});

const createBasicPlan = () => ({
  id: 9001,
  currentDay: 1,
  isComplete: false,
  completedDays: {},
  moodleStatusSnapshot: {
    averageScore: 68,
    currentWeek: 1,
  },
  planContent: {
    plan_type: 'interpretive',
    learning_style_applied: 'mixed',
    targeted_soft_skill: 'autonomy',
    summary: '4-week reinforcement plan generated in basic mode.',
    weeks: Array.from({ length: 4 }, (_, weekIdx) => ({
      week: weekIdx + 1,
      focus: `Week ${weekIdx + 1} reinforcement`,
      days: Array.from({ length: 5 }, (_, dayIdx) => ({
        day: weekIdx * 5 + dayIdx + 1,
        technical_activity: {
          title: `Tech drill ${weekIdx * 5 + dayIdx + 1}`,
          description: 'Practice coding kata and solve one exercise.',
          duration_minutes: 45,
          difficulty: 'intermediate',
          resources: ['https://developer.mozilla.org/en-US/docs/Web/JavaScript'],
        },
        soft_skill_activity: {
          title: 'Reflection checkpoint',
          description: 'Write 5 lines about blockers and next action.',
          duration_minutes: 20,
        },
      })),
    })),
  },
});

router.get('/health', (req, res) => {
  res.json({
    status: 'active',
    mode: 'basic',
    uptime: process.uptime(),
    database: { connected: false, reason: 'basic mode uses mock data' },
  });
});

router.get('/auth/check', (req, res) => {
  res.json({ authenticated: true, user: toClientUser() });
});

router.get('/auth/me', (req, res) => {
  res.json({ user: toClientUser() });
});

router.post('/auth/login', (req, res) => {
  const { email, role } = req.body || {};
  const normalizedRole = String(role || fakeUser.role).toLowerCase() === 'tl' ? 'tl' : 'coder';

  res.json({
    success: true,
    message: 'Basic login successful',
    user: toClientUser({
      ...fakeUser,
      email: email || fakeUser.email,
      role: normalizedRole,
    }),
  });
});

router.post('/auth/register', (req, res) => {
  const { full_name, email } = req.body || {};
  res.status(201).json({
    success: true,
    message: 'Basic register successful',
    user: toClientUser({
      ...fakeUser,
      full_name: full_name || fakeUser.full_name,
      email: email || fakeUser.email,
      first_login: true,
    }),
  });
});

router.post('/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out in basic mode' });
});

router.patch('/auth/complete-onboarding', (req, res) => {
  res.json({
    success: true,
    user: toClientUser({ ...fakeUser, first_login: false }),
  });
});

router.post('/auth/verify-otp', (req, res) => {
  res.json({
    success: true,
    message: 'OTP verified in basic mode',
    user: toClientUser(),
  });
});

router.post('/auth/resend-otp', (req, res) => {
  res.json({ success: true, message: 'OTP resent in basic mode' });
});

router.get('/coder/dashboard', (req, res) => {
  res.json({
    user: {
      ...toClientUser(),
      moduleName: 'Web Development Foundations',
      moduleTotalWeeks: 8,
    },
    activePlan: {
      id: 501,
      title: 'Reinforcement Sprint',
      priority_level: 'high',
    },
    riskFlags: [{ id: 1, level: 'medium', reason: 'Average score below target' }],
    progress: {
      currentWeek: 3,
      averageScore: 68.4,
      weeksCompletedCount: 2,
      strugglingTopics: ['SQL joins', 'Array methods'],
    },
    softSkills: {
      autonomy: 3,
      timeManagement: 3,
      problemSolving: 4,
      communication: 4,
      teamwork: 4,
      average: 3.6,
      learningStyle: 'auditory',
      assessedAt: new Date().toISOString(),
    },
    performanceTests: [
      {
        id: 1,
        moduleName: 'JavaScript Basics',
        score: 72,
        status: 'approved',
        takenAt: new Date().toISOString(),
      },
    ],
    notifications: {
      unread: inMemoryNotifications.filter((n) => !n.is_read).length,
      notifications: inMemoryNotifications,
    },
  });
});

router.patch('/coder/feedback/:id/read', (req, res) => {
  const id = String(req.params.id);
  inMemoryNotifications = inMemoryNotifications.map((item) =>
    String(item.id) === id ? { ...item, is_read: true } : item
  );

  res.json({ success: true });
});

router.get('/coder/plan', (req, res) => {
  if (!inMemoryPlan) {
    return res.json({ hasPlan: false });
  }

  return res.json({ hasPlan: true, plan: inMemoryPlan });
});

router.post('/coder/plan/request', (req, res) => {
  inMemoryPlan = createBasicPlan();
  return res.status(201).json({ success: true, planId: inMemoryPlan.id });
});

router.post('/diagnostics', (req, res) => {
  const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
  const avg = answers.length
    ? answers.reduce((sum, value) => sum + Number(value || 0), 0) / answers.length
    : 3;

  res.status(201).json({
    success: true,
    diagnostic: {
      average: Number(avg.toFixed(2)),
      learning_style: avg >= 4 ? 'visual' : avg >= 3 ? 'auditory' : 'mixed',
    },
  });
});

router.post('/diagnostics/soft-skills', (req, res) => {
  const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
  const avg = answers.length
    ? answers.reduce((sum, value) => sum + Number(value || 0), 0) / answers.length
    : 0;

  const learning_style = avg >= 4 ? 'visual' : avg >= 3 ? 'auditory' : 'mixed';

  res.status(201).json({
    ok: true,
    summary: {
      total_answers: answers.length,
      average_score: Number(avg.toFixed(2)),
      learning_style,
    },
  });
});

router.get('/tl/dashboard', (req, res) => {
  res.json({
    tl: {
      id: 200,
      fullName: 'TL Mentor',
      email: 'tl.mentor@kairo.local',
      role: 'tl',
    },
    clan: 'turing',
    overview: {
      totalCoders: 3,
      completedOnboarding: 2,
      pendingOnboarding: 1,
      highRiskCoders: 1,
      clanAvgScore: 76.3,
    },
    softSkillsAverage: {
      autonomy: 3.4,
      time_management: 3.1,
      problem_solving: 3.8,
      communication: 3.6,
      teamwork: 4.0,
    },
    coders: [
      {
        id: 1,
        full_name: 'Coder Demo',
        email: 'coder.demo@kairo.local',
        clan: 'turing',
        first_login: false,
        average_score: 68,
        current_week: 3,
        learning_style: 'auditory',
        risk_level: 'high',
        autonomy: 3,
        time_management: 2,
        problem_solving: 4,
        communication: 3,
        teamwork: 4,
      },
      {
        id: 2,
        full_name: 'Coder Sample',
        email: 'coder.sample@kairo.local',
        clan: 'turing',
        first_login: true,
        average_score: 75,
        current_week: 2,
        learning_style: 'visual',
        risk_level: 'medium',
        autonomy: 3,
        time_management: 3,
        problem_solving: 3,
        communication: 4,
        teamwork: 4,
      },
      {
        id: 3,
        full_name: 'Coder Stable',
        email: 'coder.stable@kairo.local',
        clan: 'turing',
        first_login: false,
        average_score: 86,
        current_week: 4,
        learning_style: 'kinesthetic',
        risk_level: 'low',
        autonomy: 4,
        time_management: 4,
        problem_solving: 4,
        communication: 4,
        teamwork: 5,
      },
    ],
  });
});

router.post('/tl/feedback', (req, res) => {
  const { coderId, feedbackText, feedbackType } = req.body || {};

  if (!coderId || !feedbackText || !feedbackType) {
    return res.status(400).json({ error: 'coderId, feedbackText and feedbackType are required' });
  }

  const nextId = String(Date.now());
  inMemoryNotifications.unshift({
    id: nextId,
    title: feedbackType === 'encouragement' ? 'Encouragement' : 'Feedback',
    message: feedbackText,
    type: feedbackType,
    tl_name: 'TL Mentor',
    is_read: false,
    created_at: new Date().toISOString(),
  });

  return res.status(201).json({ success: true, id: nextId });
});

router.get('/notifications', (req, res) => {
  res.json({
    unread: inMemoryNotifications.filter((n) => !n.is_read).length,
    notifications: inMemoryNotifications,
  });
});

// SSE stream — basic mode sends a "connected" ping then stays open
router.get('/notifications/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial heartbeat so the client knows it is connected
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', mode: 'basic' })}\n\n`);

  // Keep connection alive with periodic heartbeats
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    res.end();
  });
});

// Mark all notifications as read
router.post('/notifications/read', (req, res) => {
  inMemoryNotifications = inMemoryNotifications.map((n) => ({ ...n, is_read: true }));
  res.json({ success: true });
});

// Delete a single notification
router.delete('/notifications/:id', (req, res) => {
  const id = String(req.params.id);
  const before = inMemoryNotifications.length;
  inMemoryNotifications = inMemoryNotifications.filter((n) => String(n.id) !== id);
  if (inMemoryNotifications.length === before) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  res.json({ success: true });
});

export default router;
