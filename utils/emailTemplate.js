// 🌟 Common Wrapper (for consistent design)
const baseTemplate = (title, body) => `
  <div style="
    max-width: 600px;
    margin: auto;
    font-family: 'Segoe UI', Arial, sans-serif;
    background: #0f172a;
    color: #e5e7eb;
    border-radius: 16px;
    overflow: hidden;
  ">
    <div style="background:#020617;padding:20px;text-align:center;">
      <h1 style="color:#38bdf8;margin:0;">EduAI Hub</h1>
    </div>

    <div style="padding:24px;">
      <h2 style="color:#f8fafc;">${title}</h2>
      ${body}
    </div>

    <div style="
      background:#020617;
      padding:14px;
      text-align:center;
      font-size:13px;
      color:#94a3b8;
    ">
      © ${new Date().getFullYear()} EduAI Hub · Learn Smarter with AI
    </div>
  </div>
`;

// ================= STUDENT EMAILS =================
function studentSignupTemplate(name) {
  return baseTemplate(
    `🎉 Welcome ${name}!`,
    `
    <p>We’re excited to have you as part of <b>EduAI Hub</b> 🎓</p>

    <p>
      🚀 Your <b>student account</b> has been created successfully.<br/>
      You can now explore AI-powered learning, Digital library, and progress tracking.
    </p>

    <p style="margin-top:20px;">
      💡 <b>Tip:</b> Log in daily to unlock personalized learning insights.
    </p>

    <p style="margin-top:30px;">
      Happy Learning!<br/>
      <b>– EduAI Team 🤖</b>
    </p>

    <img
      src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZDFjM2Q0Z2p4dTZpZDJmZ3p4eXJqY2VtM3V6Y2F2Z2Z0cGZxYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l0HlNaQ6gWfllcjDO/giphy.gif"
      alt="Learning"
      style="width:100%;border-radius:12px;margin-top:20px;"
    />
    `
  );
}

function studentLoginTemplate(name) {
  return baseTemplate(
    `👋 Welcome Back, ${name}`,
    `
    <p>You’ve successfully logged in to your <b>EduAI student account</b>.</p>

    <p>
      📚 Continue your learning journey and achieve your goals with AI assistance.
    </p>

    <p style="margin-top:24px;">
      🚨 If this login wasn’t you, please contact support immediately.
    </p>

    <p style="margin-top:30px;">
      Keep growing,<br/>
      <b>– EduAI Team 🚀</b>
    </p>
    `
  );
}

// ================= TEACHER EMAILS =================
function teacherSignupTemplate(name) {
  return baseTemplate(
    `📘 Welcome Teacher ${name}`,
    `
    <p>
      Your <b>EduAI Teacher Account</b> has been created successfully.
    </p>

    <p>
      👨‍🏫 As a teacher, you can manage students, track performance, and deliver AI-powered education.
    </p>

    <div style="
      background:#1e293b;
      padding:16px;
      border-left:4px solid #f43f5e;
      margin-top:20px;
      border-radius:8px;
    ">
      <b style="color:#fca5a5;">⚠️ IMPORTANT – CONFIDENTIAL</b>
      <p style="margin:8px 0 0 0;">
        <b>Teacher Secret Code:</b> <code>TEACHER@2025</code><br/>
        ❌ Do <b>NOT</b> share this code with students.<br/>
        Sharing this code may result in account suspension.
      </p>
    </div>

    <p style="margin-top:30px;">
      Thank you for shaping the future of learning.<br/>
      <b>– EduAI Admin Team 🧠</b>
    </p>

    <img
      src="https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUybDk1MHNleHZmanI1MXFhb2MwNzcwcTl3cDJ2cHhvZ3ZvNTNhMXkwMyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/kDjypgTGS3WLyrE6FL/giphy.gif"
      alt="Teaching"
      style="width:100%;border-radius:12px;margin-top:20px;"
    />
    `
  );
}

function teacherLoginTemplate(name) {
  return baseTemplate(
    `🔐 Teacher Login Alert`,
    `
    <p>Hello <b>${name}</b>,</p>

    <p>
      You have successfully logged in to your <b>EduAI Teacher Account</b>.
    </p>

    <div style="
      background:#1e293b;
      padding:16px;
      border-left:4px solid #38bdf8;
      margin-top:20px;
      border-radius:8px;
    ">
      <b>🛡️ Security Reminder</b>
      <p style="margin:8px 0 0 0;">
        Never share your login credentials or <b>Teacher Secret Code</b> with students.
        <br/>
        Secret Code: <code>TEACHER@2025</code>
      </p>
    </div>

    <p style="margin-top:28px;">
      🚨 If this login wasn’t you, please contact support immediately.
    </p>

    <p style="margin-top:30px;">
      Stay secure,<br/>
      <b>– EduAI Security Team 🔒</b>
    </p>
    `
  );
}

// ================= RESET OTP EMAIL =================
function resetOTPTemplate(name, otp) {
  return baseTemplate(
    "🔐 Password Reset Request",
    `
    <p>Hello <b>${name}</b>,</p>

    <p>Your OTP for password reset is:</p>

    <h1 style="letter-spacing:6px;color:#38bdf8;text-align:center;">
      ${otp}
    </h1>

    <p>This OTP is valid for <b>10 minutes</b>.</p>
    <p>If you didn’t request this, ignore this email.</p>

    <br/>
    <b>– EduAI Security Team</b>
    `
  );
}

module.exports = {
  studentSignupTemplate,
  studentLoginTemplate,
  teacherSignupTemplate,
  teacherLoginTemplate,
  resetOTPTemplate,
};
